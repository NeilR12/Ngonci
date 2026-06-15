import { Strength } from "./password";
import type { Entry, VaultData } from "./types";

export interface Issue {
  kind: "reused" | "weak" | "stale";
  label: string;
  severe: boolean;
}

const staleAfterDays = 60;
const weakBelowBits = 50;

export class Audit {
  static ageDays(entry: Entry): number {
    return Math.floor((Date.now() - entry.lastChanged) / 86_400_000);
  }

  static stale(entry: Entry): boolean {
    return Audit.ageDays(entry) >= staleAfterDays;
  }

  static weak(entry: Entry): boolean {
    return Strength.bits(entry.password) < weakBelowBits;
  }

  static duplicates(entries: Entry[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const entry of entries) counts.set(entry.password, (counts.get(entry.password) ?? 0) + 1);
    return counts;
  }

  static reused(entry: Entry, counts: Map<string, number>): boolean {
    return (counts.get(entry.password) ?? 0) > 1;
  }

  static issues(entry: Entry, counts: Map<string, number>): Issue[] {
    const found: Issue[] = [];
    if (Audit.reused(entry, counts)) found.push({ kind: "reused", label: "Dipakai ulang", severe: true });
    if (Audit.weak(entry)) found.push({ kind: "weak", label: "Sandi lemah", severe: true });
    if (Audit.stale(entry)) found.push({ kind: "stale", label: `${Audit.ageDays(entry)} hari`, severe: false });
    return found;
  }

  static review(data: VaultData) {
    const counts = Audit.duplicates(data.entries);
    const flagged = data.entries
      .map((entry) => ({ entry, issues: Audit.issues(entry, counts) }))
      .filter((row) => row.issues.length)
      .sort((a, b) => b.issues.length - a.issues.length);
    const total = data.entries.length;
    const stale = data.entries.filter(Audit.stale).length;
    const weak = data.entries.filter(Audit.weak).length;
    const reused = data.entries.filter((entry) => Audit.reused(entry, counts)).length;
    const healthy = total - flagged.length;
    const score = total ? Math.round((100 * healthy) / total) : 100;
    return { total, healthy, stale, weak, reused, score, flagged };
  }
}

const palette = ["#4f9cf9", "#6ee7b7", "#f472b6", "#fbbf24", "#a78bfa", "#22d3ee", "#fb923c", "#34d399"];

export function swatch(seed: string): string {
  let hash = 0;
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}
