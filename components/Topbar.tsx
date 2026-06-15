"use client";

import { LockIcon, PlusIcon } from "./icons";
import LangSwitch from "./LangSwitch";
import { useI18n } from "./LangProvider";
import type { ViewName } from "@/lib/types";

interface Props {
  view: ViewName;
  onView: (view: ViewName) => void;
  onTools: () => void;
  onAdd: () => void;
  onBackup: () => void;
  onSettings: () => void;
  onLock: () => void;
}

export default function Topbar({ view, onView, onTools, onAdd, onBackup, onSettings, onLock }: Props) {
  const { t } = useI18n();
  const tabs: { id: ViewName; label: string }[] = [
    { id: "dashboard", label: t("nav.dashboard") },
    { id: "vault", label: t("nav.vault") },
    { id: "mindmap", label: t("nav.map") },
  ];

  return (
    <div className="topbar">
      <div className="left">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="logo-badge sm">
            <LockIcon size={18} />
          </div>
          <div className="brand">
            Kon<span>ci</span>
          </div>
        </div>
        <div className="nav">
          {tabs.map((tab) => (
            <button key={tab.id} className={view === tab.id ? "active" : ""} onClick={() => onView(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="top-actions">
        <LangSwitch />
        <button className="icon-btn" onClick={onTools}>
          {t("act.tools")}
        </button>
        <button className="icon-btn" onClick={onAdd}>
          <PlusIcon /> {t("act.add")}
        </button>
        <button className="icon-btn" onClick={onBackup}>
          {t("act.backup")}
        </button>
        <button className="icon-btn" onClick={onSettings}>
          {t("mode.button")}
        </button>
        <button className="icon-btn danger" onClick={onLock}>
          {t("act.lock")}
        </button>
      </div>
    </div>
  );
}
