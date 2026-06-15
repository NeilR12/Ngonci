import type { VaultRecord } from "./types";

export interface PullResult {
  record: VaultRecord | null;
  rev: number;
}

export type PushResult =
  | { ok: true; rev: number }
  | { ok: false; conflict: true; record: VaultRecord | null; rev: number }
  | { ok: false; conflict: false };

export const cloud = {
  async pull(): Promise<PullResult> {
    const response = await fetch("/api/vault", { cache: "no-store" });
    if (response.status === 401) throw new Error("unauthorized");
    const data = await response.json();
    return { record: (data.record as VaultRecord | null) ?? null, rev: Number(data.rev ?? 0) };
  },

  async push(record: VaultRecord, rev: number): Promise<PushResult> {
    const response = await fetch("/api/vault", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ record, rev }),
    });
    if (response.ok) {
      const data = await response.json();
      return { ok: true, rev: Number(data.rev) };
    }
    if (response.status === 409) {
      const data = await response.json();
      return { ok: false, conflict: true, record: (data.record as VaultRecord | null) ?? null, rev: Number(data.rev ?? 0) };
    }
    return { ok: false, conflict: false };
  },
};
