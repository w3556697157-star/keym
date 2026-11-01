import { useState } from "react";
import { api, UserInfo } from "../api";

export default function Security({ user }: { user: UserInfo }) {
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
      setOk("密码修改成功，全部密钥已使用新密码重新加密。");
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="panel">
        <h3>账号信息</h3>
        <div className="settings-row">
          <span className="settings-label">当前账号</span>
          <span>{user.username}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">加密方式</span>
          <span>AES-256-GCM；密钥由登录密码经 Argon2id 派生</span>
        </div>
      </div>

      <div className="panel">
        <h3>修改密码</h3>
        <div className="warn-note">
          修改密码后，系统会用原密码解密你全部 API 密钥密文，再用新密码重新加密后写回数据库。请确保牢记新密码，忘记密码将无法解密已保存的密钥。
        </div>

        <label className="form-label">原密码</label>
        <input
          className="input"
          type="password"
          value={oldPwd}
          onChange={(e) => setOldPwd(e.target.value)}
          placeholder="输入当前登录密码"
        />

        <label className="form-label">新密码（至少 6 位）</label>
        <input
          className="input"
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          placeholder="输入新密码"
        />

        <label className="form-label">确认新密码</label>
        <input
          className="input"
          type="password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="再次输入新密码"
        />

        {error && <div className="login-error">{error}</div>}
        {ok && <div className="ok-note">{ok}</div>}

        <div className="modal-foot" style={{ justifyContent: "flex-start" }}>
          <button
            className="btn-primary"
            disabled={!canSubmit}
            onClick={submit}
          >
            {busy ? "重加密中…" : "确认修改"}
          </button>
        </div>
      </div>
    </div>
  );
}
