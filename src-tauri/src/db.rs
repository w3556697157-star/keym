use rusqlite::{params, Connection};
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize, Clone)]
pub struct KeyRow {
    pub id: i64,
    pub name: String,
    pub provider: String,
    pub key_preview: String,
    pub created_at: String,
    pub expires_at: Option<String>,
    pub status: String,
    pub notes: String,
    pub last_checked_at: Option<String>,
    pub check_message: String,
}

pub fn init(db_path: &Path) -> Result<(), String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            kdf_salt TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            provider TEXT NOT NULL,
            encrypted_key TEXT NOT NULL,
            key_preview TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'unknown',
            expires_at TEXT,
            notes TEXT NOT NULL DEFAULT '',
            check_message TEXT NOT NULL DEFAULT '',
            last_checked_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
        "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn open(db_path: &Path) -> Result<Connection, String> {
    Connection::open(db_path).map_err(|e| e.to_string())
}

// ---------- users ----------

pub fn create_user(
    conn: &Connection,
    username: &str,
    password_hash: &str,
    kdf_salt: &str,
) -> Result<i64, String> {
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "INSERT INTO users (username, password_hash, kdf_salt, created_at) VALUES (?1,?2,?3,?4)",
        params![username, password_hash, kdf_salt, now],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            "账号已存在".to_string()
        } else {
            e.to_string()
        }
    })?;
    Ok(conn.last_insert_rowid())
}

pub fn find_user(
    conn: &Connection,
    username: &str,
) -> Result<Option<(i64, String, String, String)>, String> {
    let mut stmt = conn
        .prepare("SELECT id, username, password_hash, kdf_salt FROM users WHERE username = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query(params![username])
        .map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some((
            row.get(0).map_err(|e| e.to_string())?,
            row.get(1).map_err(|e| e.to_string())?,
            row.get(2).map_err(|e| e.to_string())?,
            row.get(3).map_err(|e| e.to_string())?,
        )))
    } else {
        Ok(None)
    }
}

// ---------- api_keys ----------

fn row_to_key(row: &rusqlite::Row) -> rusqlite::Result<KeyRow> {
    let status: String = row.get(6)?;
    let expires_at: Option<String> = row.get(7)?;
    // 到期优先：若已过期且不是失效，则显示 expired
    let final_status = if status != "invalid" {
        if let Some(exp) = &expires_at {
            if chrono::DateTime::parse_from_rfc3339(exp)
                .map(|d| d < chrono::Local::now())
                .unwrap_or(false)
            {
                "expired".to_string()
            } else {
                status
            }
        } else {
            status
        }
    } else {
        status
    };
    Ok(KeyRow {
        id: row.get(0)?,
        name: row.get(1)?,
        provider: row.get(2)?,
        key_preview: row.get(3)?,
        created_at: row.get(4)?,
        expires_at,
        status: final_status,
        notes: row.get(5)?,
        last_checked_at: row.get(8)?,
        check_message: row.get(9)?,
    })
}

const SELECT_COLS: &str =
    "id, name, provider, key_preview, created_at, notes, status, expires_at, last_checked_at, check_message";

pub fn list_keys(conn: &Connection, user_id: i64) -> Result<Vec<KeyRow>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM api_keys WHERE user_id = ?1 ORDER BY id DESC"
        ))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![user_id], row_to_key)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

pub fn insert_key(
    conn: &Connection,
    user_id: i64,
    name: &str,
    provider: &str,
    encrypted_key: &str,
    key_preview: &str,
    expires_at: Option<&str>,
    notes: &str,
) -> Result<i64, String> {
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "INSERT INTO api_keys (user_id, name, provider, encrypted_key, key_preview, status, expires_at, notes, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,'unknown',?6,?7,?8,?8)",
        params![user_id, name, provider, encrypted_key, key_preview, expires_at, notes, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

pub fn get_key(conn: &Connection, user_id: i64, id: i64) -> Result<KeyRow, String> {
    conn.query_row(
        &format!("SELECT {SELECT_COLS} FROM api_keys WHERE id = ?1 AND user_id = ?2"),
        params![id, user_id],
        row_to_key,
    )
    .map_err(|_| "密钥不存在或无权限".to_string())
}

pub fn get_encrypted(conn: &Connection, user_id: i64, id: i64) -> Result<String, String> {
    conn.query_row(
        "SELECT encrypted_key FROM api_keys WHERE id = ?1 AND user_id = ?2",
        params![id, user_id],
        |r| r.get(0),
    )
    .map_err(|_| "密钥不存在或无权限".to_string())
}

pub fn update_key(
    conn: &Connection,
    user_id: i64,
    id: i64,
    name: &str,
    provider: &str,
    new_encrypted: Option<(&str, &str)>,
    expires_at: Option<&str>,
    notes: &str,
) -> Result<(), String> {
    let now = chrono::Local::now().to_rfc3339();
    let changed = if let Some((enc, prev)) = new_encrypted {
        conn.execute(
            "UPDATE api_keys SET name=?1, provider=?2, encrypted_key=?3, key_preview=?4, expires_at=?5, notes=?6, status='unknown', updated_at=?7 WHERE id=?8 AND user_id=?9",
            params![name, provider, enc, prev, expires_at, notes, now, id, user_id],
        )
    } else {
        conn.execute(
            "UPDATE api_keys SET name=?1, provider=?2, expires_at=?3, notes=?4, updated_at=?5 WHERE id=?6 AND user_id=?7",
            params![name, provider, expires_at, notes, now, id, user_id],
        )
    }
    .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err("密钥不存在或无权限".into());
    }
    Ok(())
}

pub fn delete_key(conn: &Connection, user_id: i64, id: i64) -> Result<(), String> {
    let changed = conn
        .execute(
            "DELETE FROM api_keys WHERE id = ?1 AND user_id = ?2",
            params![id, user_id],
        )
        .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err("密钥不存在或无权限".into());
    }
    Ok(())
}

pub fn update_check_result(
    conn: &Connection,
    user_id: i64,
    id: i64,
    status: &str,
    message: &str,
) -> Result<(), String> {
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "UPDATE api_keys SET status=?1, check_message=?2, last_checked_at=?3 WHERE id=?4 AND user_id=?5",
        params![status, message, now, id, user_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn all_key_ids(conn: &Connection, user_id: i64) -> Result<Vec<i64>, String> {
    let mut stmt = conn
        .prepare("SELECT id FROM api_keys WHERE user_id = ?1")
        .map_err(|e| e.to_string())?;
    let ids = stmt
        .query_map(params![user_id], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<i64>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(ids)
}

// ---------- 改密 / 导入导出 支持 ----------

#[derive(Debug, Clone)]
pub struct FullKeyRow {
    pub name: String,
    pub provider: String,
    pub encrypted_key: String,
    pub expires_at: Option<String>,
    pub notes: String,
}

/// 列出用户全部密钥的密文（改密时重加密用）
pub fn list_encrypted(conn: &Connection, user_id: i64) -> Result<Vec<(i64, String)>, String> {
    let mut stmt = conn
        .prepare("SELECT id, encrypted_key FROM api_keys WHERE user_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![user_id], |r| Ok((r.get(0)?, r.get(1)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

/// 更新单条密文（改密重加密用）
pub fn set_encrypted(conn: &Connection, user_id: i64, id: i64, enc: &str) -> Result<(), String> {
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "UPDATE api_keys SET encrypted_key=?1, updated_at=?2 WHERE id=?3 AND user_id=?4",
        params![enc, now, id, user_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// 更新账号凭据：密码哈希 + KDF 盐（改密用）
pub fn update_user_credentials(
    conn: &Connection,
    user_id: i64,
    password_hash: &str,
    kdf_salt: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE users SET password_hash=?1, kdf_salt=?2 WHERE id=?3",
        params![password_hash, kdf_salt, user_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// 列出用户全部密钥的完整字段（导出用）
pub fn list_full(conn: &Connection, user_id: i64) -> Result<Vec<FullKeyRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT name, provider, encrypted_key, expires_at, notes FROM api_keys WHERE user_id = ?1 ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![user_id], |r| {
            Ok(FullKeyRow {
                name: r.get(0)?,
                provider: r.get(1)?,
                encrypted_key: r.get(2)?,
                expires_at: r.get(3)?,
                notes: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}
