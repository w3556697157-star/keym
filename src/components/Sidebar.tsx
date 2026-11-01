import { Page } from "../App";
import { useI18n } from "../i18n";

export default function Sidebar({
  page,
  onNavigate,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
}) {
  const { t } = useI18n();
  const NAV: { key: Page; label: string; icon: string }[] = [
    { key: "dashboard", label: t("menu.home"), icon: "🏠" },
    { key: "keys", label: t("menu.keys"), icon: "🔑" },
    { key: "sync", label: t("menu.sync"), icon: "☁️" },
    { key: "about", label: t("menu.about"), icon: "ℹ️" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">KeyM</div>
      <nav>
        {NAV.map((n) => (
          <div
            key={n.key}
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
        {t("menu.settings")}
      </div>
    </aside>
  );
}
