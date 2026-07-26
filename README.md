# Job Sourcing

Personal dashboard + agent for tracking companies, Stanford-network people, and opportunities — with careers monitoring and discovery loops.

## Stack

- Next.js 15 (App Router) + TypeScript
- Postgres + Prisma
- iron-session (single-user password auth)
- Optional OpenAI for agent tools (`OPENAI_API_KEY`)
- Cron endpoint for unattended monitors

## Quick start (local)

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install deps
npm install

# 3. Env
cp .env.example .env
# edit AUTH_PASSWORD / SESSION_SECRET as needed

# 4. Migrate + seed
npx prisma migrate dev
npm run db:seed

# 5. Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `AUTH_PASSWORD`.

## Deploy (Vercel + Neon)

Goal: always-on app + daily careers/follow-up monitors with your laptop closed.

### 1. Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the **Prisma / pooled** connection string (include `sslmode=require`)
3. You will paste this as `DATABASE_URL` on Vercel

### 2. Vercel

1. Import the GitHub repo (`bhagle04/job-sourcing`) into Vercel
2. Set **Production** environment variables:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Neon connection string |
| `AUTH_PASSWORD` | yes | Strong password (not `change-me`) |
| `SESSION_SECRET` | yes | ≥32 random chars |
| `CRON_SECRET` | yes | Shared secret for cron |
| `OPENAI_API_KEY` | no | Better agent drafts |

3. Deploy. The build script runs `prisma generate && prisma migrate deploy && next build`, so schema is applied on Neon automatically.
4. Do **not** rely on `db:seed` in production — it would overwrite Profile. Use `/profile` in the UI instead.

`vercel.json` already schedules a daily hit to `/api/cron/monitors` (`0 14 * * *` UTC).

### 3. First-run seed

1. Open `https://<your-app>.vercel.app` and sign in
2. Fill **Profile** (`/profile`) — background, thesis, sectors, voice samples
3. Import companies: **Companies → Import CSV** (`/companies/import`)
4. Optional: import people later at `/people/import`

### 4. Verify cron

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>.vercel.app/api/cron/monitors
```

Expect a JSON success payload. Check Home for new alerts after companies with `careersUrl` are on the watchlist.

Keep `.env` local only — never commit secrets.

## App surfaces

| Route | Purpose |
|---|---|
| `/home` | Needs action + what’s new |
| `/companies` | Watchlist + careers check |
| `/companies/import` | Company CSV upsert |
| `/people` | Network CRM + CSV import |
| `/opportunities` | Role pipeline |
| `/discovery` | Network signals + startup suggestions |
| `/agent` | Research / draft / score / triage tools |
| `/profile` | Voice + thesis for the agent |

## Unattended monitors (local)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/monitors
```

This:
1. Polls watchlist `careersUrl`s for new roles
2. Creates `follow_up_due` alerts for overdue people

## CSV import columns

**People:** `name,email,linkedinUrl,currentTitle,companyName,relationshipStrength,hooks`

**Companies:** `name` (or `company`), `stage`, `sectors`/`sector`, `websiteUrl`/`website`/`url`, `careersUrl`/`careers`, `whyInteresting`/`why`, `notes`, `status` (`watching`\|`active`\|`parked`). Upserts by case-insensitive name; new rows get `source=seeded`.

## Tests

```bash
npm test
```

## Phases implemented

- **0–1** Foundation, auth, CRUD, CSV, Home attention
- **2** Agent tools (works offline without API key; better with OpenAI)
- **3** Careers monitors + cron
- **4** Network signals + suggest-startups approval flow
- **Host + seed** Vercel/Neon runbook + company CSV import
