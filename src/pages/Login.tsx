import { useState } from "react";
import { api, UserInfo } from "../api";
import { useI18n } from "../i18n";

export default function Login({ onLogin }: { onLogin: (u: UserInfo) => void }) {
  const { t, terr } = useI18n();
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
      setError(terr(String(e)));
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
            placeholder={t("login.accountPh")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div className={`field ${error ? "field-error" : ""}`}>
          <span className="field-icon">🔒</span>
          <input
            placeholder={t("login.pwdPh")}
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <span
            className="field-eye"
            onClick={() => setShowPwd((v) => !v)}
            title={showPwd ? "•••" : "•••"}
          >
            {showPwd ? "🙈" : "👁"}
          </span>
        </div>
        {mode === "register" && (
          <div className="field">
            <span className="field-icon">🔒</span>
            <input
              placeholder={t("login.confirmPh")}
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
              ? t("login.loggingIn")
              : t("login.registering")
            : mode === "login"
              ? t("login.submitLogin")
              : t("login.submitRegister")}
        </button>
        <div className="login-switch">
          {mode === "login" ? (
            <span>
              {t("login.noAccount")}
              <a
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                {t("login.registerNow")}
              </a>
            </span>
          ) : (
            <span>
              {t("login.hasAccount")}
              <a
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                {t("login.backLogin")}
              </a>
            </span>
          )}
        </div>
        <div className="login-tip">{t("login.tip")}</div>
      </div>
    </div>
  );
}
