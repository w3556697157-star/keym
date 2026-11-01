# KeyM — Local Agent API Key Manager

> A fully local, server-less desktop app for managing API keys. Runs on macOS / Windows / Linux.
> 中文版本: [README.md](./README.md)

## Features

- **Multi-account, local-only**: accounts live in a local SQLite database; each account's keys are isolated and can only be managed by its owner
- **Reversible encryption**: API keys are stored with AES-256-GCM; the decryption key is derived from *login password + per-account random salt* via Argon2id and never persisted or uploaded
- **Masked listing**: the key table only shows masked previews (e.g. `sk-****3f8d`); plaintext exists in memory only briefly
- **Password-gated export**: single-key and export-all both require re-entering the account password; the backend re-verifies and re-derives the key before decrypting
- **Password-gated edits**: saving an edited key shows an in-app confirmation ("changes cannot be reverted") requiring the account password
- **Online validity checks**: models-endpoint checks for OpenAI, Anthropic, Google Gemini, DeepSeek, Moonshot, Zhipu AI, Tongyi Qianwen, Doubao (Volcano Ark), Baidu Qianfan, iFlytek Spark, SiliconFlow, OpenRouter, xAI, Mistral, Cohere, StepFun, 360 AI, etc.; network failures are recorded as "unverified", not "invalid"
- **Dashboard**: total / active / expired / invalid stat cards, security overview, one-click check-all
- **Key management**: pagination, provider filter, status filter, create / edit / delete / export / check
- **Import / export**: batch JSON import & export (exported files contain plaintext and are password-gated)
- **Change password**: after verifying the old password, all ciphertexts are decrypted with the old key and re-encrypted with a new key inside a single transaction
- **Cloud sync**: menu entry kept; feature under development (current builds are fully local)

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 (Rust) |
| Frontend | React 18 + TypeScript + Vite |
| Storage | SQLite (rusqlite, bundled) |
| Crypto | AES-256-GCM (aes-gcm) + Argon2id (argon2) |
| Checks | reqwest (rustls) |

## Project Layout

```
keym/
├── src/                  # React frontend
│   ├── api.ts            # Tauri command wrappers
│   ├── pages/            # login / dashboard / keys / cloud sync / security / settings / about
│   └── components/       # sidebar / key modal / export modal / password modal / confirm modal
└── src-tauri/            # Rust backend
    └── src/
        ├── lib.rs        # Tauri commands (auth, CRUD, import/export, change password, checks)
        ├── crypto.rs     # Argon2id KDF + AES-256-GCM encrypt/decrypt
        ├── db.rs         # SQLite schema & queries
        └── check.rs      # provider validation endpoints
```

## Development Prerequisites

- Node.js ≥ 18
- Rust stable (on Windows without MSVC you can use the GNU toolchain: `rustup default stable-x86_64-pc-windows-gnu`)
- Platform dependencies:
  - **Windows**: WebView2 Runtime (preinstalled on Win10/11); MSVC or MinGW toolchain
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libsqlite3-dev`, `libssl-dev`, etc.

## Run & Build

```bash
npm install
npm run tauri dev      # development mode
npm run tauri build    # bundle installers (MSI/NSIS on Windows, dmg/app on macOS, deb/AppImage on Linux)
```

> Note: with the Windows GNU toolchain, do not enable the `cdylib` crate-type for the lib (it triggers "export ordinal too large"); `staticlib + rlib` is sufficient for desktop.

## Security Design

- Password hash: Argon2id (PHC string stored in DB)
- Encryption key: `Argon2id(password, per-account salt)` → 32 bytes, held in memory only, zeroized on logout
- Ciphertext format: `base64(nonce || ciphertext)` (AES-256-GCM)
- Secondary verification: export / import / edit-save all require re-entering the account password, verified independently on the backend
- **Forgetting your password means saved keys cannot be recovered** (warned in multiple places in the app)

## Import / Export JSON Format

```json
{
  "app": "KeyM",
  "version": 1,
  "exported_at": "2026-11-01T12:00:00+08:00",
  "username": "admin",
  "keys": [
    {
      "name": "production key",
      "provider": "OpenAI",
      "api_key": "sk-xxxx (plaintext)",
      "expires_at": null,
      "notes": ""
    }
  ]
}
```

Entries missing `name` or `api_key` are skipped on import; `expires_at` accepts `yyyy-MM-dd` or RFC3339.

## License

For learning and personal use only.
