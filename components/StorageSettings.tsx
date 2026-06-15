"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useI18n } from "./LangProvider";
import { currentEmail, login, logout, signup } from "@/lib/account";
import { storage } from "@/lib/store";
import type { StorageMode } from "@/lib/types";

export default function StorageSettings({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: (mode: StorageMode) => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<StorageMode>(storage.mode());
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    currentEmail().then(setEmail);
  }, []);

  const chooseLocal = () => {
    storage.setMode("local");
    setMode("local");
    onChanged("local");
  };

  const enableCloud = () => {
    storage.setMode("cloud");
    setMode("cloud");
    onChanged("cloud");
  };

  const submit = async () => {
    const address = form.email.trim().toLowerCase();
    setError("");
    setBusy(true);
    if (tab === "signup") {
      const created = await signup(address, form.password);
      if (!created.ok) {
        setBusy(false);
        return setError(
          created.error === "exists" ? t("auth.exists") : created.error === "weak-password" ? t("auth.weak") : t("auth.invalidEmail"),
        );
      }
    }
    const ok = await login(address, form.password);
    setBusy(false);
    if (!ok) return setError(t("auth.wrong"));
    setEmail(address);
    enableCloud();
  };

  const doLogout = async () => {
    await logout();
    setEmail(null);
    chooseLocal();
  };

  return (
    <Modal onClose={onClose}>
      <h2>{t("mode.title")}</h2>
      <div className="desc">{t("mode.desc")}</div>

      <button className={"backup-sec mode-card" + (mode === "local" ? " active" : "")} onClick={chooseLocal}>
        <div className="bs-title">{t("mode.local")}</div>
        <div className="bs-desc">{t("mode.localDesc")}</div>
      </button>

      <div className={"backup-sec" + (mode === "cloud" ? " active" : "")}>
        <div className="bs-title">{t("mode.cloud")}</div>
        <div className="bs-desc">{t("mode.cloudDesc")}</div>

        {email ? (
          <div>
            <div style={{ fontSize: 13, margin: "4px 0 10px" }}>{t("mode.signedInAs", { email })}</div>
            <div className="mode-actions">
              {mode !== "cloud" && (
                <button className="btn" style={{ width: "auto", padding: "9px 16px" }} onClick={enableCloud}>
                  {t("mode.cloud")}
                </button>
              )}
              {mode === "cloud" && <span className="sync-status">{t("mode.synced")}</span>}
              <button className="btn ghost" style={{ width: "auto", padding: "9px 16px" }} onClick={doLogout}>
                {t("mode.signOut")}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bs-desc" style={{ marginTop: 4 }}>
              {t("mode.accountNote")}
            </div>
            <div className="seg" style={{ marginTop: 10 }}>
              <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>
                {t("auth.login")}
              </button>
              <button className={tab === "signup" ? "active" : ""} onClick={() => setTab("signup")}>
                {t("auth.signup")}
              </button>
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label>{t("auth.email")}</label>
              <div className="input-wrap">
                <input className="text" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" />
              </div>
            </div>
            <div className="field">
              <label>{t("auth.password")}</label>
              <div className="input-wrap">
                <input
                  className="text"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  autoComplete={tab === "signup" ? "new-password" : "current-password"}
                />
              </div>
            </div>
            <div className="err">{error}</div>
            <button className="btn" disabled={busy} onClick={submit}>
              {tab === "login" ? t("auth.login") : t("auth.signup")}
            </button>
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          {t("mode.close")}
        </button>
      </div>
    </Modal>
  );
}
