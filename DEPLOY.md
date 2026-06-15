# Running and deploying Konci

This guide goes from a fresh copy of the code to a deployed app. Konci runs in two modes: local-only (no setup, works offline) and cloud sync (optional, needs a database). Start with local-only; add cloud later if you want it.

## Requirements

- Node.js 18 or newer.

## 1. Install and run locally

From the project folder:

```bash
npm install
npm run dev
```

Open http://localhost:3000. You can create a vault and use everything in local-only mode right away — no database or account needed. Your vault is stored, encrypted, in the browser.

To check types or build for production:

```bash
npm run typecheck
npm run build
```

## 2. Optional: turn on cloud sync (Neon)

Cloud sync keeps your encrypted vault in sync across devices. You only need this if you want more than one device. Skip this whole section for local-only use.

### 2a. Create a database

1. Sign up at https://console.neon.tech and create a project (the default Postgres version is fine).
2. Open Connect / Connection Details and copy the connection string. Prefer the **Direct connection**; it should end with `?sslmode=require`. It looks like:
   ```
   postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### 2b. Create the local env file

Copy `.env.example` to a file named **`.env`** (use `.env`, not `.env.local` — the Prisma CLI only reads `.env`). It is already in `.gitignore`, so it never gets committed.

Fill in three values:

```
DATABASE_URL="postgresql://...your Neon string...?sslmode=require"
NEXTAUTH_SECRET="a long random string"
NEXTAUTH_URL="http://localhost:3000"
```

Generate the secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2c. Create the tables

```bash
npm run db:migrate
```

When prompted for a migration name, type `init`. This creates the `User` and `Vault` tables in your Neon database and writes a migration file under `prisma/migrations/`.

### 2d. Run it

```bash
npm run dev
```

Open the app, click **Sync** in the top bar, create an account, and cloud sync turns on. The account password only identifies your data; you still unlock the vault with your master password.

## 3. Push to GitHub

Nothing secret should be committed. The `.gitignore` already excludes `node_modules`, `.env`, `.env.local`, `.env.*.local`, `*.konci` backup files, and `CLAUDE.md`. Your actual vault is never in the repo — it lives in the browser or your Neon database.

If a stale `.git` folder exists from an earlier attempt, delete it first:

```powershell
Remove-Item -Recurse -Force .git
```

Then:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/konci.git
git push -u origin main
```

Tip: keep the repository **private** while it is just for you. You can switch it to public later in Settings → General → Change visibility — no need for a second repo.

## 4. Deploy on Vercel

1. Go to vercel.com and sign in with GitHub.
2. Add New → Project, and pick the `konci` repository.
3. Vercel detects Next.js automatically. The build command is `prisma generate && next build` (already set in `package.json`).
4. If you use cloud sync, open Settings → Environment Variables and add:
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — the same random secret
   - `NEXTAUTH_URL` — your deployed URL, e.g. `https://konci-xxx.vercel.app`

   For local-only use, you can skip these.
5. Deploy.

For personal use you can point both local and production at the same Neon database, so the tables you created in step 2c are already there — no extra migration needed. If you use a separate production database, run `npm run db:deploy` against it once.

## 5. Updating later

Make changes, confirm the build is clean, then push:

```bash
npm run build
git add .
git commit -m "Describe your change"
git push
```

Vercel redeploys automatically. If you change `prisma/schema.prisma`, run `npm run db:migrate` locally and `npm run db:deploy` against production.

## Troubleshooting

- **`Environment variable not found: DATABASE_URL` during migration** — Prisma reads `.env` by default. If your database URL is in `.env.local`, copy it to `.env` before running migrations.
- **`Module not found: 'next-auth'`** — run `npm install` again to make sure all dependencies are installed.
- **Blank page in dev with a CSP `unsafe-eval` error** — restart the dev server after pulling config changes. Next.js dev mode needs `unsafe-eval`, and it is already allowed only in development.
- **Migration fails on a pooled Neon connection** — use Neon's Direct connection string for `DATABASE_URL`, preferably ending with `?sslmode=require`.
