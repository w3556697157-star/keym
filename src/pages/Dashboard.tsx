import { useEffect, useState } from "react";
import { api, KeyItem, Stats } from "../api";
import { useI18n } from "../i18n";

export default function Dashboard() {
  const { t, terr } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<KeyItem[]>([]);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    const [s, keys] = await Promise.all([api.stats(), api.listKeys()]);
    setStats(s);
    setRecent(keys.slice(0, 5));
  };

  useEffect(() => {
    load().catch((e) => console.error(terr(String(e))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAll = async () => {
    setChecking(true);
    try {
      await api.checkAllKeys();
      await load();
    } catch (e) {
      alert(terr(String(e)));
    } finally {
      setChecking(false);
    }
  };

  if (!stats) return <div className="loading">{t("loading")}</div>;

  const cards = [
    { label: t("dash.total"), value: stats.total, icon: "🔢", cls: "c-total" },
    { label: t("dash.active"), value: stats.active, icon: "✅", cls: "c-active" },
    { label: t("dash.expired"), value: stats.expired, icon: "⏰", cls: "c-expired" },
    { label: t("dash.invalid"), value: stats.invalid, icon: "⚠️", cls: "c-invalid" },
  ];

  return (
    <div>
      <div className="stat-cards">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card ${c.cls}`}>
            <div className="stat-head">
              <span className="stat-icon">{c.icon}</span>
              <span className="stat-label">{c.label}</span>
            </div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>{t("dash.overview")}</h3>
          <button
            className="btn-primary"
            onClick={checkAll}
            disabled={checking}
          >
            {checking ? t("dash.checking") : t("dash.checkAll")}
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{t("dash.colName")}</th>
              <th>{t("dash.colValue")}</th>
              <th>{t("dash.colCreated")}</th>
              <th>{t("dash.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  {t("dash.empty")}
                </td>
              </tr>
            )}
            {recent.map((k) => (
              <tr key={k.id}>
                <td>{k.name}</td>
                <td className="mono">{k.key_preview}</td>
                <td>{k.created_at.slice(0, 10)}</td>
                <td>
                  <StatusTag status={k.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusTag({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, { key: string; cls: string }> = {
    active: { key: "status.active", cls: "tag-green" },
    expired: { key: "status.expired", cls: "tag-gray" },
    invalid: { key: "status.invalid", cls: "tag-red" },
    unknown: { key: "status.unknown", cls: "tag-blue" },
  };
  const s = map[status] ?? map.unknown;
  return <span className={`tag ${s.cls}`}>{t(s.key)}</span>;
}
