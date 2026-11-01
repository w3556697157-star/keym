import { useI18n } from "../i18n";

export default function About() {
  const { t } = useI18n();
  return (
    <div className="panel">
      <h3>KeyM</h3>
      <p className="about-p">{t("about.p1")}</p>
      <p className="about-p">{t("about.p2")}</p>
      <p className="about-p">{t("about.version")}</p>
    </div>
  );
}
