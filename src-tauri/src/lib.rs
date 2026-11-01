use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;
use zeroize::Zeroize;

mod check;
mod crypto;
mod db;

#[derive(Default)]
struct Session {
    user_id: Option<i64>,
    username: Option<String>,
    enc_key: Option<[u8; 32]>,
}

impl Drop for Session {
    fn drop(&mut self) {
        if let Some(mut k) = self.enc_key.take() {
            k.zeroize();
        }
    }
}

struct AppState {
    db_path: PathBuf,
    session: Mutex<Session>,
}

#[derive(Serialize)]
struct UserInfo {
    id: i64,
    username: String,
}

#[derive(Deserialize)]
struct NewKeyPayload {
    name: String,
    provider: String,
    api_key: String,
    expires_at: Option<String>,
    notes: String,
}

#[derive(Deserialize)]
struct UpdateKeyPayload {
    name: String,
    provider: String,
    api_key: Option<String>,
    expires_at: Option<String>,
    notes: String,
}

#[derive(Serialize)]
struct Stats {
    total: usize,
    active: usize,
    expired: usize,
    invalid: usize,
    unknown: usize,
}

fn normalize_expires(exp: Option<String>) -> Result<Option<String>, String> {
    match exp {
        None => Ok(None),
        Some(s) if s.trim().is_empty() => Ok(None),
        Some(s) => {
            // 前端传 yyyy-mm-dd，统一转 RFC3339（当日 23:59:59 本地时区）
            let date = chrono::NaiveDate::parse_from_str(s.trim(), "%Y-%m-%d")
                .map_err(|_| "到期日期格式应为 yyyy-MM-dd".to_string())?;
            let dt = date
                .and_hms_opt(23, 59, 59)
                .ok_or("到期日期非法")?
                .and_local_timezone(chrono::Local)
                .single()
                .ok_or("到期日期非法")?;
            Ok(Some(dt.to_rfc3339()))
        }
    }
}

fn require_session(state: &tauri::State<AppState>) -> Result<(i64, [u8; 32]), String> {
    let sess = state.session.lock().map_err(|e| e.to_string())?;
    match (sess.user_id, sess.enc_key) {
        (Some(uid), Some(key)) => Ok((uid, key)),
        _ => Err("未登录或会话已过期".into()),
    }
}

/// 校验输入密码与当前登录账号一致（二次确认用）
fn verify_session_password(state: &tauri::State<AppState>, password: &str) -> Result<(), String> {
    let username = {
        let sess = state.session.lock().map_err(|e| e.to_string())?;
        sess.username.clone().ok_or("未登录")?
    };
    let conn = db::open(&state.db_path)?;
    let (_, _, hash, _) = db::find_user(&conn, &username)?.ok_or("账号不存在")?;
    if !crypto::verify_password(password, &hash) {
        return Err("密码错误，操作已取消".into());
    }
    Ok(())
}

#[tauri::command]
fn register(username: String, password: String, state: tauri::State<AppState>) -> Result<(), String> {
    let username = username.trim().to_string();
    if username.is_empty() {
        return Err("账号不能为空".into());
    }
    if password.len() < 6 {
        return Err("密码至少 6 位".into());
    }
    let conn = db::open(&state.db_path)?;
    let hash = crypto::hash_password(&password)?;
    let salt = crypto::new_kdf_salt();
    db::create_user(&conn, &username, &hash, &salt)?;
    Ok(())
}

#[tauri::command]
fn login(username: String, password: String, state: tauri::State<AppState>) -> Result<UserInfo, String> {
    let conn = db::open(&state.db_path)?;
    let (id, name, hash, salt) =
        db::find_user(&conn, username.trim())?.ok_or("账号或密码错误，请重试")?;
    if !crypto::verify_password(&password, &hash) {
        return Err("账号或密码错误，请重试".into());
    }
    let key = crypto::derive_key(&password, &salt)?;
    let mut sess = state.session.lock().map_err(|e| e.to_string())?;
    sess.user_id = Some(id);
    sess.username = Some(name.clone());
    sess.enc_key = Some(key);
    Ok(UserInfo { id, username: name })
}

#[tauri::command]
fn logout(state: tauri::State<AppState>) -> Result<(), String> {
    let mut sess = state.session.lock().map_err(|e| e.to_string())?;
    sess.user_id = None;
    sess.username = None;
    if let Some(mut k) = sess.enc_key.take() {
        k.zeroize();
    }
    Ok(())
}

#[tauri::command]
fn current_user(state: tauri::State<AppState>) -> Result<Option<UserInfo>, String> {
    let sess = state.session.lock().map_err(|e| e.to_string())?;
    Ok(match (&sess.user_id, &sess.username) {
        (Some(id), Some(name)) => Some(UserInfo {
            id: *id,
            username: name.clone(),
        }),
        _ => None,
    })
}

#[tauri::command]
fn list_keys(state: tauri::State<AppState>) -> Result<Vec<db::KeyRow>, String> {
    let (uid, _) = require_session(&state)?;
    let conn = db::open(&state.db_path)?;
    db::list_keys(&conn, uid)
}

#[tauri::command]
fn create_key(payload: NewKeyPayload, state: tauri::State<AppState>) -> Result<db::KeyRow, String> {
    let (uid, key) = require_session(&state)?;
    if payload.name.trim().is_empty() {
        return Err("密钥名称不能为空".into());
    }
    if payload.api_key.trim().is_empty() {
        return Err("API Key 不能为空".into());
    }
    let expires = normalize_expires(payload.expires_at)?;
    let enc = crypto::encrypt(&key, payload.api_key.trim())?;
    let prev = crypto::preview(payload.api_key.trim());
    let conn = db::open(&state.db_path)?;
    let id = db::insert_key(
        &conn,
        uid,
        payload.name.trim(),
        payload.provider.trim(),
        &enc,
        &prev,
        expires.as_deref(),
        &payload.notes,
    )?;
    db::get_key(&conn, uid, id)
}

#[tauri::command]
fn update_key(
    id: i64,
    payload: UpdateKeyPayload,
    password: String,
    state: tauri::State<AppState>,
) -> Result<db::KeyRow, String> {
    let (uid, key) = require_session(&state)?;
    // 编辑保存需二次密码确认
    verify_session_password(&state, &password)?;
    let expires = normalize_expires(payload.expires_at)?;
    let new_enc = match payload.api_key.as_deref().map(str::trim) {
        Some(k) if !k.is_empty() => Some((crypto::encrypt(&key, k)?, crypto::preview(k))),
        _ => None,
    };
    let new_enc_ref = new_enc
        .as_ref()
        .map(|(enc, prev)| (enc.as_str(), prev.as_str()));

    let conn = db::open(&state.db_path)?;
    db::update_key(
        &conn,
        uid,
        id,
        payload.name.trim(),
        payload.provider.trim(),
        new_enc_ref,
        expires.as_deref(),
        &payload.notes,
    )?;
    db::get_key(&conn, uid, id)
}

#[tauri::command]
fn delete_key(id: i64, state: tauri::State<AppState>) -> Result<(), String> {
    let (uid, _) = require_session(&state)?;
    let conn = db::open(&state.db_path)?;
    db::delete_key(&conn, uid, id)
}

#[tauri::command]
fn export_key(id: i64, password: String, state: tauri::State<AppState>) -> Result<String, String> {
    // 二次验证：用输入的密码重新校验并派生密钥解密
    let (uid, _) = require_session(&state)?;
    let username = {
        let sess = state.session.lock().map_err(|e| e.to_string())?;
        sess.username.clone().ok_or("未登录")?
    };
    let conn = db::open(&state.db_path)?;
    let (_, _, hash, salt) = db::find_user(&conn, &username)?.ok_or("账号不存在")?;
    if !crypto::verify_password(&password, &hash) {
        return Err("密码错误，无法解密".into());
    }
    let key = crypto::derive_key(&password, &salt)?;
    let enc = db::get_encrypted(&conn, uid, id)?;
    crypto::decrypt(&key, &enc)
}

#[tauri::command]
fn change_password(
    old_password: String,
    new_password: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let (uid, _) = require_session(&state)?;
    if new_password.len() < 6 {
        return Err("新密码至少 6 位".into());
    }
    if old_password == new_password {
        return Err("新密码不能与原密码相同".into());
    }
    let username = {
        let sess = state.session.lock().map_err(|e| e.to_string())?;
        sess.username.clone().ok_or("未登录")?
    };
    let mut conn = db::open(&state.db_path)?;
    let (user_id, _, hash, salt) = db::find_user(&conn, &username)?.ok_or("账号不存在")?;
    if user_id != uid {
        return Err("会话异常，请重新登录".into());
    }
    // 1. 验证原密码
    if !crypto::verify_password(&old_password, &hash) {
        return Err("原密码错误".into());
    }
    let old_key = crypto::derive_key(&old_password, &salt)?;

    // 2. 新盐 + 新密钥 + 新哈希
    let new_salt = crypto::new_kdf_salt();
    let new_key = crypto::derive_key(&new_password, &new_salt)?;
    let new_hash = crypto::hash_password(&new_password)?;

    // 3. 事务内：旧密钥解密全部密文 -> 新密钥重加密 -> 更新凭据
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let rows = db::list_encrypted(&tx, uid)?;
    for (id, enc) in rows {
        let plain = crypto::decrypt(&old_key, &enc)?;
        let new_enc = crypto::encrypt(&new_key, &plain)?;
        db::set_encrypted(&tx, uid, id, &new_enc)?;
    }
    db::update_user_credentials(&tx, uid, &new_hash, &new_salt)?;
    tx.commit().map_err(|e| e.to_string())?;

    // 4. 会话密钥切换为新密钥
    {
        let mut sess = state.session.lock().map_err(|e| e.to_string())?;
        if let Some(mut old) = sess.enc_key.take() {
            old.zeroize();
        }
        sess.enc_key = Some(new_key);
    }
    Ok(())
}

#[tauri::command]
fn export_all(
    password: String,
    path: String,
    state: tauri::State<AppState>,
) -> Result<usize, String> {
    let (uid, _) = require_session(&state)?;
    verify_session_password(&state, &password)?;
    let username = {
        let sess = state.session.lock().map_err(|e| e.to_string())?;
        sess.username.clone().ok_or("未登录")?
    };
    let key = {
        let sess = state.session.lock().map_err(|e| e.to_string())?;
        sess.enc_key.ok_or("未登录")?
    };
    let conn = db::open(&state.db_path)?;
    let rows = db::list_full(&conn, uid)?;

    let mut keys = Vec::with_capacity(rows.len());
    for r in rows {
        let plain = crypto::decrypt(&key, &r.encrypted_key)?;
        keys.push(serde_json::json!({
            "name": r.name,
            "provider": r.provider,
            "api_key": plain,
            "expires_at": r.expires_at,
            "notes": r.notes,
        }));
    }
    let doc = serde_json::json!({
        "app": "KeyM",
        "version": 1,
        "exported_at": chrono::Local::now().to_rfc3339(),
        "username": username,
        "keys": keys,
    });
    let text = serde_json::to_string_pretty(&doc).map_err(|e| e.to_string())?;
    std::fs::write(&path, text).map_err(|e| format!("写入文件失败: {e}"))?;
    Ok(keys.len())
}

#[tauri::command]
fn import_keys(
    password: String,
    path: String,
    state: tauri::State<AppState>,
) -> Result<usize, String> {
    let (uid, _) = require_session(&state)?;
    verify_session_password(&state, &password)?;
    let key = {
        let sess = state.session.lock().map_err(|e| e.to_string())?;
        sess.enc_key.ok_or("未登录")?
    };
    let text = std::fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {e}"))?;
    let doc: serde_json::Value =
        serde_json::from_str(&text).map_err(|_| "文件格式错误：不是合法的 JSON")?;
    let arr = doc
        .get("keys")
        .and_then(|v| v.as_array())
        .ok_or("文件格式错误：缺少 keys 数组")?;

    let conn = db::open(&state.db_path)?;
    let mut count = 0usize;
    for item in arr {
        let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("").trim();
        let api_key = item
            .get("api_key")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .trim();
        if name.is_empty() || api_key.is_empty() {
            continue;
        }
        let provider = item
            .get("provider")
            .and_then(|v| v.as_str())
            .unwrap_or("自定义")
            .trim();
        let notes = item.get("notes").and_then(|v| v.as_str()).unwrap_or("");
        let expires_raw = item.get("expires_at").and_then(|v| v.as_str());
        let expires = match expires_raw {
            Some(s) if s.contains('T') => Some(s.to_string()),
            Some(s) => normalize_expires(Some(s.to_string()))?,
            _ => None,
        };
        let enc = crypto::encrypt(&key, api_key)?;
        let prev = crypto::preview(api_key);
        db::insert_key(
            &conn,
            uid,
            name,
            provider,
            &enc,
            &prev,
            expires.as_deref(),
            notes,
        )?;
        count += 1;
    }
    Ok(count)
}

#[tauri::command]
async fn check_key(id: i64, state: tauri::State<'_, AppState>) -> Result<db::KeyRow, String> {
    let (uid, key) = require_session(&state)?;
    let conn = db::open(&state.db_path)?;
    let item = db::get_key(&conn, uid, id)?;
    let enc = db::get_encrypted(&conn, uid, id)?;
    let plain = crypto::decrypt(&key, &enc)?;
    let (status, msg) = check::check_provider_key(&item.provider, &plain).await;
    db::update_check_result(&conn, uid, id, &status, &msg)?;
    db::get_key(&conn, uid, id)
}

#[tauri::command]
async fn check_all_keys(state: tauri::State<'_, AppState>) -> Result<Vec<db::KeyRow>, String> {
    let (uid, _) = require_session(&state)?;
    let ids = {
        let conn = db::open(&state.db_path)?;
        db::all_key_ids(&conn, uid)?
    };
    for id in ids {
        let _ = check_key(id, state.clone()).await;
    }
    list_keys(state)
}

#[tauri::command]
fn stats(state: tauri::State<AppState>) -> Result<Stats, String> {
    let (uid, _) = require_session(&state)?;
    let conn = db::open(&state.db_path)?;
    let keys = db::list_keys(&conn, uid)?;
    let mut s = Stats {
        total: keys.len(),
        active: 0,
        expired: 0,
        invalid: 0,
        unknown: 0,
    };
    for k in &keys {
        match k.status.as_str() {
            "active" => s.active += 1,
            "expired" => s.expired += 1,
            "invalid" => s.invalid += 1,
            _ => s.unknown += 1,
        }
    }
    Ok(s)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let dir = app
                .path()
                .app_data_dir()
                .map_err(|e| e.to_string())?;
            std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let db_path = dir.join("keym.db");
            db::init(&db_path).map_err(|e| e.to_string())?;
            app.manage(AppState {
                db_path,
                session: Mutex::new(Session::default()),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            register,
            login,
            logout,
            current_user,
            list_keys,
            create_key,
            update_key,
            delete_key,
            export_key,
            change_password,
            export_all,
            import_keys,
            check_key,
            check_all_keys,
            stats,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, _event| {});
}
