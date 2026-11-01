import { UserInfo } from "../api";
import { useI18n } from "../i18n";

export default function Settings({ user }: { user: UserInfo }) {
  const { t, locale, setLocale } = useI18n();
  return (
    <div>
      <div className="panel">
        <h3>{t("settings.title")}</h3>
        <div className="settings-row">
          <span className="settings-label">{t("settings.account")}</span>
          <span>{user.username}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">{t("settings.storage")}</span>
          <span>{t("settings.storageVal")}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">{t("settings.crypto")}</span>
          <span>{t("settings.cryptoVal")}</span>
        </div>
        <div className="settings-tip">{t("settings.tip")}</div>
      </div>

      <div className="panel">
        <h3>{t("settings.langTitle")}</h3>
        <div className="settings-row">
          <span className="settings-label">{t("settings.langTitle")}</span>
          <span className="lang-switch">
            <button
              className={`btn-ghost lang-btn ${locale === "zh" ? "lang-active" : ""}`}
              onClick={() => setLocale("zh")}
            >
              {t("settings.langZh")}
            </button>
            <button
              className={`btn-ghost lang-btn ${locale === "en" ? "lang-active" : ""}`}
              onClick={() => setLocale("en")}
            >
              {t("settings.langEn")}
            </button>
          </span>
        </div>
        <div className="settings-tip">{t("settings.langTip")}</div>
      </div>
    </div>
  );
}
