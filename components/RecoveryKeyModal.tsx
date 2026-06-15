"use client";

import { useState } from "react";
import Modal from "./Modal";
import { useI18n } from "./LangProvider";
import { copy } from "@/lib/ui";

export default function RecoveryKeyModal({
  phrase,
  firstTime,
  onClose,
}: {
  phrase: string;
  firstTime: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [acknowledged, setAcknowledged] = useState(!firstTime);

  return (
    <Modal onClose={firstTime ? () => {} : onClose}>
      <h2>{t("rk.title")}</h2>
      <div className="desc">{t("rk.body")}</div>
      <div className="rk-box">{phrase}</div>

      <div className="ack-how">
        <div className="ack-how-title">{t("rk.howTitle")}</div>
        <div className="ack-how-body">{t("rk.how")}</div>
      </div>

      {firstTime && (
        <label className="ack-check">
          <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
          <span>{t("rk.understand")}</span>
        </label>
      )}

      <div className="modal-actions">
        <button className="btn ghost" onClick={() => copy(phrase)}>
          {t("rk.copy")}
        </button>
        <button className="btn" disabled={!acknowledged} onClick={onClose}>
          {firstTime ? t("rk.gotIt") : t("rk.close")}
        </button>
      </div>
    </Modal>
  );
}
