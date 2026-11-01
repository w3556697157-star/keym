import { useState } from "react";
import { api, UserInfo } from "../api";

export default function Login({ onLogin }: { onLogin: (u: UserInfo) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    username.trim().length > 0 &&
    password.length >= 6 &&
    (mode === "login" || confirm === password);

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        await api.register(username.trim(), password);
      }
      const u = await api.login(username.trim(), password);
      onLogin(u);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-logo">KeyM</div>
      <div className="login-card">
        <div className="login-card-logo">KM</div>
        <div className={`field ${error ? "field-error" : ""}`}>
          <span className="field-icon">👤</span>
          <input
            placeholder="账号"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div className={`field ${error ? "field-error" : ""}`}>
          <span className="field-icon">🔒</span>
          <input
            placeholder="密码（至少 6 位）"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <span
            className="field-eye"
            onClick={() => setShowPwd((v) => !v)}
            title={showPwd ? "隐藏密码" : "显示密码"}
          >
            {showPwd ? "🙈" : "👁"}
          </span>
        </div>
        {mode === "register" && (
          <div className="field">
            <span className="field-icon">🔒</span>
            <input
              placeholder="确认密码"
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
        )}
        {error && <div className="login-error">{error}</div>}
        <button
          className="btn-primary btn-block"
          disabled={!canSubmit || loading}
          onClick={submit}
        >
          {loading
            ? mode === "login"
              ? "登录中…"
              : "注册中…"
            : mode === "login"
              ? "登录"
              : "注册并登录"}
        </button>
        <div className="login-switch">
          {mode === "login" ? (
            <span>
              还没有账号？
              <a onClick={() => { setMode("register"); setError(""); }}>
                立即注册
              </a>
            </span>
          ) : (
            <span>
              已有账号？
              <a onClick={() => { setMode("login"); setError(""); }}>
                返回登录
              </a>
            </span>
          )}
        </div>
        <div className="login-tip">
          密码用于派生加密密钥，请妥善保管，忘记密码将无法解密已保存的密钥。
        </div>
      </div>
    </div>
  );
}
