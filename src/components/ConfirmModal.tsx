import { useI18n } from "../i18n";

export default function ConfirmModal({
  title,
  message,
  confirmText,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmText?: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <span className="modal-close" onClick={onClose}>
            ✕
          </span>
        </div>
        <div className="modal-body">
          <div className="warn-note">{message}</div>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>
            {t("modal.cancel")}
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? t("modal.processing") : (confirmText ?? t("modal.confirmDelete"))}
          </button>
        </div>
      </div>
    </div>
  );
}
