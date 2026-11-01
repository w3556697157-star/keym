# KeyM — 本地 Agent API 密钥管理软件

> 完全本地、无服务端的 API Key 管理桌面应用，支持 macOS / Windows / Linux 三端。
> English version: [README_EN.md](./README_EN.md)

## 功能特性

- **多账号本地注册登录**：账号数据存于本地 SQLite，各账号密钥互相隔离，只能 CRUD 自己的密钥
- **可逆加密存储**：API Key 使用 AES-256-GCM 加密入库；解密密钥由「登录密码 + 每账号随机盐」经 Argon2id 派生，不存库、不上传
- **列表只展示密文形态**：密钥列表仅显示脱敏预览（如 `sk-****3f8d`），明文仅在内存中短暂出现
- **导出需二次验证**：单条导出 / 导出全部均需输入账号密码，后端重新验密码并派生密钥解密
- **编辑保存需密码确认**：编辑密钥保存时弹出应用内确认框（提示"修改后无法恢复"），需输入账号密码
- **在线可用性校验**：支持 OpenAI、Anthropic、Google Gemini、DeepSeek、Moonshot、智谱AI、通义千问、豆包(火山方舟)、百度千帆、讯飞星火、硅基流动、OpenRouter、xAI、Mistral、Cohere、阶跃星辰、360智脑 等服务商的 models 接口校验；网络失败记为"未校验"而非"失效"
- **首页仪表盘**：密钥总数 / 可用 / 已过期 / 校验失败 统计卡片 + 安全概况 + 一键校验全部
- **密钥管理**：分页查询、服务商筛选、状态筛选、新建/编辑/删除/导出/校验
- **导入 / 导出**：JSON 格式批量导入导出（导出文件为明文，需密码确认）
- **修改密码**：验证原密码后，用旧密钥解密全部密文、新密钥重加密，同一事务内更新凭据
- **云同步**：菜单保留，功能开发中（当前为完全本地版本）

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Tauri 2（Rust） |
| 前端 | React 18 + TypeScript + Vite |
| 存储 | SQLite（rusqlite，bundled） |
| 加密 | AES-256-GCM（aes-gcm）+ Argon2id（argon2） |
| 校验 | reqwest（rustls） |

## 目录结构

```
keym/
├── src/                  # 前端 React 源码
│   ├── api.ts            # Tauri 命令调用封装
│   ├── pages/            # 登录/仪表盘/密钥管理/云同步/账号安全/设置/关于
│   └── components/       # 侧边栏/密钥弹窗/导出弹窗/密码确认/删除确认
└── src-tauri/            # Rust 后端
    └── src/
        ├── lib.rs        # Tauri 命令（登录/CRUD/导出导入/改密/校验）
        ├── crypto.rs     # Argon2id 派生 + AES-256-GCM 加解密
        ├── db.rs         # SQLite 表结构与查询
        └── check.rs      # 各服务商在线校验端点
```

## 开发环境要求

- Node.js ≥ 18
- Rust stable（Windows 无 MSVC 时可用 GNU 工具链：`rustup default stable-x86_64-pc-windows-gnu`）
- 平台依赖：
  - **Windows**：WebView2 运行时（Win10/11 自带）；MSVC 或 MinGW 工具链
  - **macOS**：Xcode Command Line Tools
  - **Linux**：`libwebkit2gtk-4.1-dev`、`libgtk-3-dev`、`libsqlite3-dev`、`libssl-dev` 等

## 运行与构建

```bash
npm install
npm run tauri dev      # 开发模式运行
npm run tauri build    # 打包（Windows 产出 MSI/NSIS，macOS 产出 dmg/app，Linux 产出 deb/AppImage）
```

> 说明：Windows GNU 工具链下不要启用 lib 的 `cdylib` crate-type（会触发 export ordinal too large），桌面端 `staticlib + rlib` 即可。

## 安全设计

- 密码哈希：Argon2id（PHC 串存库）
- 加密密钥：`Argon2id(登录密码, 每账号随机盐)` → 32 字节，仅存内存，退出登录即 zeroize
- 密文格式：`base64(nonce || ciphertext)`（AES-256-GCM）
- 二次验证：导出/导入/编辑保存均需重新输入账号密码，后端独立验签
- **忘记密码 = 无法还原已保存密钥**（应用内多处警示）

## 导入 / 导出 JSON 格式

```json
{
  "app": "KeyM",
  "version": 1,
  "exported_at": "2026-11-01T12:00:00+08:00",
  "username": "admin",
  "keys": [
    {
      "name": "生产环境密钥",
      "provider": "OpenAI",
      "api_key": "sk-xxxx（明文）",
      "expires_at": null,
      "notes": ""
    }
  ]
}
```

导入时忽略缺少 `name` 或 `api_key` 的条目；`expires_at` 支持 `yyyy-MM-dd` 或 RFC3339。

## 许可证

仅用于学习与个人使用。
