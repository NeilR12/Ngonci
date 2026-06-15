import { Cipher, Keyring } from "./crypto";

export type Scheme = "base64" | "ascii" | "hex" | "url";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export class Codec {
  static encode(scheme: Scheme, text: string): string {
    switch (scheme) {
      case "base64":
        return btoa(unescape(encodeURIComponent(text)));
      case "ascii":
        return [...text].map((ch) => ch.charCodeAt(0)).join(" ");
      case "hex":
        return [...text].map((ch) => ch.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
      case "url":
        return encodeURIComponent(text);
    }
  }

  static decode(scheme: Scheme, text: string): string {
    switch (scheme) {
      case "base64":
        return decodeURIComponent(escape(atob(text)));
      case "ascii":
        return text.trim().split(/\s+/).map((n) => String.fromCharCode(Number(n))).join("");
      case "hex":
        return text.trim().split(/\s+/).map((h) => String.fromCharCode(parseInt(h, 16))).join("");
      case "url":
        return decodeURIComponent(text);
    }
  }

  static async encrypt(passphrase: string, text: string): Promise<string> {
    const salt = Cipher.random(16);
    const sealed = await Cipher.seal(await Keyring.fromPassphrase(passphrase, salt), encoder.encode(text));
    return [Cipher.toBase64(salt), sealed.iv, sealed.data].join(".");
  }

  static async decrypt(passphrase: string, payload: string): Promise<string> {
    const [salt, iv, body] = payload.split(".");
    const key = await Keyring.fromPassphrase(passphrase, Cipher.fromBase64(salt));
    return decoder.decode(await Cipher.open(key, iv, body));
  }
}
