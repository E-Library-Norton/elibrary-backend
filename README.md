# Norton E-Library — Backend Operations and Database Guide

> **Last updated:** August 2, 2026
> **Runtime:** Node.js/Express, Sequelize, PostgreSQL, Cloudflare R2, Socket.IO, and Google Gemini

The backend exposes the `/api` REST API for authentication/RBAC, book metadata and media, reviews, feedback, push subscriptions, analytics, AI recommendations, and per-user reading progress, bookmarks, and notes.

The database currently contains 25 application tables. The latest migration is `20260728000001-create-reading-features.js`.

## Quick start

> **Current clean-install blocker:** the backend imports Express 5, but
> `package.json` does not currently declare `express`. Existing local
> `node_modules` can hide this problem. Add Express to the manifest/lockfile
> before treating a clean `npm install` as reproducible.

```bash
cd elibrary-backend
npm install
cp .env.example .env.local
npm run db:migrate
npm run db:seed:permissions
npm run dev
```

The API listens on `http://localhost:5005` by default. `GET /` returns a health
message and `GET /api` returns API name/version information.

Before starting, replace every placeholder in `.env.local`. The code also uses
`FORGOT_PASSWORD_SECRET`, `DB_SSL`, and the three `VAPID_*` variables even though
the current example template does not list all of them. The complete code-level
variable list is maintained in [PRD.md](PRD.md#12-environment-and-deployment).

### Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start with Nodemon |
| `npm start` | Start the API with Node |
| `npm run db:migrate:status` | Show migration state |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:migrate:undo` | Undo the latest migration |
| `npm run db:seed:permissions` | Upsert the current permission names |
| `npm run db:backup` | Back up the Docker database |
| `npm run db:backup:local` | Back up the configured local database |
| `npm run health` | Run service health checks |
| `npm run monitor:report` | Generate a monitoring report |

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Managed Database Retention and Backups](#2-managed-database-retention-and-backups)
3. [Create a Backup — Do This Regularly](#3-create-a-backup--do-this-regularly)
4. [Scenario: Database Lost or Replaced → Restore to New DB](#4-scenario-database-lost-or-replaced--restore-to-new-db)
5. [Check a Backup File Before Restoring](#5-check-a-backup-file-before-restoring)
6. [Restore to Other Targets](#6-restore-to-other-targets)
7. [Run Migrations After Restore](#7-run-migrations-after-restore)
8. [Verify Data After Restore](#8-verify-data-after-restore)
9. [Automate Backups (Cron)](#9-automate-backups-cron)
10. [Common Errors and Fixes](#10-common-errors-and-fixes)
11. [Security Note](#11-security-note)

---

## 1) Prerequisites

```bash
# Go to the backend folder
cd elibrary-backend
npm install

# Make sure PostgreSQL client tools are installed
psql --version        # should print psql (PostgreSQL) 15.x or higher
pg_dump --version

# Install on macOS (if missing)
brew install libpq
brew link --force libpq
```

---

## 2) Managed Database Retention and Backups

| Fact | Detail |
|---|---|
| **Retention** | Depends on the active database provider and plan; verify it in the provider dashboard |
| **Provider backups** | Do not assume they are included—confirm the schedule and retention for the active plan |
| **After deletion** | The database URL stops working and provider-side recovery may be unavailable |
| **Your local `.sql.gz` backup** | ✅ Permanently yours — valid forever, restores to any PostgreSQL DB |
| **Can you restore old backup to new DB?** | ✅ **Yes** — follow Section 4 below |

> Keep encrypted backup copies outside this repository and periodically test that they restore successfully.

---

## 3) Create a Backup — Do This Regularly

### From your live Render database

```bash
export OLD_DATABASE_URL='postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require'
./scripts/backup-db.sh --url "$OLD_DATABASE_URL"
```

Backup is saved to `backups/elibrary_YYYY-MM-DD_HHMMSS.sql.gz`.

> 💡 Copy this file somewhere safe (Google Drive, USB, etc.) — your entire database is in it.

### From Docker (local dev)

```bash
npm run db:backup
```

### From local PostgreSQL

```bash
npm run db:backup:local
```

---

## 4) Scenario: Database Lost or Replaced → Restore to New DB

This is the complete step-by-step for restoring a saved backup after the old
database was deleted, expired, corrupted, or replaced.

### Step 1 — Create a new PostgreSQL database

**Option A — New Render PostgreSQL database**
1. Go to [render.com](https://render.com) → **New** → **PostgreSQL**
2. Give it a name (e.g. `elibrary-db-v2`)
3. Wait ~1 minute for provisioning
4. Click the new DB → copy the **External Database URL**

**Option B — Supabase PostgreSQL** *(availability and retention depend on the active plan)*
1. Go to [supabase.com](https://supabase.com) → New project
2. Settings → Database → copy the **Connection String (URI)** with `?sslmode=require`

**Option C — Local Docker** *(for development)*
```bash
docker compose up -d db
export NEW_DATABASE_URL='postgresql://elibrary:password@localhost:5432/nu_elibrary_db'
```

---

### Step 2 — Set your new DB URL

```bash
export NEW_DATABASE_URL='postgresql://USER:PASSWORD@NEW_HOST/NEW_DB_NAME?sslmode=require'
```

---

### Step 3 — Find your backup file

```bash
ls -lahtr backups/
# Example output:
# -rw-r--r--  elibrary_2026-04-15_020000.sql.gz   4.2M
# -rw-r--r--  elibrary_2026-05-01_020000.sql.gz   4.5M  ← use this (most recent)
```

> Use the **most recent** backup for the freshest data.

---

### Step 4 — Verify the backup is valid

```bash
# Must print SQL content — not empty
gunzip -c backups/elibrary_2026-05-01_020000.sql.gz | head -20

# Must show table names
gunzip -c backups/elibrary_2026-05-01_020000.sql.gz | grep '^CREATE TABLE'
```

If both commands show output → backup is good.  
If empty → find a different backup file (do **not** restore an empty file).

---

### Step 5 — Restore to the new database

```bash
./scripts/restore-db.sh --url "$NEW_DATABASE_URL" backups/elibrary_2026-05-01_020000.sql.gz
```

Type `yes` when prompted. The script will:
- Drop all existing tables in the new DB
- Recreate schema and import all data from the backup

Expected output:
```
[2026-05-13 10:00:00] Restoring from: backups/elibrary_2026-05-01_020000.sql.gz
[2026-05-13 10:00:00] Target: Render/Remote URL
[2026-05-13 10:00:12] ✅ Restore completed successfully!
```

---

### Step 6 — Run migrations (fills in any missing new tables/columns)

```bash
DATABASE_URL="$NEW_DATABASE_URL" DB_SSL=true npm run db:migrate
```

This is required when restoring an older backup — any migrations added after the backup date are applied on top of the restored data without touching existing records.

---

### Step 7 — Update your backend environment variables

Update `.env` / Render service environment:

```
DATABASE_URL=postgresql://USER:PASSWORD@NEW_HOST/NEW_DB_NAME?sslmode=require
```

If deployed on Render:
1. Go to your **Web Service** → **Environment**
2. Update `DATABASE_URL` to the new value
3. Click **Save Changes** → service restarts automatically

---

### Step 8 — Verify data in the new database

```bash
psql "$NEW_DATABASE_URL" -c "SELECT count(*) AS tables FROM pg_tables WHERE schemaname='public';"
psql "$NEW_DATABASE_URL" -c "SELECT count(*) FROM users;"
psql "$NEW_DATABASE_URL" -c "SELECT count(*) FROM books;"
psql "$NEW_DATABASE_URL" -c "SELECT count(*) FROM \"SequelizeMeta\";"
```

Expected: 25 application tables when every current migration is applied, non-zero `users`/`books` for a populated backup, and a `SequelizeMeta` row for every migration.

---

## 5) Check a Backup File Before Restoring

```bash
# List all backups
ls -lahtr backups/

# Preview content (first 20 lines of SQL)
gunzip -c backups/<file>.sql.gz | head -20

# Check all table names inside
gunzip -c backups/<file>.sql.gz | grep '^CREATE TABLE'

# Count total lines (rough size check)
gunzip -c backups/<file>.sql.gz | wc -l
```

**Do NOT restore** if the file is empty or contains no `CREATE TABLE` lines.

---

## 6) Restore to Other Targets

### Restore to Docker (local dev)

```bash
./scripts/restore-db.sh --docker backups/<file>.sql.gz
```

### Restore to local PostgreSQL

```bash
./scripts/restore-db.sh backups/<file>.sql.gz
```

### Restore to any remote URL

```bash
./scripts/restore-db.sh --url "postgresql://USER:PASS@HOST/DB?sslmode=require" backups/<file>.sql.gz
```

---

## 7) Run Migrations After Restore

Always run after any restore:

```bash
DATABASE_URL="$DATABASE_URL" DB_SSL=true npm run db:migrate
```

**Why?** The backup captures the schema at the time it was made. If migration files were added after that date, those columns/tables won't be in the backup. Running `db:migrate` brings the schema fully up to date without removing any existing data.

---

## 8) Verify Data After Restore

```bash
psql "$DATABASE_URL" -c "SELECT count(*) AS public_tables FROM pg_tables WHERE schemaname='public';"
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"SequelizeMeta\";"
psql "$DATABASE_URL" -c "SELECT count(*) FROM users;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM books;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM categories;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM downloads;"
```

---

## 9) Automate Backups (Cron)

Run a backup every day at 2:00 AM automatically:

```bash
# Open crontab
crontab -e

# Add this line (adjust path to your project)
0 2 * * * cd /path/to/E-Library/elibrary-backend && ./scripts/backup-db.sh --url "postgresql://USER:PASS@HOST/DB?sslmode=require" >> logs/backup.log 2>&1
```

Backups older than 7 days are deleted automatically. To keep 30 days instead:

```bash
./scripts/backup-db.sh --url "$DATABASE_URL" --retention 30
```

---

## 10) Common Errors and Fixes

### `password authentication failed`
- Copy the **External Database URL** directly from Render — do not retype it.
- Make sure `?sslmode=require` is at the end of the URL.
- If credentials were recently rotated, update `DATABASE_URL`.

### `connection refused` / `could not connect to server`
- New Render DB may still be starting — wait 1–2 minutes after creation.
- Make sure you are using the **External** URL (Internal only works inside Render's network).

### `relation "..." does not exist`
- Backup restored but migrations have not run yet:
  ```bash
  DATABASE_URL="$DATABASE_URL" DB_SSL=true npm run db:migrate
  ```

### `ERROR: role "elibrary" does not exist`
- The new DB has a different owner name — harmless warning. If it causes issues:
  ```bash
  gunzip -c backups/<file>.sql.gz | psql --no-owner "$DATABASE_URL"
  ```

### Backup restored but row counts are 0
- You restored an empty or corrupted file. Run Section 5 checks first, then restore a valid backup.

---

## 11) Security Note

> ⚠️ If your `DATABASE_URL` (with password) was ever shared in a chat, screenshot, Git commit, or terminal history — **rotate the password immediately**:
> 1. Render Dashboard → your DB → **Reset Password**
> 2. Copy the new External Database URL
> 3. Update `DATABASE_URL` in your backend `.env` and Render service environment
> 4. Redeploy the backend service
