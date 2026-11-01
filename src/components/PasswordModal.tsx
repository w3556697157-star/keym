import { useState } from "react";
import { useI18n } from "../i18n";

export default function PasswordModal({
  title,
  warning,
  confirmText,
  onConfirm,
  onClose,
}: {
  title: string;
  warning?: string;
  confirmText?: string;
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}) {
  const { t, terr } = useI18n();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm(password);
    } catch (e) {
      setError(terr(String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <span className="modal-close" onClick={onClose}>
            ✕
          </span>
        </div>
        <div className="modal-body">
          {warning && <div className="warn-note">{warning}</div>}
          <label className="form-label">{t("pwd.pwdLabel")}</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t("pwd.pwdPh")}
            autoFocus
          />
          {error && <div className="login-error">{error}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            {t("modal.cancel")}
          </button>
          <button
            className="btn-primary"
            disabled={!password || busy}
            onClick={submit}
          >
            {busy ? t("modal.processing") : (confirmText ?? t("modal.confirmSave"))}
          </button>
        </div>
      </div>
    </div>
  );
}
