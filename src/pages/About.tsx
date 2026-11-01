export default function About() {
  return (
    <div className="panel">
      <h3>关于 KeyM</h3>
      <p className="about-p">
        KeyM 是一款完全本地的 Agent API Key 管理软件，帮助你安全地存储、管理和校验各类 AI
        服务商的 API 密钥。
      </p>
      <p className="about-p">
        特性：多账号隔离、AES-256-GCM 加密存储、密码派生密钥、一键可用性校验、导出需二次验证。
      </p>
      <p className="about-p">版本：0.1.0</p>
    </div>
  );
}
