import { useEffect, useState } from "react";
import { api, UserInfo } from "./api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ApiKeys from "./pages/ApiKeys";
import Settings from "./pages/Settings";
import Security from "./pages/Security";
import CloudSync from "./pages/CloudSync";
import About from "./pages/About";
import Sidebar from "./components/Sidebar";

export type Page =
  | "dashboard"
  | "keys"
  | "sync"
  | "security"
  | "settings"
  | "about";

export default function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    api
      .currentUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return <div className="boot">加载中…</div>;
  }

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setPage("dashboard");
  };

  return (
    <div className="layout">
      <Sidebar page={page} onNavigate={setPage} />
      <div className="main">
        <header className="topbar">
          <h1 className="topbar-title">
            {page === "dashboard" && "首页仪表盘"}
            {page === "keys" && "Api密钥管理"}
            {page === "sync" && "云同步"}
            {page === "security" && "账号安全"}
            {page === "settings" && "设置"}
            {page === "about" && "关于我们"}
          </h1>
          <UserMenu
            username={user.username}
            onLogout={handleLogout}
            onSettings={() => setPage("settings")}
            onSecurity={() => setPage("security")}
          />
        </header>
        <main className="content">
          {page === "dashboard" && <Dashboard />}
          {page === "keys" && <ApiKeys />}
          {page === "sync" && <CloudSync />}
          {page === "security" && <Security user={user} />}
          {page === "settings" && <Settings user={user} />}
          {page === "about" && <About />}
        </main>
      </div>
    </div>
  );
}

function UserMenu({
  username,
  onLogout,
  onSettings,
  onSecurity,
}: {
  username: string;
  onLogout: () => void;
  onSettings: () => void;
  onSecurity: () => void;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="usermenu" onClick={() => setOpen((v) => !v)}>
      <div className="avatar">{username.slice(0, 1).toUpperCase()}</div>
      <span className="usermenu-name">{username}</span>
      <span className="usermenu-caret">▾</span>
      {open && (
        <div className="usermenu-dropdown">
          <div
            className="usermenu-item"
            onClick={() => {
              close();
              onSecurity();
            }}
          >
            账号安全
          </div>
          <div
            className="usermenu-item"
            onClick={() => {
              close();
              onSettings();
            }}
          >
            设置
          </div>
          <div className="usermenu-item" onClick={onLogout}>
            退出登录
          </div>
        </div>
      )}
    </div>
  );
}
