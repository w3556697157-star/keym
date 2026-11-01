import { useState } from "react";
import { api, KeyItem } from "../api";

export default function ExportModal({
  item,
  onClose,
}: {
  item: KeyItem;
  onClose: () => void;
}) {
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
      setError(String(e));
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
          <h3>导出密钥「{item.name}」</h3>
          <span className="modal-close" onClick={onClose}>
            ✕
          </span>
        </div>
        <div className="modal-body">
          {!plain ? (
            <>
              <div className="export-tip">
                请输入当前账号密码，用于解密该密钥的密文。
              </div>
              <label className="form-label">账号密码</label>
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
              <div className="export-tip ok">解密成功，请立即妥善保存：</div>
              <div className="export-result mono">{plain}</div>
            </>
          )}
        </div>
        <div className="modal-foot">
          {!plain ? (
            <>
              <button className="btn-ghost" onClick={onClose}>
                取消
              </button>
              <button
                className="btn-primary"
                disabled={!password || loading}
                onClick={doExport}
              >
                {loading ? "解密中…" : "解密并导出"}
              </button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={onClose}>
                关闭
              </button>
              <button className="btn-primary" onClick={copy}>
                {copied ? "已复制" : "复制"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
