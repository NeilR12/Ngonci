"use client";

import { useState } from "react";
import { EyeIcon, LockIcon } from "./icons";
import LangSwitch from "./LangSwitch";
import { useI18n } from "./LangProvider";

interface Props {
  mode: "setup" | "unlock";
  error: string;
  onSetup: (password: string, confirm: string) => void;
  onUnlock: (password: string) => void;
  onRecover: () => void;
  onReset: () => void;
}

export default function LockScreen({ mode, error, onSetup, onUnlock, onRecover, onReset }: Props) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const inputType = reveal ? "text" : "password";
  const guard = { autoComplete: "off", spellCheck: false } as const;

  return (
    <div id="lockScreen">
      <div className="lock-lang">
        <LangSwitch />
      </div>
      <div className="lock-card">
        <div className="logo">
          <div className="logo-badge">
            <LockIcon size={24} />
          </div>
          <div className="brand">
            Kon<span>ci</span>
          </div>
        </div>
        <div className="tagline">{mode === "setup" ? t("app.taglineNew") : t("app.locked")}</div>

        {mode === "setup" ? (
          <div>
            <div className="field">
              <label>{t("lock.create")}</label>
              <div className="input-wrap">
                <input className="text" type={inputType} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("lock.minChars")} {...guard} />
                <button className="eye" type="button" onClick={() => setReveal((value) => !value)}>
                  <EyeIcon />
                </button>
              </div>
            </div>
            <div className="field">
              <label>{t("lock.repeat")}</label>
              <div className="input-wrap">
                <input className="text" type={inputType} value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder={t("lock.typeAgain")} {...guard} />
              </div>
            </div>
            <button className="btn" onClick={() => onSetup(password, confirm)}>
              {t("lock.createBtn")}
            </button>
            <div className="err">{error}</div>
            <div className="hint">{t("lock.createHint")}</div>
          </div>
        ) : (
          <div>
            <div className="field">
              <label>{t("lock.master")}</label>
              <div className="input-wrap">
                <input
                  className="text"
                  type={inputType}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onUnlock(password);
                  }}
                  placeholder={t("lock.enterMaster")}
                  {...guard}
                />
                <button className="eye" type="button" onClick={() => setReveal((value) => !value)}>
                  <EyeIcon />
                </button>
              </div>
            </div>
            <button className="btn" onClick={() => onUnlock(password)}>
              {t("lock.unlockBtn")}
            </button>
            <div className="err">{error}</div>
            <div className="hint">{t("lock.lockedHint")}</div>
            <button className="btn subtle" style={{ marginTop: 10 }} onClick={onRecover}>
              {t("lock.forgot")}
            </button>
            <button className="btn subtle" style={{ marginTop: 4, color: "#6b7787" }} onClick={onReset}>
              {t("lock.reset")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
