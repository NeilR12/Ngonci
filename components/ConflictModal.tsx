"use client";

import Modal from "./Modal";
import { useI18n } from "./LangProvider";

export default function ConflictModal({
  onUseCloud,
  onUseLocal,
  onClose,
}: {
  onUseCloud: () => void;
  onUseLocal: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal onClose={onClose}>
      <h2>{t("conflict.title")}</h2>
      <div className="desc">{t("conflict.body")}</div>
      <div className="modal-actions" style={{ flexDirection: "column", gap: 8 }}>
        <button className="btn" onClick={onUseCloud}>
          {t("conflict.useCloud")}
        </button>
        <button className="btn ghost" onClick={onUseLocal}>
          {t("conflict.useLocal")}
        </button>
      </div>
    </Modal>
  );
}
