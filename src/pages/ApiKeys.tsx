import { useEffect, useMemo, useRef, useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { api, KeyItem } from "../api";
import { useI18n } from "../i18n";
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

const STATUS_VALUES = ["active", "expired", "invalid", "unknown"];

export default function ApiKeys() {
  const { t, terr } = useI18n();
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
    load().catch((e) => showToast(terr(String(e))));
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
      showToast(t("keys.toastDeleted", { name: deleting.name }));
      setDeleting(null);
      await load();
    } catch (e) {
      showToast(terr(String(e)));
    } finally {
      setBusyDelete(false);
    }
  };

  const onCheck = async (k: KeyItem) => {
    setCheckingId(k.id);
    try {
      const updated = await api.checkKey(k.id);
      showToast(
        t("keys.toastChecked", {
          name: k.name,
          status: t(`status.${updated.status}`),
        })
      );
      await load();
    } catch (e) {
      showToast(terr(String(e)));
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
    showToast(t("keys.toastExported", { n }));
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
    showToast(t("keys.toastImported", { n }));
    setImportPath(null);
    setPage(1);
    await load();
  };

  return (
    <div>
      <div className="page-head">
        <h2>{t("keys.title")}</h2>
        <div className="head-actions">
          <button className="btn-ghost" onClick={onPickImport}>
            {t("keys.import")}
          </button>
          <button className="btn-ghost" onClick={() => setExportAllPwd(true)}>
            {t("keys.exportAll")}
          </button>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            {t("keys.newKey")}
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
          <option value="">{t("keys.allProviders")}</option>
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
          <option value="">{t("keys.allStatus")}</option>
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        <span className="filter-count">{t("keys.count", { n: filtered.length })}</span>
      </div>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t("keys.colName")}</th>
              <th>{t("keys.colProvider")}</th>
              <th>{t("keys.colValue")}</th>
              <th>{t("keys.colCreated")}</th>
              <th>{t("keys.colExpires")}</th>
              <th>{t("keys.colStatus")}</th>
              <th>{t("keys.colOps")}</th>
            </tr>
          </thead>
          <tbody>
            {!loading && view.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  {keys.length === 0 ? t("keys.emptyNoData") : t("keys.emptyFiltered")}
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
                  <a onClick={() => setEditing(k)}>{t("keys.opEdit")}</a>
                  <a className="op-export" onClick={() => setExporting(k)}>
                    {t("keys.opExport")}
                  </a>
                  <a
                    className="op-check"
                    onClick={() => onCheck(k)}
                    style={{
                      opacity: checkingId === k.id ? 0.5 : 1,
                      pointerEvents: checkingId === k.id ? "none" : "auto",
                    }}
                  >
                    {checkingId === k.id ? t("keys.opChecking") : t("keys.opCheck")}
                  </a>
                  <a className="op-danger" onClick={() => setDeleting(k)}>
                    {t("keys.opDelete")}
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
            {t("keys.prev")}
          </button>
          <span className="pager-info">
            {t("keys.pageInfo", { cur: curPage, pages })}
          </span>
          <button
            className="btn-ghost pager-btn"
            disabled={curPage >= pages}
            onClick={() => setPage(curPage + 1)}
          >
            {t("keys.next")}
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
          title={t("keys.exportAllTitle")}
          warning={t("keys.exportAllWarn")}
          confirmText={t("keys.exportAllConfirm")}
          onConfirm={onExportAll}
          onClose={() => setExportAllPwd(false)}
        />
      )}
      {importPath && (
        <PasswordModal
          title={t("keys.importTitle")}
          warning={t("keys.importWarn", { path: importPath })}
          confirmText={t("keys.importConfirm")}
          onConfirm={onImport}
          onClose={() => setImportPath(null)}
        />
      )}
      {deleting && (
        <ConfirmModal
          title={t("keys.deleteTitle")}
          message={t("keys.deleteMsg", { name: deleting.name })}
          busy={busyDelete}
          onConfirm={onDelete}
          onClose={() => setDeleting(null)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
