# Job Sourcing

Personal dashboard + agent for tracking companies, Stanford-network people, and opportunities — with careers monitoring and discovery loops.

## Stack

- Next.js 15 (App Router) + TypeScript
- Postgres + Prisma
- iron-session (single-user password auth)
- Optional OpenAI for agent tools (`OPENAI_API_KEY`)
- Cron endpoint for unattended monitors

## Quick start

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install deps
npm install

# 3. Env
cp .env.example .env
# edit AUTH_PASSWORD / SESSION_SECRET as needed

# 4. Migrate + seed
npx prisma migrate dev --name init
npm run db:seed

# 5. Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `AUTH_PASSWORD`.

## App surfaces

| Route | Purpose |
|---|---|
| `/home` | Needs action + what’s new |
| `/companies` | Watchlist + careers check |
| `/people` | Network CRM + CSV import |
| `/opportunities` | Role pipeline |
| `/discovery` | Network signals + startup suggestions |
| `/agent` | Research / draft / score / triage tools |
| `/profile` | Voice + thesis for the agent |

## Unattended monitors

Call with your cron secret:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/monitors
```

This:
1. Polls watchlist `careersUrl`s for new roles
2. Creates `follow_up_due` alerts for overdue people

On Vercel, add a cron hitting `/api/cron/monitors` daily.

## CSV import columns

`name,email,linkedinUrl,currentTitle,companyName,relationshipStrength,hooks`

## Tests

```bash
npm test
```

## Phases implemented

- **0–1** Foundation, auth, CRUD, CSV, Home attention
- **2** Agent tools (works offline without API key; better with OpenAI)
- **3** Careers monitors + cron
- **4** Network signals + suggest-startups approval flow
