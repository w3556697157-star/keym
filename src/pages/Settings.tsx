import { UserInfo } from "../api";

export default function Settings({ user }: { user: UserInfo }) {
  return (
    <div className="panel">
      <h3>账号信息</h3>
      <div className="settings-row">
        <span className="settings-label">当前账号</span>
        <span>{user.username}</span>
      </div>
      <div className="settings-row">
        <span className="settings-label">数据存储</span>
        <span>本地 SQLite（应用数据目录 keym.db）</span>
      </div>
      <div className="settings-row">
        <span className="settings-label">加密方式</span>
        <span>
          AES-256-GCM；密钥由登录密码经 Argon2id 派生，不上传、不共享
        </span>
      </div>
      <div className="settings-tip">
        注意：修改/忘记密码将导致已保存的密钥无法解密，请谨慎操作。
      </div>
    </div>
  );
}
