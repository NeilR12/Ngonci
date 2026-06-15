export interface Entry {
  id: string;
  name: string;
  username: string;
  password: string;
  category: string;
  url: string;
  notes: string;
  createdAt: number;
  lastChanged: number;
}

export interface VaultData {
  entries: Entry[];
  categories: string[];
}

export interface VaultRecord {
  version: number;
  rounds: number;
  passSalt: string;
  passIv: string;
  passKey: string;
  recoverySalt: string;
  recoveryIv: string;
  recoveryKey: string;
  iv: string;
  body: string;
}

export type StorageMode = "local" | "cloud";

export interface SyncedVault {
  record: VaultRecord;
  rev: number;
}

export type ViewName = "dashboard" | "vault" | "mindmap";

export type ActiveFilter =
  | { type: "all" }
  | { type: "stale" }
  | { type: "cat"; value: string }
  | { type: "entry"; value: string };
