"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LockScreen from "@/components/LockScreen";
import Topbar from "@/components/Topbar";
import Dashboard from "@/components/Dashboard";
import VaultView from "@/components/VaultView";
import Mindmap from "@/components/Mindmap";
import EntryModal, { type EntryData } from "@/components/EntryModal";
import ToolsModal from "@/components/ToolsModal";
import BackupModal from "@/components/BackupModal";
import CategoryModal from "@/components/CategoryModal";
import RecoverModal from "@/components/RecoverModal";
import RecoveryKeyModal from "@/components/RecoveryKeyModal";
import StorageSettings from "@/components/StorageSettings";
import ConflictModal from "@/components/ConflictModal";
import Toaster from "@/components/Toaster";
import { useI18n } from "@/components/LangProvider";
import { Generator } from "@/lib/password";
import { Session } from "@/lib/session";
import { storage } from "@/lib/store";
import { Vault } from "@/lib/vault";
import { notify } from "@/lib/ui";
import { currentEmail } from "@/lib/account";
import { acceptRemote, keepLocal, pullIntoLocal, pushNow, schedulePush, type RemoteState } from "@/lib/sync";
import type { ActiveFilter, Entry, StorageMode, ViewName } from "@/lib/types";

type Phase = "loading" | "setup" | "unlock" | "app";

type Dialog =
  | { kind: "none" }
  | { kind: "entry"; entry: Entry | null }
  | { kind: "tools" }
  | { kind: "backup" }
  | { kind: "category" }
  | { kind: "recover" }
  | { kind: "storage" }
  | { kind: "conflict"; remote: RemoteState }
  | { kind: "phrase"; phrase: string; firstTime: boolean };

const idleTimeout = 5 * 60 * 1000;

const strongPassword = () => Generator.make(18, { lower: true, upper: true, digits: true, symbols: true, lookalikes: false });

export default function Page() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<ViewName>("dashboard");
  const [vault, setVault] = useState<Vault | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActiveFilter>({ type: "all" });
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });

  const session = useRef<Session | null>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      if (storage.mode() === "cloud" && (await currentEmail())) {
        try {
          await pullIntoLocal();
        } catch {
          /* offline or signed out — fall back to local cache */
        }
      }
      setPhase(Session.exists() ? "unlock" : "setup");
    })();
  }, []);

  const lock = useCallback(() => {
    session.current = null;
    setVault(null);
    setDialog({ kind: "none" });
    setPhase(Session.exists() ? "unlock" : "setup");
    if (idle.current) clearTimeout(idle.current);
  }, []);

  const bumpIdle = useCallback(() => {
    if (idle.current) clearTimeout(idle.current);
    if (session.current) idle.current = setTimeout(lock, idleTimeout);
  }, [lock]);

  useEffect(() => {
    if (phase !== "app") return;
    const onActivity = () => bumpIdle();
    const events: (keyof DocumentEventMap)[] = ["click", "keydown", "mousemove", "touchstart"];
    events.forEach((event) => document.addEventListener(event, onActivity, { passive: true }));
    bumpIdle();
    return () => events.forEach((event) => document.removeEventListener(event, onActivity));
  }, [phase, bumpIdle]);

  const commit = useCallback((next: Vault) => {
    setVault(next);
    session.current
      ?.save(next)
      .then(() => {
        if (storage.mode() === "cloud") schedulePush((remote) => setDialog({ kind: "conflict", remote }));
      })
      .catch(() => {});
  }, []);

  const doSetup = async (password: string, confirm: string) => {
    setError("");
    if (password.length < 8) return setError(t("err.minChars"));
    if (password !== confirm) return setError(t("err.mismatch"));
    const { session: opened, phrase } = await Session.create(password);
    session.current = opened;
    setVault(opened.vault);
    setPhase("app");
    if (storage.mode() === "cloud") pushNow().catch(() => {});
    setDialog({ kind: "phrase", phrase, firstTime: true });
  };

  const doUnlock = async (password: string) => {
    setError("");
    try {
      const opened = await Session.open(password);
      session.current = opened;
      setVault(opened.vault);
      setPhase("app");
    } catch {
      setError(t("err.wrongMaster"));
    }
  };

  const doRecover = async (phrase: string, password: string): Promise<boolean> => {
    try {
      const opened = await Session.restore(phrase, password);
      session.current = opened;
      setVault(opened.vault);
      setPhase("app");
      setDialog({ kind: "none" });
      notify(t("recover.done"));
      return true;
    } catch {
      return false;
    }
  };

  const reset = () => {
    if (confirm(t("confirm.reset"))) {
      storage.clear();
      lock();
    }
  };

  const onModeChanged = async (mode: StorageMode) => {
    if (mode !== "cloud") return;
    try {
      const remote = await pullIntoLocal();
      if (!remote.record) {
        await pushNow();
      } else if (session.current) {
        try {
          setVault(await session.current.reload());
        } catch {
          lock();
        }
      }
    } catch {
      /* ignore: stays on local cache */
    }
  };

  const saveEntry = (data: EntryData, id: string | null) => {
    if (!vault) return;
    if (id) {
      const current = vault.entries.find((entry) => entry.id === id);
      const lastChanged = current && current.password !== data.password ? Date.now() : current?.lastChanged ?? Date.now();
      commit(vault.replace(id, { ...data, lastChanged }));
    } else {
      const entry: Entry = { id: crypto.randomUUID(), ...data, createdAt: Date.now(), lastChanged: Date.now() };
      commit(vault.add(entry));
    }
    setDialog({ kind: "none" });
    notify(id ? t("toast.saved") : t("toast.added"));
  };

  const deleteEntry = (entry: Entry) => {
    if (!vault || !confirm(t("confirm.deleteAccount", { name: entry.name }))) return;
    commit(vault.remove(entry.id));
    notify(t("toast.deleted"));
  };

  const rotate = (entry: Entry) => {
    if (!vault) return;
    const password = strongPassword();
    commit(vault.replace(entry.id, { password, lastChanged: Date.now() }));
    navigator.clipboard?.writeText(password).catch(() => {});
    notify(t("toast.rotated"));
  };

  const addCategory = (name: string) => {
    if (vault) commit(vault.addCategory(name));
  };

  const deleteCategory = (name: string) => {
    if (!vault) return;
    if (vault.categories.length <= 1) return notify(t("toast.minCategory"));
    const count = vault.within(name).length;
    const message = count ? t("confirm.deleteCategoryMove", { name, n: count }) : t("confirm.deleteCategory", { name });
    if (!confirm(message)) return;
    commit(vault.dropCategory(name));
  };

  const reorderCategories = (order: string[]) => {
    if (vault) commit(vault.reorderCategories(order));
  };

  const regenRecovery = async () => {
    if (!session.current) return;
    const phrase = await session.current.newRecoveryPhrase();
    setDialog({ kind: "phrase", phrase, firstTime: false });
  };

  const resolveConflict = async (useCloud: boolean, remote: RemoteState) => {
    if (useCloud) {
      acceptRemote(remote);
      if (session.current) {
        try {
          setVault(await session.current.reload());
        } catch {
          lock();
        }
      }
    } else {
      await keepLocal(remote);
    }
    setDialog({ kind: "none" });
  };

  if (phase === "loading") return <Toaster />;

  if (phase !== "app" || !vault) {
    return (
      <>
        <LockScreen
          mode={phase === "setup" ? "setup" : "unlock"}
          error={error}
          onSetup={doSetup}
          onUnlock={doUnlock}
          onRecover={() => setDialog({ kind: "recover" })}
          onReset={reset}
        />
        {dialog.kind === "recover" && <RecoverModal onClose={() => setDialog({ kind: "none" })} onRecover={doRecover} />}
        <Toaster />
      </>
    );
  }

  return (
    <div id="app" style={{ display: "block", minHeight: "100vh" }}>
      <Topbar
        view={view}
        onView={setView}
        onTools={() => setDialog({ kind: "tools" })}
        onAdd={() => setDialog({ kind: "entry", entry: null })}
        onBackup={() => setDialog({ kind: "backup" })}
        onSettings={() => setDialog({ kind: "storage" })}
        onLock={lock}
      />

      {view === "dashboard" && <Dashboard vault={vault} onEdit={(entry) => setDialog({ kind: "entry", entry })} onRotate={rotate} />}
      {view === "vault" && (
        <VaultView
          vault={vault}
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          onManageCats={() => setDialog({ kind: "category" })}
          onEdit={(entry) => setDialog({ kind: "entry", entry })}
          onRotate={rotate}
          onDelete={deleteEntry}
        />
      )}
      {view === "mindmap" && <Mindmap vault={vault} onEdit={(entry) => setDialog({ kind: "entry", entry })} />}

      {dialog.kind === "entry" && (
        <EntryModal
          entry={dialog.entry}
          categories={vault.categories}
          onClose={() => setDialog({ kind: "none" })}
          onAddCategory={addCategory}
          onSave={saveEntry}
        />
      )}
      {dialog.kind === "tools" && <ToolsModal onClose={() => setDialog({ kind: "none" })} />}
      {dialog.kind === "backup" && <BackupModal onClose={() => setDialog({ kind: "none" })} onImported={lock} onRegen={regenRecovery} />}
      {dialog.kind === "category" && (
        <CategoryModal vault={vault} onClose={() => setDialog({ kind: "none" })} onAdd={addCategory} onDelete={deleteCategory} onReorder={reorderCategories} />
      )}
      {dialog.kind === "storage" && <StorageSettings onClose={() => setDialog({ kind: "none" })} onChanged={onModeChanged} />}
      {dialog.kind === "conflict" && (
        <ConflictModal
          onUseCloud={() => resolveConflict(true, dialog.remote)}
          onUseLocal={() => resolveConflict(false, dialog.remote)}
          onClose={() => setDialog({ kind: "none" })}
        />
      )}
      {dialog.kind === "phrase" && (
        <RecoveryKeyModal phrase={dialog.phrase} firstTime={dialog.firstTime} onClose={() => setDialog({ kind: "none" })} />
      )}

      <Toaster />
    </div>
  );
}
