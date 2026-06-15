export interface Sealed {
  iv: string;
  data: string;
}

export class Cipher {
  static random(size: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(size));
  }

  static toBase64(bytes: ArrayBuffer | Uint8Array): string {
    return btoa(String.fromCharCode(...new Uint8Array(bytes as ArrayBuffer)));
  }

  static fromBase64(text: string): Uint8Array {
    return Uint8Array.from(atob(text), (ch) => ch.charCodeAt(0));
  }

  static async seal(key: CryptoKey, bytes: Uint8Array): Promise<Sealed> {
    const iv = Cipher.random(12);
    const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
    return { iv: Cipher.toBase64(iv), data: Cipher.toBase64(data) };
  }

  static async open(key: CryptoKey, iv: string, data: string): Promise<Uint8Array> {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: Cipher.fromBase64(iv) },
      key,
      Cipher.fromBase64(data),
    );
    return new Uint8Array(plain);
  }
}

export const DEFAULT_ROUNDS = 600_000;

const lookalikeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class Keyring {
  static async fromPassphrase(passphrase: string, salt: Uint8Array, rounds = DEFAULT_ROUNDS): Promise<CryptoKey> {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: rounds, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  static importDataKey(raw: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }

  static recoveryPhrase(): string {
    const bytes = Cipher.random(24);
    let phrase = "";
    for (let i = 0; i < bytes.length; i++) {
      phrase += lookalikeAlphabet[bytes[i] % lookalikeAlphabet.length];
      if (i % 4 === 3 && i < bytes.length - 1) phrase += "-";
    }
    return phrase;
  }

  // Normalize a recovery phrase so dashes, spaces, and letter case don't matter.
  static normalize(phrase: string): string {
    return phrase.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }
}
