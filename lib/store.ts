import type { StorageMode, VaultRecord } from "./types";

const key = "konci.vault";
const revKey = "konci.rev";
const modeKey = "konci.mode";

export const storage = {
  read(): VaultRecord | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as VaultRecord;
    } catch {
      return null;
    }
  },

  write(record: VaultRecord): void {
    localStorage.setItem(key, JSON.stringify(record));
  },

  raw(): string | null {
    return typeof window === "undefined" ? null : localStorage.getItem(key);
  },

  load(text: string): void {
    const record = JSON.parse(text) as VaultRecord;
    if (!record.iv || !record.body || !record.passKey) throw new Error("invalid backup");
    localStorage.setItem(key, JSON.stringify(record));
  },

  clear(): void {
    localStorage.removeItem(key);
    localStorage.removeItem(revKey);
  },

  rev(): number {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(revKey) ?? 0);
  },

  setRev(value: number): void {
    localStorage.setItem(revKey, String(value));
  },

  mode(): StorageMode {
    if (typeof window === "undefined") return "local";
    return localStorage.getItem(modeKey) === "cloud" ? "cloud" : "local";
  },

  setMode(mode: StorageMode): void {
    localStorage.setItem(modeKey, mode);
  },
};
