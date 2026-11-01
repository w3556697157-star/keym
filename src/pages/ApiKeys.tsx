import { useEffect, useMemo, useRef, useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { api, KeyItem } from "../api";
import { StatusTag } from "./Dashboard";
import KeyModal from "../components/KeyModal";
import ExportModal from "../components/ExportModal";
import PasswordModal from "../components/PasswordModal";
import ConfirmModal from "../components/ConfirmModal";

const JSON_FILTER = {
  name: "JSON",
  extensions: ["json"],
};

const PAGE_SIZE = 8;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "active", label: "启用" },
  { value: "expired", label: "已过期" },
  { value: "invalid", label: "已失效" },
  { value: "unknown", label: "未校验" },
];

export default function ApiKeys() {
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<KeyItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState<KeyItem | null>(null);
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [exportAllPwd, setExportAllPwd] = useState(false);
  const [importPath, setImportPath] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<KeyItem | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const [fProvider, setFProvider] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      setKeys(await api.listKeys());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((e) => showToast(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const providers = useMemo(
    () => Array.from(new Set(keys.map((k) => k.provider))).sort(),
    [keys]
  );

  const filtered = useMemo(
    () =>
      keys.filter(
        (k) =>
          (!fProvider || k.provider === fProvider) &&
          (!fStatus || k.status === fStatus)
      ),
    [keys, fProvider, fStatus]
  );

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, pages);
  const view = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const onDelete = async () => {
    if (!deleting || busyDelete) return;
    setBusyDelete(true);
    try {
      await api.deleteKey(deleting.id);
      showToast(`密钥「${deleting.name}」已删除`);
      setDeleting(null);
      await load();
    } catch (e) {
      showToast(String(e));
    } finally {
      setBusyDelete(false);
    }
  };

  const onCheck = async (k: KeyItem) => {
    setCheckingId(k.id);
    try {
      const updated = await api.checkKey(k.id);
      showToast(`「${k.name}」校验结果：${updated.status}`);
      await load();
    } catch (e) {
      showToast(String(e));
    } finally {
      setCheckingId(null);
    }
  };

  // 导出全部：先密码确认，再选择保存路径
  const onExportAll = async (password: string) => {
    const path = await save({
      defaultPath: `keym-export-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [JSON_FILTER],
    });
    if (!path) return;
    const n = await api.exportAll(password, String(path));
    showToast(`导出成功：共 ${n} 条密钥已写入文件`);
    setExportAllPwd(false);
  };

  // 导入：先选择文件，再密码确认
  const onPickImport = async () => {
    const path = await open({
      multiple: false,
      filters: [JSON_FILTER],
    });
    if (!path) return;
    setImportPath(String(path));
  };

  const onImport = async (password: string) => {
    if (!importPath) return;
    const n = await api.importKeys(password, importPath);
    showToast(`导入成功：共导入 ${n} 条密钥`);
    setImportPath(null);
    setPage(1);
    await load();
  };

  return (
    <div>
      <div className="page-head">
        <h2>Api密钥管理</h2>
        <div className="head-actions">
          <button className="btn-ghost" onClick={onPickImport}>
            导入
          </button>
          <button className="btn-ghost" onClick={() => setExportAllPwd(true)}>
            导出全部
          </button>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            ＋ 新建密钥
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="input filter-select"
          value={fProvider}
          onChange={(e) => {
            setFProvider(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部服务商</option>
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="input filter-select"
          value={fStatus}
          onChange={(e) => {
            setFStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="filter-count">共 {filtered.length} 条</span>
      </div>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>密钥名称</th>
              <th>服务商</th>
              <th>密钥值（密文）</th>
              <th>创建时间</th>
              <th>到期时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {!loading && view.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  {keys.length === 0
                    ? "暂无数据，点击右上角「新建密钥」添加"
                    : "当前筛选条件下暂无数据"}
                </td>
              </tr>
            )}
            {view.map((k) => (
              <tr key={k.id}>
                <td>{k.name}</td>
                <td>{k.provider}</td>
                <td className="mono">{k.key_preview}</td>
                <td>{k.created_at.slice(0, 10)}</td>
                <td>{k.expires_at ? k.expires_at.slice(0, 10) : "—"}</td>
                <td>
                  <StatusTag status={k.status} />
                </td>
                <td className="ops">
                  <a onClick={() => setEditing(k)}>编辑</a>
                  <a className="op-export" onClick={() => setExporting(k)}>
                    导出
                  </a>
                  <a
                    className="op-check"
                    onClick={() => onCheck(k)}
                    style={{
                      opacity: checkingId === k.id ? 0.5 : 1,
                      pointerEvents: checkingId === k.id ? "none" : "auto",
                    }}
                  >
                    {checkingId === k.id ? "校验中" : "校验"}
                  </a>
                  <a className="op-danger" onClick={() => setDeleting(k)}>
                    删除
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pager">
          <button
            className="btn-ghost pager-btn"
            disabled={curPage <= 1}
            onClick={() => setPage(curPage - 1)}
          >
            上一页
          </button>
          <span className="pager-info">
            第 {curPage} / {pages} 页
          </span>
          <button
            className="btn-ghost pager-btn"
            disabled={curPage >= pages}
            onClick={() => setPage(curPage + 1)}
          >
            下一页
          </button>
        </div>
      </div>

      {creating && (
        <KeyModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
      {editing && (
        <KeyModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {exporting && (
        <ExportModal item={exporting} onClose={() => setExporting(null)} />
      )}
      {exportAllPwd && (
        <PasswordModal
          title="导出全部密钥"
          warning="导出文件包含全部密钥明文，请妥善保管；导出需输入账号密码确认。"
          confirmText="确认并选择保存位置"
          onConfirm={onExportAll}
          onClose={() => setExportAllPwd(false)}
        />
      )}
      {importPath && (
        <PasswordModal
          title="导入密钥"
          warning={`将从 ${importPath} 导入密钥（JSON 格式），导入需输入账号密码确认。`}
          confirmText="确认导入"
          onConfirm={onImport}
          onClose={() => setImportPath(null)}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="删除密钥"
          message={`确定删除密钥「${deleting.name}」吗？删除后无法恢复。`}
          busy={busyDelete}
          onConfirm={onDelete}
          onClose={() => setDeleting(null)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
