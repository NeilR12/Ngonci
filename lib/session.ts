import { Cipher, DEFAULT_ROUNDS, Keyring } from "./crypto";
import { storage } from "./store";
import { Vault } from "./vault";
import type { VaultData, VaultRecord } from "./types";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

async function freeze(passphrase: string, dataKey: Uint8Array, key: CryptoKey, vault: Vault) {
  const passSalt = Cipher.random(16);
  const passWrap = await Cipher.seal(await Keyring.fromPassphrase(passphrase, passSalt, DEFAULT_ROUNDS), dataKey);
  const phrase = Keyring.recoveryPhrase();
  const recoverySalt = Cipher.random(16);
  const recoveryWrap = await Cipher.seal(await Keyring.fromPassphrase(Keyring.normalize(phrase), recoverySalt, DEFAULT_ROUNDS), dataKey);
  const payload = await Cipher.seal(key, encoder.encode(JSON.stringify(vault.data())));
  const record: VaultRecord = {
    version: 1,
    rounds: DEFAULT_ROUNDS,
    passSalt: Cipher.toBase64(passSalt),
    passIv: passWrap.iv,
    passKey: passWrap.data,
    recoverySalt: Cipher.toBase64(recoverySalt),
    recoveryIv: recoveryWrap.iv,
    recoveryKey: recoveryWrap.data,
    iv: payload.iv,
    body: payload.data,
  };
  return { record, phrase };
}

export class Session {
  private constructor(private readonly key: CryptoKey, private readonly dataKey: Uint8Array, public vault: Vault) {}

  static exists(): boolean {
    return storage.read() !== null;
  }

  static async create(passphrase: string): Promise<{ session: Session; phrase: string }> {
    const dataKey = Cipher.random(32);
    const key = await Keyring.importDataKey(dataKey);
    const vault = new Vault();
    const { record, phrase } = await freeze(passphrase, dataKey, key, vault);
    storage.write(record);
    return { session: new Session(key, dataKey, vault), phrase };
  }

  static async open(passphrase: string): Promise<Session> {
    const record = storage.read();
    if (!record) throw new Error("empty");
    const wrapKey = await Keyring.fromPassphrase(passphrase, Cipher.fromBase64(record.passSalt), record.rounds);
    const dataKey = await Cipher.open(wrapKey, record.passIv, record.passKey);
    const key = await Keyring.importDataKey(dataKey);
    const data = JSON.parse(decoder.decode(await Cipher.open(key, record.iv, record.body))) as VaultData;
    return new Session(key, dataKey, new Vault(data));
  }

  static async restore(phrase: string, passphrase: string): Promise<Session> {
    const record = storage.read();
    if (!record) throw new Error("empty");
    const salt = Cipher.fromBase64(record.recoverySalt);
    let dataKey: Uint8Array;
    try {
      dataKey = await Cipher.open(await Keyring.fromPassphrase(Keyring.normalize(phrase), salt, record.rounds), record.recoveryIv, record.recoveryKey);
    } catch {
      // Fall back to the older format (phrase used with its dashes) for vaults created before this change.
      dataKey = await Cipher.open(await Keyring.fromPassphrase(phrase.trim().toUpperCase(), salt, record.rounds), record.recoveryIv, record.recoveryKey);
    }
    const key = await Keyring.importDataKey(dataKey);
    const data = JSON.parse(decoder.decode(await Cipher.open(key, record.iv, record.body))) as VaultData;
    const passSalt = Cipher.random(16);
    const passWrap = await Cipher.seal(await Keyring.fromPassphrase(passphrase, passSalt, record.rounds), dataKey);
    storage.write({ ...record, passSalt: Cipher.toBase64(passSalt), passIv: passWrap.iv, passKey: passWrap.data });
    return new Session(key, dataKey, new Vault(data));
  }

  async save(vault: Vault): Promise<void> {
    this.vault = vault;
    const record = storage.read();
    if (!record) return;
    const payload = await Cipher.seal(this.key, encoder.encode(JSON.stringify(vault.data())));
    storage.write({ ...record, iv: payload.iv, body: payload.data });
  }

  // Re-read the local record and decrypt it with the in-memory key. Used after a
  // remote pull, since the data key is the same for a given vault.
  async reload(): Promise<Vault> {
    const record = storage.read();
    if (!record) return this.vault;
    const data = JSON.parse(decoder.decode(await Cipher.open(this.key, record.iv, record.body))) as VaultData;
    this.vault = new Vault(data);
    return this.vault;
  }

  async newRecoveryPhrase(): Promise<string> {
    const record = storage.read();
    if (!record) throw new Error("empty");
    const phrase = Keyring.recoveryPhrase();
    const salt = Cipher.random(16);
    const wrap = await Cipher.seal(await Keyring.fromPassphrase(Keyring.normalize(phrase), salt, record.rounds), this.dataKey);
    storage.write({ ...record, recoverySalt: Cipher.toBase64(salt), recoveryIv: wrap.iv, recoveryKey: wrap.data });
    return phrase;
  }
}
