# Host + Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add company CSV import, wire Prisma migrate into Vercel builds, and document Neon + Vercel deploy so the app can run always-on with a seeded watchlist.

**Architecture:** Extend existing `lib/csv.ts` + people-import UX for companies. Upsert by case-insensitive name into Postgres. Change npm `build` to `prisma generate && prisma migrate deploy && next build`. README gets a deploy runbook; user creates Neon/Vercel and pastes env + CSV.

**Tech Stack:** Next.js 15, Prisma, papaparse, zod, Vitest, Vercel Cron, Neon Postgres

## Global Constraints

- Single-user personal tool only — no multi-tenant auth
- Do not auto-run `db:seed` on deploy (would clobber Profile)
- Company import sets `source = seeded` and `approvedAt = now()` on create
- Match design: `docs/superpowers/specs/2026-07-26-host-and-seed-design.md`
- Keep people CSV import unchanged

---

## File structure

```
lib/csv.ts                              # add parseCompaniesCsv
tests/unit.test.ts                      # company CSV tests
app/(dashboard)/companies/actions.ts    # importCompaniesCsv
app/(dashboard)/companies/import/page.tsx
app/(dashboard)/companies/page.tsx      # link to import
package.json                            # build script with migrate deploy
README.md                               # Deploy (Vercel + Neon) runbook
.env.example                            # note Neon SSL / required prod vars
```

---

### Task 1: Company CSV parser (TDD)

**Files:**
- Modify: `lib/csv.ts`
- Modify: `tests/unit.test.ts`

**Interfaces:**
- Produces: `parseCompaniesCsv(text: string) -> { rows: ParsedCompanyRow[]; errors: string[] }`
- `ParsedCompanyRow`: `{ name, stage?, sectors: string[], careersUrl?, websiteUrl?, whyInteresting?, notes?, status: "watching"|"active"|"parked" }`

- [ ] **Step 1: Write failing tests**

```ts
describe("parseCompaniesCsv", () => {
  it("parses aliases, splits sectors, defaults status", () => {
    const csv = `company,stage,sector,website,careers,why,status
Acme Robotics,Series A,"hard-tech, AI",https://acme.com,https://acme.com/jobs,Cool mech,active
`;
    const result = parseCompaniesCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("Acme Robotics");
    expect(result.rows[0].sectors).toEqual(["hard-tech", "AI"]);
    expect(result.rows[0].websiteUrl).toBe("https://acme.com");
    expect(result.rows[0].careersUrl).toBe("https://acme.com/jobs");
    expect(result.rows[0].status).toBe("active");
  });

  it("errors on missing name and invalid status", () => {
    const csv = `name,status
,watching
Beta,nope`;
    const result = parseCompaniesCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL** (`parseCompaniesCsv` missing)

Run: `npm test`

- [ ] **Step 3: Implement `parseCompaniesCsv` in `lib/csv.ts`**

Alias map per design spec. Split sectors on commas; trim; drop empties. Default status `watching`. Invalid status → row error.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit** — `feat: parse company CSV with column aliases`

---

### Task 2: Import UI + server action

**Files:**
- Create: `app/(dashboard)/companies/import/page.tsx`
- Modify: `app/(dashboard)/companies/actions.ts`
- Modify: `app/(dashboard)/companies/page.tsx`

**Interfaces:**
- Produces: `importCompaniesCsv(formData) -> { created: number; updated: number; skippedErrors: string[] }`

- [ ] **Step 1: Add `importCompaniesCsv`**

Behavior:
- Read `file` from FormData
- Parse with `parseCompaniesCsv`
- For each row: find by `name` insensitive; update fields or create with `source: "seeded"`, `approvedAt: new Date()`
- On update: refresh mapped fields; do not change `source` if already set
- `revalidatePath("/companies")`

- [ ] **Step 2: Create import page** mirroring people import (file input + created/updated/errors)

- [ ] **Step 3: Add “Import CSV” link** next to “Add company” on list page

- [ ] **Step 4: Manual smoke** (local): import a 2-row CSV; confirm list

- [ ] **Step 5: Commit** — `feat: company CSV import UI`

---

### Task 3: Migrate-on-build + env docs

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Change build script**

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

- [ ] **Step 2: Update `.env.example`** with comments for Neon `DATABASE_URL` (ssl), strong prod secrets, optional `OPENAI_API_KEY`

- [ ] **Step 3: README — Deploy (Vercel + Neon) section** covering Neon → Vercel env → deploy → login → Profile → company import → cron curl verify. Note: do not auto-seed Profile on deploy.

- [ ] **Step 4: Commit** — `chore: migrate on Vercel build and deploy runbook`

---

### Task 4: Verify + handoff for Neon/Vercel

- [ ] **Step 1: `npm test` and `npm run build`** (build needs local `DATABASE_URL`; docker Postgres OK)

- [ ] **Step 2: Tell user checklist** — create Neon, create Vercel project from GitHub, paste env, deploy, paste company CSV, fill Profile, verify cron

---

## Deploy handoff (user actions — not code)

1. Neon project → copy connection string into Vercel `DATABASE_URL`
2. Vercel ← GitHub `bhagle04/job-sourcing`
3. Env: `DATABASE_URL`, `AUTH_PASSWORD`, `SESSION_SECRET`, `CRON_SECRET`, optional `OPENAI_API_KEY`
4. Deploy; open URL; login; `/profile`; `/companies/import`
5. `curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/monitors`
