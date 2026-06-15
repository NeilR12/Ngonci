import type { Entry, VaultData } from "./types";

const starterCategories = ["Banking", "Social", "Work", "Other"];

export class Vault {
  readonly entries: Entry[];
  readonly categories: string[];

  constructor(data?: Partial<VaultData>) {
    this.entries = data?.entries ?? [];
    this.categories = data?.categories ?? [...starterCategories];
  }

  data(): VaultData {
    return { entries: this.entries, categories: this.categories };
  }

  private patch(changes: Partial<VaultData>): Vault {
    return new Vault({
      entries: changes.entries ?? this.entries,
      categories: changes.categories ?? this.categories,
    });
  }

  add(entry: Entry): Vault {
    return this.patch({ entries: [...this.entries, entry] });
  }

  replace(id: string, changes: Partial<Entry>): Vault {
    return this.patch({ entries: this.entries.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)) });
  }

  remove(id: string): Vault {
    return this.patch({ entries: this.entries.filter((entry) => entry.id !== id) });
  }

  addCategory(name: string): Vault {
    if (this.categories.some((category) => category.toLowerCase() === name.toLowerCase())) return this;
    return this.patch({ categories: [...this.categories, name] });
  }

  dropCategory(name: string, fallback = "Other"): Vault {
    const categories = this.categories.filter((category) => category !== name);
    if (!categories.includes(fallback)) categories.push(fallback);
    const entries = this.entries.map((entry) => (entry.category === name ? { ...entry, category: fallback } : entry));
    return new Vault({ entries, categories });
  }

  reorderCategories(order: string[]): Vault {
    return this.patch({ categories: order });
  }

  within(category: string): Entry[] {
    return this.entries.filter((entry) => entry.category === category);
  }
}
