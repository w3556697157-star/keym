import { useI18n } from "../i18n";

export default function CloudSync() {
  const { t } = useI18n();
  return (
    <div className="panel">
      <div className="placeholder">
        <div className="placeholder-icon">☁️</div>
        <div className="placeholder-title">{t("cloud.title")}</div>
        <p className="placeholder-desc">{t("cloud.desc")}</p>
      </div>
    </div>
  );
}
