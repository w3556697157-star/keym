import { Page } from "../App";

const NAV: { key: Page; label: string; icon: string }[] = [
  { key: "dashboard", label: "首页", icon: "🏠" },
  { key: "keys", label: "Api密钥管理", icon: "🔑" },
  { key: "sync", label: "云同步", icon: "☁️" },
  { key: "about", label: "关于我们", icon: "ℹ️" },
];

export default function Sidebar({
  page,
  onNavigate,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">KeyM</div>
      <nav>
        {NAV.map((n) => (
          <div
            key={n.label}
            className={`nav-item ${page === n.key ? "nav-active" : ""}`}
            onClick={() => onNavigate(n.key)}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </div>
        ))}
      </nav>
      <div
        className={`nav-item nav-bottom ${page === "settings" ? "nav-active" : ""}`}
        onClick={() => onNavigate("settings")}
      >
        <span className="nav-icon">⚙️</span>
        设置
      </div>
    </aside>
  );
}
