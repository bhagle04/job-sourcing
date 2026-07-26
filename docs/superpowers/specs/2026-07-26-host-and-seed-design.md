# Host + Seed — Design Spec

**Date:** 2026-07-26  
**Status:** Approved (pending written review)  
**Parent:** `docs/superpowers/specs/2026-07-26-job-sourcing-system-design.md`

## 1. Goal

Get the personal job-sourcing app **hosted and seeded** so Home is reachable from anywhere and careers / follow-up monitors run without the laptop open.

Primary value: turn the Phase 0–4 codebase into a daily-use always-on system with a real (partial) company watchlist.

## 2. Scope

### In scope

1. **Host on Vercel** with **Neon Postgres** as `DATABASE_URL`
2. **Production env** — `DATABASE_URL`, `AUTH_PASSWORD`, `SESSION_SECRET`, `CRON_SECRET`, optional `OPENAI_API_KEY`
3. **Prisma migrate on deploy** so schema lands on Neon without a local laptop step
4. **Company CSV import** — upsert watchlist companies from the user’s spreadsheet export
5. **Profile seed/edit** — fill Profile via existing `/profile` so agent tools have context
6. **Deploy + seed runbook** in README (Neon → Vercel env → migrate → import → verify cron)

### Out of scope

- Careers parser hardening / real Greenhouse–Ashby API clients
- Real funding/news discovery APIs (placeholders remain)
- People / Stanford network CSV (unless added later)
- Custom domain
- Interview prep, auto-send, multi-user auth

### User split

| Who | Does |
|---|---|
| User | Create Neon project; create/link Vercel project; set env vars; export/paste company CSV; fill Profile |
| Agent | Company CSV parser + import UI; build/migrate wiring; README runbook; help verify prod login + cron |

## 3. Success criteria

1. Production URL (`*.vercel.app`) loads and password login works
2. Vercel cron (or manual `curl` with `CRON_SECRET`) can hit `/api/cron/monitors` successfully
3. Imported companies appear on `/companies` in production (`source = seeded`)
4. Profile has background / thesis / sectors filled enough for agent drafts and scoring

## 4. Architecture

```
Company CSV ──► /companies/import ──┐
Profile UI ─────────────────────────┼──► Neon Postgres
Vercel Cron ──► /api/cron/monitors ─┘
                     ▲
              Next.js on Vercel
```

### Deploy sequence

1. Create Neon project → copy pooled or direct `DATABASE_URL` (Prisma-compatible)
2. Import GitHub repo `bhagle04/job-sourcing` into Vercel
3. Set env vars on the Vercel project (Production)
4. Build runs Prisma generate + `prisma migrate deploy` + `next build`
5. Open prod URL → log in with prod `AUTH_PASSWORD`
6. Edit `/profile`
7. Import companies at `/companies/import`
8. Confirm cron: existing `vercel.json` schedule `0 14 * * *` → `/api/cron/monitors` with Bearer `CRON_SECRET`

### Auth

Same single-user sealed cookie session. Production must use a strong `AUTH_PASSWORD` and `SESSION_SECRET` (≥32 chars). Do not reuse local `change-me` in production.

### Cron

No new job runner. Reuse `app/api/cron/monitors/route.ts` and `vercel.json`. Document that Vercel Cron sends the request; route must validate `Authorization: Bearer $CRON_SECRET`.

## 5. Company CSV import

Mirror the people-import UX pattern.

### Files (planned)

- `lib/csv.ts` — add `parseCompaniesCsv(text)`
- `app/(dashboard)/companies/import/page.tsx` — paste or upload textarea + results
- `app/(dashboard)/companies/actions.ts` — `importCompaniesCsv` server action
- Link from `/companies` list page

### Column mapping (case-insensitive; aliases allowed)

| CSV column (aliases) | Model field |
|---|---|
| `name`, `company` | `name` (**required**) |
| `stage` | `stage` |
| `sectors`, `sector` | `sectors[]` (split on commas) |
| `careersUrl`, `careers` | `careersUrl` |
| `websiteUrl`, `website`, `url` | `websiteUrl` |
| `whyInteresting`, `why` | `whyInteresting` |
| `notes` | `notes` |
| `status` | `watching` \| `active` \| `parked` (default `watching`) |

### Behavior

- Upsert by case-insensitive `name`
- Set `source = seeded` on create; on update preserve existing `source` unless still empty/default
- Set `approvedAt = now()` on create so seeded companies are immediately watchable (not stuck in suggestion approval)
- Skip blank names; collect per-row errors
- Return summary: created / updated / errors (same shape spirit as people import)

### Tests

Unit tests for `parseCompaniesCsv`: aliases, sector splitting, invalid status, missing name.

## 6. Build / migrate wiring

Change `package.json` build (or Vercel Install/Build commands) so production deploy applies migrations:

```bash
prisma generate && prisma migrate deploy && next build
```

`prisma` must be available at build time (already in `devDependencies`; Vercel installs them by default). Document that `DATABASE_URL` must be present at build for `migrate deploy`.

Do **not** run `db:seed` automatically on every deploy (would clobber Profile). Profile is edited in UI; optional local `npm run db:seed` remains for empty local DBs only.

## 7. README runbook

Add a **Deploy (Vercel + Neon)** section covering:

1. Neon create + connection string
2. Vercel import from GitHub
3. Env var table (required vs optional)
4. First deploy / migrate
5. Login, Profile, company CSV import
6. Cron verification `curl`
7. Note: keep `.env` local; never commit secrets

## 8. Non-goals / later

- Pointing local `.env` at Neon (optional; not required)
- People CSV seeding
- Funding API discovery
- Monitor scrape quality

## 9. Risks

| Risk | Mitigation |
|---|---|
| Neon connection string needs SSL / pooled URL for serverless | Document Neon “Prisma” or pooled + `sslmode=require` |
| Migrate fails at build without DB | Fail loud; README lists `DATABASE_URL` as required |
| Spreadsheet headers don’t match | Alias map + clear import error rows |
| Empty watchlist after deploy | Import step is explicit in success criteria |

## 10. Relationship to parent design

Implements parent principles: dashboard as source of truth, ship trust before heavier automation, always-on workers not laptop-bound. Does not advance Phase 2–4 feature depth; it operationalizes what already shipped.
