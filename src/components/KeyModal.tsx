import { useState } from "react";
import { api, KeyItem } from "../api";

const PROVIDERS = [
  "OpenAI",
  "Anthropic",
  "Google Gemini",
  "DeepSeek",
  "Moonshot（月之暗面）",
  "智谱AI",
  "通义千问",
  "豆包（火山方舟）",
  "百度千帆",
  "讯飞星火",
  "硅基流动",
  "OpenRouter",
  "xAI（Grok）",
  "Mistral",
  "Cohere",
  "阶跃星辰",
  "360智脑",
  "Azure OpenAI",
  "腾讯云混元",
  "Amazon Bedrock",
  "自定义",
];

export default function KeyModal({
  item,
  onClose,
  onSaved,
}: {
  item?: KeyItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!item;
  const [name, setName] = useState(item?.name ?? "");
  const [provider, setProvider] = useState(item?.provider ?? "OpenAI");
  const [apiKey, setApiKey] = useState("");
  const [expiresAt, setExpiresAt] = useState(item?.expires_at?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmPwd, setConfirmPwd] = useState("");

  const canSubmit =
    name.trim().length > 0 &&
    provider.trim().length > 0 &&
    (isEdit ? true : apiKey.trim().length > 0);

  const doSave = async (password: string) => {
    if (isEdit) {
      await api.updateKey(
        item!.id,
        {
          name: name.trim(),
          provider: provider.trim(),
          api_key: apiKey.trim() ? apiKey.trim() : null,
          expires_at: expiresAt || null,
          notes,
        },
        password
      );
    } else {
      await api.createKey({
        name: name.trim(),
        provider: provider.trim(),
        api_key: apiKey.trim(),
        expires_at: expiresAt || null,
        notes,
      });
    }
  };

  const submit = async () => {
    if (!canSubmit || saving) return;
    // 编辑保存需二次密码确认
    if (isEdit && !confirming) {
      setConfirming(true);
      setError("");
      return;
    }
    if (isEdit && !confirmPwd) {
      setError("请输入账号密码以确认保存");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await doSave(isEdit ? confirmPwd : "");
      onSaved();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isEdit ? "编辑密钥" : "新建密钥"}</h3>
          <span className="modal-close" onClick={onClose}>
            ✕
          </span>
        </div>
        <div className="modal-body">
          {isEdit && confirming ? (
            <>
              <div className="warn-note">注意：修改后无法恢复</div>
              <label className="form-label">账号密码</label>
              <input
                className="input"
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="输入账号密码以确认保存"
                autoFocus
              />
            </>
          ) : (
            <>
              <label className="form-label">密钥名称</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：生产环境密钥"
              />

              <label className="form-label">服务商</label>
              <select
                className="input"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <label className="form-label">
                API Key{isEdit && "（留空则不修改）"}
              </label>
              <input
                className="input mono"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={isEdit ? "留空保持原密钥" : "sk-..."}
              />

              <label className="form-label">到期时间（可选）</label>
              <input
                className="input"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />

              <label className="form-label">备注（可选）</label>
              <textarea
                className="input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </>
          )}

          {error && <div className="login-error">{error}</div>}
        </div>
        <div className="modal-foot">
          <button
            className="btn-ghost"
            onClick={() => (isEdit && confirming ? setConfirming(false) : onClose())}
          >
            {isEdit && confirming ? "返回修改" : "取消"}
          </button>
          <button
            className="btn-primary"
            disabled={(isEdit && confirming ? !confirmPwd : !canSubmit) || saving}
            onClick={submit}
          >
            {saving ? "保存中…" : isEdit && confirming ? "确认保存" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
