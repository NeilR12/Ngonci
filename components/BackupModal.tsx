"use client";

import { useRef } from "react";
import Modal from "./Modal";
import { useI18n } from "./LangProvider";
import { storage } from "@/lib/store";
import { notify } from "@/lib/ui";

interface Props {
  onClose: () => void;
  onImported: () => void;
  onRegen: () => void;
}

export default function BackupModal({ onClose, onImported, onRegen }: Props) {
  const { t } = useI18n();
  const picker = useRef<HTMLInputElement>(null);
  const record = storage.read();
  const hasRecovery = !!record?.recoveryKey;

  const download = () => {
    const data = storage.raw();
    if (!data) return;
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "konci-backup-" + new Date().toISOString().slice(0, 10) + ".konci";
    link.click();
    URL.revokeObjectURL(url);
    notify(t("backup.downloaded"));
  };

  const restore = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        storage.load(String(reader.result));
      } catch {
        notify(t("backup.invalid"));
        return;
      }
      if (!confirm(t("confirm.import"))) return;
      onImported();
      notify(t("backup.imported"));
    };
    reader.readAsText(file);
  };

  return (
    <Modal onClose={onClose}>
      <h2>{t("backup.title")}</h2>
      <div className="desc">{t("backup.desc")}</div>

      <div className="backup-sec">
        <div className="bs-title">{t("backup.exportTitle")}</div>
        <div className="bs-desc">{t("backup.exportDesc")}</div>
        <button className="btn" style={{ width: "auto", padding: "10px 18px" }} onClick={download}>
          {t("backup.exportBtn")}
        </button>
      </div>

      <div className="backup-sec">
        <div className="bs-title">{t("backup.importTitle")}</div>
        <div className="bs-desc">{t("backup.importDesc")}</div>
        <input
          ref={picker}
          type="file"
          accept=".konci,application/json"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) restore(file);
          }}
        />
        <button className="btn ghost" style={{ width: "auto", padding: "10px 18px" }} onClick={() => picker.current?.click()}>
          {t("backup.importBtn")}
        </button>
      </div>

      <div className="backup-sec">
        <div className="bs-title">{t("backup.recoveryTitle")}</div>
        <div className="bs-desc">{t("backup.recoveryDesc")}</div>
        <button className="btn ghost" style={{ width: "auto", padding: "10px 18px" }} onClick={onRegen}>
          {hasRecovery ? t("backup.recoveryRecreate") : t("backup.recoveryNew")}
        </button>
      </div>

      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          {t("backup.close")}
        </button>
      </div>
    </Modal>
  );
}
