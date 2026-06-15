export interface GenOptions {
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  lookalikes: boolean;
}

const sets = {
  lower: "abcdefghijkmnpqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
  lookalikes: "il1Lo0O",
};

export class Generator {
  static make(length: number, options: GenOptions): string {
    let pool = "";
    if (options.lower) pool += sets.lower;
    if (options.upper) pool += sets.upper;
    if (options.digits) pool += sets.digits;
    if (options.symbols) pool += sets.symbols;
    if (options.lookalikes) pool += sets.lookalikes;
    if (!pool) pool = sets.lower;

    const picks = crypto.getRandomValues(new Uint32Array(length));
    let result = "";
    for (let i = 0; i < length; i++) result += pool[picks[i] % pool.length];
    return result;
  }
}

export interface StrengthInfo {
  score: number;
  label: string;
  color: string;
}

export class Strength {
  static bits(password: string): number {
    if (!password) return 0;
    let alphabet = 0;
    if (/[a-z]/.test(password)) alphabet += 26;
    if (/[A-Z]/.test(password)) alphabet += 26;
    if (/[0-9]/.test(password)) alphabet += 10;
    if (/[^a-zA-Z0-9]/.test(password)) alphabet += 28;
    return password.length * Math.log2(alphabet || 1);
  }

  static of(password: string): StrengthInfo {
    const bits = Strength.bits(password);
    if (!password) return { score: 0, label: "—", color: "#3a4759" };
    if (bits < 40) return { score: 25, label: `Lemah · ~${Math.round(bits)} bit`, color: "#f87171" };
    if (bits < 60) return { score: 50, label: `Cukup · ~${Math.round(bits)} bit`, color: "#fbbf24" };
    if (bits < 80) return { score: 75, label: `Kuat · ~${Math.round(bits)} bit`, color: "#4f9cf9" };
    return { score: 100, label: `Sangat kuat · ~${Math.round(bits)} bit`, color: "#6ee7b7" };
  }
}
