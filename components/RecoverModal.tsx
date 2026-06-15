"use client";

import { useState } from "react";
import Modal from "./Modal";
import { useI18n } from "./LangProvider";

export default function RecoverModal({
  onClose,
  onRecover,
}: {
  onClose: () => void;
  onRecover: (phrase: string, password: string) => Promise<boolean>;
}) {
  const { t } = useI18n();
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (password.length < 8) return setError(t("recover.errShort"));
    if (password !== confirm) return setError(t("recover.errMismatch"));
    if (!(await onRecover(phrase, password))) setError(t("recover.errWrong"));
  };

  return (
    <Modal onClose={onClose}>
      <h2>{t("recover.title")}</h2>
      <div className="desc">{t("recover.desc")}</div>
      <div className="field">
        <label>{t("recover.key")}</label>
        <div className="input-wrap">
          <input className="text" value={phrase} onChange={(event) => setPhrase(event.target.value)} placeholder="XXXX-XXXX-XXXX-..." />
        </div>
      </div>
      <div className="field">
        <label>{t("recover.newMaster")}</label>
        <div className="input-wrap">
          <input className="text" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("lock.minChars")} autoComplete="off" />
        </div>
      </div>
      <div className="field">
        <label>{t("recover.repeatNew")}</label>
        <div className="input-wrap">
          <input className="text" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="off" />
        </div>
      </div>
      <div className="err">{error}</div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          {t("recover.cancel")}
        </button>
        <button className="btn" onClick={submit}>
          {t("recover.restore")}
        </button>
      </div>
    </Modal>
  );
}
