import { tr } from "./i18n";

export function notify(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("konci:toast", { detail: message }));
}

export async function copy(value: string): Promise<void> {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    notify(tr("toast.copied"));
    setTimeout(() => navigator.clipboard.writeText("").catch(() => {}), 20000);
  } catch {
    notify(tr("toast.copyFailed"));
  }
}
