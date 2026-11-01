import { useEffect, useState } from "react";
import { api, KeyItem, Stats } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<KeyItem[]>([]);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    const [s, keys] = await Promise.all([api.stats(), api.listKeys()]);
    setStats(s);
    setRecent(keys.slice(0, 5));
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const checkAll = async () => {
    setChecking(true);
    try {
      await api.checkAllKeys();
      await load();
    } catch (e) {
      alert(String(e));
    } finally {
      setChecking(false);
    }
  };

  if (!stats) return <div className="loading">加载中…</div>;

  const cards = [
    { label: "密钥总数", value: stats.total, icon: "🔢", cls: "c-total" },
    { label: "可用密钥", value: stats.active, icon: "✅", cls: "c-active" },
    { label: "已过期", value: stats.expired, icon: "⏰", cls: "c-expired" },
    { label: "校验失败", value: stats.invalid, icon: "⚠️", cls: "c-invalid" },
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
          <h3>安全概况</h3>
          <button
            className="btn-primary"
            onClick={checkAll}
            disabled={checking}
          >
            {checking ? "校验中…" : "一键校验全部"}
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>密钥名称</th>
              <th>密钥值</th>
              <th>创建时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  暂无密钥，去「Api密钥管理」添加吧
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
  const map: Record<string, { text: string; cls: string }> = {
    active: { text: "启用", cls: "tag-green" },
    expired: { text: "已过期", cls: "tag-gray" },
    invalid: { text: "已失效", cls: "tag-red" },
    unknown: { text: "未校验", cls: "tag-blue" },
  };
  const s = map[status] ?? map.unknown;
  return <span className={`tag ${s.cls}`}>{s.text}</span>;
}
