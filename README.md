# Konci

Konci is a small password manager you run yourself. It keeps your accounts and passwords encrypted on your own device, and it is built so that losing your laptop, or someone glancing at your screen, does not expose anything. The name is Sundanese for "key".

It is built with Next.js and TypeScript. By default it runs entirely in the browser with no backend and no account — everything stays on your device. If you want your vault on more than one device, there is an optional cloud sync mode you can turn on.

## How it works

When you first open Konci you create a master password. From that password the app derives an encryption key in your browser and uses it to encrypt your whole vault with AES‑256‑GCM. The master password itself is never stored or sent anywhere. What gets saved is only the encrypted blob, which is useless to anyone who does not know your password.

Because nobody but you holds the key, there is no "forgot password" email and no admin who can let you back in. To cover that, Konci also gives you a **recovery key** the first time you set up your vault. The recovery key can unlock the same vault independently, so if you forget your master password you can still get back in and set a new one. Keep it somewhere safe and offline. If you lose both the master password and the recovery key, the data is gone for good — that is the trade‑off for real privacy.

## Features

- A master password unlocks everything; nothing is readable without it.
- A recovery key so you can reset a forgotten master password without losing data.
- A dashboard with a health score and clear alerts for weak, reused, or aging passwords.
- A vault view with categories shown as a tree, search, and a click‑to‑reveal eye on every password.
- A map view that lays out your accounts per category, each with its password hidden until you reveal it.
- A built‑in generator with a strength meter.
- Encrypted import and export, so you can keep an offline backup file.
- A reminder to change passwords that are older than two months.
- A small set of encoding tools (Base64, ASCII, hex, URL) plus standalone AES text encryption.
- Three interface languages: English, Chinese, and Indonesian. English is the default.
- The vault locks itself after five minutes of inactivity.

## Running it locally

You need Node.js 18 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. To check types and build for production:

```bash
npm run typecheck
npm run build
```

## Deploying

Konci deploys to Vercel as a standard Next.js app: push the repository to GitHub, import it in Vercel, and deploy. For local-only use there are no required environment variables. If you turn on cloud sync you set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (in a local `.env` file and in Vercel's project settings). Full step-by-step instructions, including the database setup, are in `DEPLOY.md`.

## A note on data

Your vault lives in the browser's local storage on the device you use. It is always encrypted there. If you want it on more than one device you have two options: export a backup file and import it elsewhere (the file stays encrypted), or turn on cloud sync.

## Cloud sync (optional)

By default Konci runs in "This device only" mode and needs no account. If you want your vault to follow you across devices, open Sync in the top bar and create an account. From then on the encrypted blob is uploaded and pulled automatically.

The account password is only used to identify whose blob is whose. It is separate from your master password and cannot decrypt anything — even with cloud sync on, the server only ever stores ciphertext, and you still type your master password to unlock the vault on each device.

Sync uses Neon (Postgres) for storage and Auth.js for the account login. To enable it you set three environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`), run the Prisma migration once, and deploy. See `.env.example` and `DEPLOY.md` for the steps. If those variables are not set, the app simply stays in local-only mode.

## Contributing

The project is meant to be read, forked, and extended. The code is organized so each concern lives in its own module:

- `lib/crypto.ts` holds the `Cipher` and `Keyring` classes (AES‑GCM and key derivation).
- `lib/vault.ts` is the vault model.
- `lib/session.ts` ties together create, unlock, recover, and save.
- `lib/security.ts`, `lib/password.ts`, and `lib/codec.ts` cover the audit, the generator, and the encoders.
- `lib/i18n.ts` holds the translations.
- `components/` and `app/` hold the React UI.

If you want to add a feature, start in `lib/` for the logic and wire it into a component. Pull requests are welcome. Please do not replace the cryptography with a custom scheme — stick to the standard Web Crypto primitives.

## Security notes

- The cryptography uses the browser's Web Crypto API: PBKDF2 (600,000 rounds) for key derivation and AES‑256‑GCM for encryption.
- A wrong password fails to decrypt rather than being compared, and any tampering with the stored data is caught by the GCM authentication tag.
- In cloud-sync mode the server only ever stores ciphertext, login passwords are hashed with bcrypt, and login and signup are rate‑limited to slow down brute‑force and credential‑stuffing attempts.
- Standard hardening headers are set (Content‑Security‑Policy, X‑Frame‑Options, nosniff, Referrer‑Policy, Permissions‑Policy).
- Found a security issue? Please report it privately — see [`SECURITY.md`](./SECURITY.md). Do not open a public issue for vulnerabilities.
- This is a personal project, not an audited product. If you plan to trust it with important secrets, review the code first and keep your own backups.

### Roadmap

- Move the Content‑Security‑Policy to a nonce-based script policy (drop `'unsafe-inline'` for scripts).
- Optionally migrate key derivation to Argon2id via a WebAssembly module.

## License

MIT. Adjust as you see fit before publishing.
