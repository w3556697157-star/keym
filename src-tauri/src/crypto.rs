use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::SaltString;
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use rand::RngCore;

/// 使用 Argon2 生成密码校验哈希（PHC 格式，含盐）
pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| format!("密码哈希失败: {e}"))
}

/// 校验密码
pub fn verify_password(password: &str, phc: &str) -> bool {
    let parsed = match PasswordHash::new(phc) {
        Ok(p) => p,
        Err(_) => return false,
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok()
}

/// 生成随机的 KDF 盐（base64）
pub fn new_kdf_salt() -> String {
    let mut buf = [0u8; 16];
    OsRng.fill_bytes(&mut buf);
    B64.encode(buf)
}

/// 用 Argon2id 从密码+盐派生 32 字节加密密钥
pub fn derive_key(password: &str, salt_b64: &str) -> Result<[u8; 32], String> {
    let salt = B64
        .decode(salt_b64)
        .map_err(|e| format!("盐解码失败: {e}"))?;
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), &salt, &mut key)
        .map_err(|e| format!("密钥派生失败: {e}"))?;
    Ok(key)
}

/// AES-256-GCM 加密，返回 base64(nonce || ciphertext)
pub fn encrypt(key: &[u8; 32], plaintext: &str) -> Result<String, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
    let mut nonce = [0u8; 12];
    OsRng.fill_bytes(&mut nonce);
    let ct = cipher
        .encrypt(Nonce::from_slice(&nonce), plaintext.as_bytes())
        .map_err(|e| format!("加密失败: {e}"))?;
    let mut out = Vec::with_capacity(12 + ct.len());
    out.extend_from_slice(&nonce);
    out.extend_from_slice(&ct);
    Ok(B64.encode(out))
}

/// AES-256-GCM 解密 base64(nonce || ciphertext)
pub fn decrypt(key: &[u8; 32], data_b64: &str) -> Result<String, String> {
    let data = B64
        .decode(data_b64)
        .map_err(|e| format!("密文解码失败: {e}"))?;
    if data.len() < 13 {
        return Err("密文长度非法".into());
    }
    let (nonce, ct) = data.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
    let pt = cipher
        .decrypt(Nonce::from_slice(nonce), ct)
        .map_err(|_| "解密失败：密码错误或数据已损坏".to_string())?;
    String::from_utf8(pt).map_err(|e| format!("明文解码失败: {e}"))
}

/// 生成脱敏预览：sk-****3f8d
pub fn preview(api_key: &str) -> String {
    let len = api_key.chars().count();
    if len <= 4 {
        return "****".into();
    }
    let head: String = api_key.chars().take(3).collect();
    let tail: String = api_key
        .chars()
        .rev()
        .take(4)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();
    format!("{head}****{tail}")
}
