import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type Locale = "zh" | "en";

const STORAGE_KEY = "keym_locale";

const zh: Record<string, string> = {
  "boot.loading": "加载中…",
  "menu.home": "首页",
  "menu.keys": "Api密钥管理",
  "menu.sync": "云同步",
  "menu.about": "关于我们",
  "menu.settings": "设置",
  "topbar.dashboard": "首页仪表盘",
  "topbar.keys": "Api密钥管理",
  "topbar.sync": "云同步",
  "topbar.security": "账号安全",
  "topbar.settings": "设置",
  "topbar.about": "关于我们",
  "user.security": "账号安全",
  "user.settings": "设置",
  "user.logout": "退出登录",
  "login.accountPh": "账号",
  "login.pwdPh": "密码（至少 6 位）",
  "login.confirmPh": "确认密码",
  "login.submitLogin": "登录",
  "login.submitRegister": "注册并登录",
  "login.loggingIn": "登录中…",
  "login.registering": "注册中…",
  "login.noAccount": "还没有账号？",
  "login.registerNow": "立即注册",
  "login.hasAccount": "已有账号？",
  "login.backLogin": "返回登录",
  "login.tip": "密码用于派生加密密钥，请妥善保管，忘记密码将无法解密已保存的密钥。",
  "dash.total": "密钥总数",
  "dash.active": "可用密钥",
  "dash.expired": "已过期",
  "dash.invalid": "校验失败",
  "dash.overview": "安全概况",
  "dash.checkAll": "一键校验全部",
  "dash.checking": "校验中…",
  "dash.colName": "密钥名称",
  "dash.colValue": "密钥值",
  "dash.colCreated": "创建时间",
  "dash.colStatus": "状态",
  "dash.empty": "暂无密钥，去「Api密钥管理」添加吧",
  "loading": "加载中…",
  "status.active": "启用",
  "status.expired": "已过期",
  "status.invalid": "已失效",
  "status.unknown": "未校验",
  "keys.title": "Api密钥管理",
  "keys.import": "导入",
  "keys.exportAll": "导出全部",
  "keys.newKey": "＋ 新建密钥",
  "keys.allProviders": "全部服务商",
  "keys.allStatus": "全部状态",
  "keys.count": "共 {n} 条",
  "keys.colName": "密钥名称",
  "keys.colProvider": "服务商",
  "keys.colValue": "密钥值（密文）",
  "keys.colCreated": "创建时间",
  "keys.colExpires": "到期时间",
  "keys.colStatus": "状态",
  "keys.colOps": "操作",
  "keys.emptyNoData": "暂无数据，点击右上角「新建密钥」添加",
  "keys.emptyFiltered": "当前筛选条件下暂无数据",
  "keys.opEdit": "编辑",
  "keys.opExport": "导出",
  "keys.opCheck": "校验",
  "keys.opChecking": "校验中",
  "keys.opDelete": "删除",
  "keys.prev": "上一页",
  "keys.next": "下一页",
  "keys.pageInfo": "第 {cur} / {pages} 页",
  "keys.toastDeleted": "密钥「{name}」已删除",
  "keys.toastChecked": "「{name}」校验结果：{status}",
  "keys.toastExported": "导出成功：共 {n} 条密钥已写入文件",
  "keys.toastImported": "导入成功：共导入 {n} 条密钥",
  "keys.exportAllTitle": "导出全部密钥",
  "keys.exportAllWarn": "导出文件包含全部密钥明文，请妥善保管；导出需输入账号密码确认。",
  "keys.exportAllConfirm": "确认并选择保存位置",
  "keys.importTitle": "导入密钥",
  "keys.importWarn": "将从 {path} 导入密钥（JSON 格式），导入需输入账号密码确认。",
  "keys.importConfirm": "确认导入",
  "keys.deleteTitle": "删除密钥",
  "keys.deleteMsg": "确定删除密钥「{name}」吗？删除后无法恢复。",
  "modal.cancel": "取消",
  "modal.back": "返回修改",
  "modal.save": "保存",
  "modal.saving": "保存中…",
  "modal.confirmSave": "确认保存",
  "modal.processing": "处理中…",
  "modal.confirmDelete": "确认删除",
  "modal.close": "关闭",
  "modal.copy": "复制",
  "modal.copied": "已复制",
  "keym.editTitle": "编辑密钥",
  "keym.createTitle": "新建密钥",
  "keym.nameLabel": "密钥名称",
  "keym.namePh": "例如：生产环境密钥",
  "keym.providerLabel": "服务商",
  "keym.keyLabel": "API Key",
  "keym.keyEditHint": "（留空则不修改）",
  "keym.keyPhNew": "sk-...",
  "keym.keyPhEdit": "留空保持原密钥",
  "keym.expiresLabel": "到期时间（可选）",
  "keym.notesLabel": "备注（可选）",
  "keym.confirmWarn": "注意：修改后无法恢复",
  "keym.pwdLabel": "账号密码",
  "keym.pwdPhConfirm": "输入账号密码以确认保存",
  "keym.pwdEmptyErr": "请输入账号密码以确认保存",
  "export.title": "导出密钥「{name}」",
  "export.tip": "请输入当前账号密码，用于解密该密钥的密文。",
  "export.pwdLabel": "账号密码",
  "export.decrypting": "解密中…",
  "export.submit": "解密并导出",
  "export.okTip": "解密成功，请立即妥善保存：",
  "pwd.pwdLabel": "账号密码",
  "pwd.pwdPh": "输入当前账号密码以确认操作",
  "settings.title": "账号信息",
  "settings.account": "当前账号",
  "settings.storage": "数据存储",
  "settings.storageVal": "本地 SQLite（应用数据目录 keym.db）",
  "settings.crypto": "加密方式",
  "settings.cryptoVal": "AES-256-GCM；密钥由登录密码经 Argon2id 派生，不上传、不共享",
  "settings.tip": "注意：修改/忘记密码将导致已保存的密钥无法解密，请谨慎操作。",
  "settings.langTitle": "界面语言",
  "settings.langZh": "简体中文",
  "settings.langEn": "English",
  "settings.langTip": "默认跟随系统语言；手动选择后保存于本机。",
  "security.changeTitle": "修改密码",
  "security.warn":
    "修改密码后，系统会用原密码解密你全部 API 密钥密文，再用新密码重新加密后写回数据库。请确保牢记新密码，忘记密码将无法解密已保存的密钥。",
  "security.oldLabel": "原密码",
  "security.oldPh": "输入当前登录密码",
  "security.newLabel": "新密码（至少 6 位）",
  "security.newPh": "输入新密码",
  "security.confirmLabel": "确认新密码",
  "security.confirmPh": "再次输入新密码",
  "security.ok": "密码修改成功，全部密钥已使用新密码重新加密。",
  "security.submit": "确认修改",
  "security.submitting": "重加密中…",
  "cloud.title": "开发中敬请期待",
  "cloud.desc":
    "云同步功能正在开发中。当前版本为完全本地版本，所有密钥数据仅保存在本机的 SQLite 数据库中，不会上传到任何服务器。",
  "about.p1":
    "KeyM 是一款完全本地的 Agent API Key 管理软件，帮助你安全地存储、管理和校验各类 AI 服务商的 API 密钥。",
  "about.p2":
    "特性：多账号隔离、AES-256-GCM 加密存储、密码派生密钥、一键可用性校验、导出需二次验证。",
  "about.version": "版本：0.1.0",
};

const en: Record<string, string> = {
  "boot.loading": "Loading…",
  "menu.home": "Home",
  "menu.keys": "API Keys",
  "menu.sync": "Cloud Sync",
  "menu.about": "About",
  "menu.settings": "Settings",
  "topbar.dashboard": "Dashboard",
  "topbar.keys": "API Keys",
  "topbar.sync": "Cloud Sync",
  "topbar.security": "Account Security",
  "topbar.settings": "Settings",
  "topbar.about": "About",
  "user.security": "Account Security",
  "user.settings": "Settings",
  "user.logout": "Sign out",
  "login.accountPh": "Username",
  "login.pwdPh": "Password (min 6 chars)",
  "login.confirmPh": "Confirm password",
  "login.submitLogin": "Sign in",
  "login.submitRegister": "Register & sign in",
  "login.loggingIn": "Signing in…",
  "login.registering": "Registering…",
  "login.noAccount": "No account yet?",
  "login.registerNow": "Register now",
  "login.hasAccount": "Already have an account?",
  "login.backLogin": "Back to sign in",
  "login.tip":
    "Your password derives the encryption key. Keep it safe — saved keys cannot be decrypted if you forget it.",
  "dash.total": "Total keys",
  "dash.active": "Active keys",
  "dash.expired": "Expired",
  "dash.invalid": "Check failed",
  "dash.overview": "Security overview",
  "dash.checkAll": "Check all",
  "dash.checking": "Checking…",
  "dash.colName": "Key name",
  "dash.colValue": "Key value",
  "dash.colCreated": "Created",
  "dash.colStatus": "Status",
  "dash.empty": "No keys yet — add one under “API Keys”",
  "loading": "Loading…",
  "status.active": "Active",
  "status.expired": "Expired",
  "status.invalid": "Invalid",
  "status.unknown": "Unverified",
  "keys.title": "API Keys",
  "keys.import": "Import",
  "keys.exportAll": "Export all",
  "keys.newKey": "＋ New key",
  "keys.allProviders": "All providers",
  "keys.allStatus": "All statuses",
  "keys.count": "{n} item(s)",
  "keys.colName": "Key name",
  "keys.colProvider": "Provider",
  "keys.colValue": "Key value (cipher)",
  "keys.colCreated": "Created",
  "keys.colExpires": "Expires",
  "keys.colStatus": "Status",
  "keys.colOps": "Actions",
  "keys.emptyNoData": "No data — click “New key” to add one",
  "keys.emptyFiltered": "No data for the current filters",
  "keys.opEdit": "Edit",
  "keys.opExport": "Export",
  "keys.opCheck": "Check",
  "keys.opChecking": "Checking",
  "keys.opDelete": "Delete",
  "keys.prev": "Previous",
  "keys.next": "Next",
  "keys.pageInfo": "Page {cur} / {pages}",
  "keys.toastDeleted": "Key “{name}” deleted",
  "keys.toastChecked": "“{name}” check result: {status}",
  "keys.toastExported": "Exported {n} key(s) to file",
  "keys.toastImported": "Imported {n} key(s)",
  "keys.exportAllTitle": "Export all keys",
  "keys.exportAllWarn":
    "The exported file contains plaintext keys — keep it safe. Export requires your account password.",
  "keys.exportAllConfirm": "Confirm & choose location",
  "keys.importTitle": "Import keys",
  "keys.importWarn":
    "Keys will be imported from {path} (JSON). Import requires your account password.",
  "keys.importConfirm": "Confirm import",
  "keys.deleteTitle": "Delete key",
  "keys.deleteMsg": "Delete key “{name}”? This cannot be undone.",
  "modal.cancel": "Cancel",
  "modal.back": "Back to editing",
  "modal.save": "Save",
  "modal.saving": "Saving…",
  "modal.confirmSave": "Confirm save",
  "modal.processing": "Processing…",
  "modal.confirmDelete": "Confirm delete",
  "modal.close": "Close",
  "modal.copy": "Copy",
  "modal.copied": "Copied",
  "keym.editTitle": "Edit key",
  "keym.createTitle": "New key",
  "keym.nameLabel": "Key name",
  "keym.namePh": "e.g. production key",
  "keym.providerLabel": "Provider",
  "keym.keyLabel": "API Key",
  "keym.keyEditHint": " (leave blank to keep)",
  "keym.keyPhNew": "sk-...",
  "keym.keyPhEdit": "Leave blank to keep current key",
  "keym.expiresLabel": "Expiry date (optional)",
  "keym.notesLabel": "Notes (optional)",
  "keym.confirmWarn": "Note: changes cannot be reverted",
  "keym.pwdLabel": "Account password",
  "keym.pwdPhConfirm": "Enter account password to confirm save",
  "keym.pwdEmptyErr": "Enter your account password to confirm save",
  "export.title": "Export key “{name}”",
  "export.tip": "Enter your account password to decrypt this key.",
  "export.pwdLabel": "Account password",
  "export.decrypting": "Decrypting…",
  "export.submit": "Decrypt & export",
  "export.okTip": "Decrypted — store it securely now:",
  "pwd.pwdLabel": "Account password",
  "pwd.pwdPh": "Enter your account password to confirm",
  "settings.title": "Account info",
  "settings.account": "Current account",
  "settings.storage": "Data storage",
  "settings.storageVal": "Local SQLite (app data dir keym.db)",
  "settings.crypto": "Encryption",
  "settings.cryptoVal":
    "AES-256-GCM; key derived from login password via Argon2id, never uploaded or shared",
  "settings.tip":
    "Warning: changing or forgetting your password makes saved keys undecryptable.",
  "settings.langTitle": "Interface language",
  "settings.langZh": "简体中文",
  "settings.langEn": "English",
  "settings.langTip": "Follows system language by default; manual choice is saved locally.",
  "security.changeTitle": "Change password",
  "security.warn":
    "After changing your password, all API key ciphertexts are decrypted with the old password and re-encrypted with the new one. Remember the new password — saved keys cannot be decrypted if you forget it.",
  "security.oldLabel": "Current password",
  "security.oldPh": "Enter current login password",
  "security.newLabel": "New password (min 6 chars)",
  "security.newPh": "Enter new password",
  "security.confirmLabel": "Confirm new password",
  "security.confirmPh": "Re-enter new password",
  "security.ok": "Password changed; all keys re-encrypted with the new password.",
  "security.submit": "Confirm change",
  "security.submitting": "Re-encrypting…",
  "cloud.title": "Under development — stay tuned",
  "cloud.desc":
    "Cloud sync is under development. This build is fully local: all key data stays in the on-device SQLite database and is never uploaded.",
  "about.p1":
    "KeyM is a fully local agent API key manager for safely storing, managing and validating AI provider API keys.",
  "about.p2":
    "Features: per-account isolation, AES-256-GCM encryption, password-derived keys, one-click validity checks, password-gated export.",
  "about.version": "Version: 0.1.0",
};

const DICTS: Record<Locale, Record<string, string>> = { zh, en };

/** 后端错误信息（中文）→ 英文映射 */
const ERR_EN: Record<string, string> = {
  "账号或密码错误，请重试": "Incorrect username or password, please retry",
  "账号已存在": "Username already exists",
  "账号不能为空": "Username cannot be empty",
  "密码至少 6 位": "Password must be at least 6 characters",
  "未登录或会话已过期": "Not signed in or session expired",
  "未登录": "Not signed in",
  "账号不存在": "Account does not exist",
  "密码错误，操作已取消": "Wrong password, operation cancelled",
  "密码错误，无法解密": "Wrong password, cannot decrypt",
  "密钥不存在或无权限": "Key not found or no permission",
  "密钥名称不能为空": "Key name cannot be empty",
  "API Key 不能为空": "API Key cannot be empty",
  "到期日期格式应为 yyyy-MM-dd": "Expiry date must be yyyy-MM-dd",
  "到期日期非法": "Invalid expiry date",
  "原密码错误": "Current password is incorrect",
  "新密码至少 6 位": "New password must be at least 6 characters",
  "新密码不能与原密码相同": "New password must differ from the current one",
  "会话异常，请重新登录": "Session error, please sign in again",
  "解密失败：密码错误或数据已损坏":
    "Decryption failed: wrong password or corrupted data",
  "文件格式错误：不是合法的 JSON": "Invalid file: not valid JSON",
  "文件格式错误：缺少 keys 数组": "Invalid file: missing \"keys\" array",
  "校验通过": "Check passed",
};

const ERR_PREFIX_EN: [string, string][] = [
  ["写入文件失败: ", "File write failed: "],
  ["读取文件失败: ", "File read failed: "],
  ["网络请求失败: ", "Network request failed: "],
  ["密码哈希失败: ", "Password hashing failed: "],
  ["密钥派生失败: ", "Key derivation failed: "],
  ["密文解码失败: ", "Ciphertext decode failed: "],
  ["盐解码失败: ", "Salt decode failed: "],
];

export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("zh") ? "zh" : "en";
}

export function translateErr(msg: string, locale: Locale): string {
  if (locale === "zh") return msg;
  if (ERR_EN[msg]) return ERR_EN[msg];
  for (const [zhPre, enPre] of ERR_PREFIX_EN) {
    if (msg.startsWith(zhPre)) return enPre + msg.slice(zhPre.length);
  }
  const m = msg.match(/^服务商「(.+)」暂不支持在线校验$/);
  if (m) return `Provider "${m[1]}" does not support online checks`;
  return msg;
}

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  terr: (msg: string) => string;
}

const Ctx = createContext<I18nCtx>({
  locale: "zh",
  setLocale: () => {},
  t: (k) => k,
  terr: (m) => m,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  const value = useMemo<I18nCtx>(() => {
    const dict = DICTS[locale];
    const t = (key: string, params?: Record<string, string | number>) => {
      let s = dict[key] ?? zh[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          s = s.split(`{${k}}`).join(String(v));
        }
      }
      return s;
    };
    return {
      locale,
      setLocale: (l: Locale) => {
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* ignore */
        }
        setLocaleState(l);
      },
      t,
      terr: (msg: string) => translateErr(msg, locale),
    };
  }, [locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
