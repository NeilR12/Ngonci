import { cloud } from "./cloud";
import { storage } from "./store";
import type { VaultRecord } from "./types";

export interface RemoteState {
  record: VaultRecord | null;
  rev: number;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

// Download the remote vault into local storage. Returns whether a record was found.
export async function pullIntoLocal(): Promise<RemoteState> {
  const remote = await cloud.pull();
  if (remote.record) {
    storage.write(remote.record);
    storage.setRev(remote.rev);
  }
  return remote;
}

// Push the current local vault to the cloud after a short debounce.
// onConflict fires when the server already holds a newer revision.
export function schedulePush(onConflict: (remote: RemoteState) => void): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const record = storage.read();
    if (!record) return;
    const result = await cloud.push(record, storage.rev()).catch(() => null);
    if (!result) return; // offline or transient error — next save retries
    if (result.ok) storage.setRev(result.rev);
    else if (result.conflict) onConflict({ record: result.record, rev: result.rev });
  }, 1500);
}

// Upload the current local vault immediately, e.g. when turning sync on.
export async function pushNow(): Promise<boolean> {
  const record = storage.read();
  if (!record) return false;
  const result = await cloud.push(record, storage.rev()).catch(() => null);
  if (result && result.ok) {
    storage.setRev(result.rev);
    return true;
  }
  return false;
}

// Accept the remote version during a conflict: overwrite local with it.
export function acceptRemote(remote: RemoteState): void {
  if (!remote.record) return;
  storage.write(remote.record);
  storage.setRev(remote.rev);
}

// Keep the local version during a conflict: adopt the remote rev so the next push wins.
export async function keepLocal(remote: RemoteState): Promise<boolean> {
  storage.setRev(remote.rev);
  return pushNow();
}
