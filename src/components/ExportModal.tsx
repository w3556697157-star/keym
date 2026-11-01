import { useState } from "react";
import { api, KeyItem } from "../api";
import { useI18n } from "../i18n";

export default function ExportModal({
  item,
  onClose,
}: {
  item: KeyItem;
  onClose: () => void;
}) {
  const { t, terr } = useI18n();
  const [password, setPassword] = useState("");
  const [plain, setPlain] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const doExport = async () => {
    if (!password || loading) return;
    setLoading(true);
    setError("");
    try {
      const p = await api.exportKey(item.id, password);
      setPlain(p);
    } catch (e) {
      setError(terr(String(e)));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板失败时退化为选中文本
    }
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t("export.title", { name: item.name })}</h3>
          <span className="modal-close" onClick={onClose}>
            ✕
          </span>
        </div>
        <div className="modal-body">
          {!plain ? (
            <>
              <div className="export-tip">{t("export.tip")}</div>
              <label className="form-label">{t("export.pwdLabel")}</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doExport()}
                autoFocus
              />
              {error && <div className="login-error">{error}</div>}
            </>
          ) : (
            <>
              <div className="export-tip ok">{t("export.okTip")}</div>
              <div className="export-result mono">{plain}</div>
            </>
          )}
        </div>
        <div className="modal-foot">
          {!plain ? (
            <>
              <button className="btn-ghost" onClick={onClose}>
                {t("modal.cancel")}
              </button>
              <button
                className="btn-primary"
                disabled={!password || loading}
                onClick={doExport}
              >
                {loading ? t("export.decrypting") : t("export.submit")}
              </button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={onClose}>
                {t("modal.close")}
              </button>
              <button className="btn-primary" onClick={copy}>
                {copied ? t("modal.copied") : t("modal.copy")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
