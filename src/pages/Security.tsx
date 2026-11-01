import { useState } from "react";
import { api, UserInfo } from "../api";
import { useI18n } from "../i18n";

export default function Security({ user }: { user: UserInfo }) {
  const { t, terr } = useI18n();
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const canSubmit =
    oldPwd.length > 0 && newPwd.length >= 6 && newPwd === confirmPwd && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    setOk("");
    try {
      await api.changePassword(oldPwd, newPwd);
      setOk(t("security.ok"));
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (e) {
      setError(terr(String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="panel">
        <h3>{t("settings.title")}</h3>
        <div className="settings-row">
          <span className="settings-label">{t("settings.account")}</span>
          <span>{user.username}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">{t("settings.crypto")}</span>
          <span>{t("settings.cryptoVal")}</span>
        </div>
      </div>

      <div className="panel">
        <h3>{t("security.changeTitle")}</h3>
        <div className="warn-note">{t("security.warn")}</div>

        <label className="form-label">{t("security.oldLabel")}</label>
        <input
          className="input"
          type="password"
          value={oldPwd}
          onChange={(e) => setOldPwd(e.target.value)}
          placeholder={t("security.oldPh")}
        />

        <label className="form-label">{t("security.newLabel")}</label>
        <input
          className="input"
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          placeholder={t("security.newPh")}
        />

        <label className="form-label">{t("security.confirmLabel")}</label>
        <input
          className="input"
          type="password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("security.confirmPh")}
        />

        {error && <div className="login-error">{error}</div>}
        {ok && <div className="ok-note">{ok}</div>}

        <div className="modal-foot" style={{ justifyContent: "flex-start" }}>
          <button className="btn-primary" disabled={!canSubmit} onClick={submit}>
            {busy ? t("security.submitting") : t("security.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
