# Phase 0–1 Foundation + Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a hosted-ready Next.js + Postgres personal CRM where you can track companies, people, and opportunities, import contacts via CSV, and see due follow-ups on Home.

**Architecture:** Next.js App Router app with Prisma/Postgres as the single source of truth. Server Actions + route handlers for mutations. Simple password session auth. Dashboard shells for Home, Companies, People, Opportunities, and Agent (Agent UI shell only in Phase 0–1; tools in Phase 2).

**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL, Tailwind CSS, zod, iron-session (or jose cookie session)

## Global Constraints

- Single-user personal tool only — no multi-tenant auth
- Interview prep is out of scope
- Agent drafts only later — no auto-send
- LinkedIn/Indeed/X are not core crawlers in Phase 0–1
- Schema must already include fields needed by later monitors (`careersUrl`, `lastCheckedAt`, `Alert` model)
- Match design spec: `docs/superpowers/specs/2026-07-26-job-sourcing-system-design.md`

---

## File structure

```
app/
  layout.tsx
  page.tsx                          # redirect to /home
  login/page.tsx
  (dashboard)/
    layout.tsx                      # nav shell
    home/page.tsx
    companies/page.tsx
    companies/[id]/page.tsx
    companies/new/page.tsx
    people/page.tsx
    people/[id]/page.tsx
    people/new/page.tsx
    people/import/page.tsx
    opportunities/page.tsx
    opportunities/[id]/page.tsx
    opportunities/new/page.tsx
    agent/page.tsx                  # shell placeholder
    profile/page.tsx
  api/auth/login/route.ts
  api/auth/logout/route.ts
  api/cron/follow-ups/route.ts      # stub for later; Phase 1 computes follow-ups in query
lib/
  prisma.ts
  auth.ts
  validators.ts
  csv.ts
  attention.ts                      # Home “needs action” + “what’s new” queries
components/
  nav.tsx
  company-form.tsx
  person-form.tsx
  opportunity-form.tsx
  interaction-form.tsx
  alert-list.tsx
  data-table.tsx
prisma/
  schema.prisma
  seed.ts
docker-compose.yml                  # local Postgres
.env.example
README.md
```

---

### Task 1: Scaffold Next.js app + Postgres

**Files:**
- Create: `package.json`, `app/`, `prisma/schema.prisma`, `docker-compose.yml`, `.env.example`, `README.md`
- Create: `lib/prisma.ts`

**Interfaces:**
- Produces: Prisma client singleton `prisma` from `lib/prisma.ts`
- Produces: `DATABASE_URL`, `AUTH_PASSWORD`, `SESSION_SECRET` in `.env.example`

- [ ] **Step 1: Create Next.js TypeScript app with Tailwind in repo root**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --turbopack
```

If the directory is non-empty (docs present), scaffold manually or create in temp and merge.

- [ ] **Step 2: Add dependencies**

```bash
npm install @prisma/client zod iron-session papaparse
npm install -D prisma @types/papaparse tsx
npx prisma init
```

- [ ] **Step 3: Add `docker-compose.yml` for Postgres**

```yaml
services:
  db:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: jobs
      POSTGRES_PASSWORD: jobs
      POSTGRES_DB: job_sourcing
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

- [ ] **Step 4: Write `.env.example` and local `.env`**

```
DATABASE_URL="postgresql://jobs:jobs@localhost:5432/job_sourcing"
AUTH_PASSWORD="change-me"
SESSION_SECRET="generate-a-long-random-string"
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with Prisma and Postgres"
```

---

### Task 2: Prisma schema + seed profile

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Modify: `package.json` (prisma seed config)

**Interfaces:**
- Produces: models `Company`, `Person`, `Opportunity`, `Interaction`, `Alert`, `Profile`
- Produces: `npm run db:seed` populates default Profile

- [ ] **Step 1: Define enums and models in `prisma/schema.prisma`**

Include at minimum:

```prisma
enum CompanySource { seeded network suggested }
enum CompanyStatus { watching active parked }
enum RelationshipStrength { know warm cold }
enum OpportunityType { job_post intro_path upcoming_hire other }
enum OpportunityStatus { new interested applied closed }
enum InteractionChannel { email linkedin call other }
enum InteractionDirection { outbound inbound note }
enum AlertType { new_role follow_up_due funding network_move monitor_error }

model Company {
  id              String   @id @default(cuid())
  name            String
  stage           String?
  sectors         String[] @default([])
  careersUrl      String?
  websiteUrl      String?
  source          CompanySource @default(seeded)
  status          CompanyStatus @default(watching)
  whyInteresting  String?
  notes           String?
  lastCheckedAt   DateTime?
  monitorError    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  people          Person[]
  opportunities   Opportunity[]
  alerts          Alert[]
}

model Person {
  id                   String   @id @default(cuid())
  name                 String
  email                String?
  linkedinUrl          String?
  currentTitle         String?
  companyId            String?
  company              Company? @relation(fields: [companyId], references: [id])
  relationshipStrength RelationshipStrength @default(cold)
  hooks                String?
  researchNotes        String?
  lastContactAt        DateTime?
  nextFollowUpAt       DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  interactions         Interaction[]
  warmOpportunities    Opportunity[] @relation("WarmPerson")
  alerts               Alert[]
}

model Opportunity {
  id                String   @id @default(cuid())
  title             String
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id])
  url               String?
  source            String?
  type              OpportunityType @default(job_post)
  status            OpportunityStatus @default(new)
  fitScore          Int?
  whyFit            String?
  talkingPoints     String?
  questionsToAsk    String?
  compensationNotes String?
  warmPersonId      String?
  warmPerson        Person?  @relation("WarmPerson", fields: [warmPersonId], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  interactions      Interaction[]
  alerts            Alert[]
}

model Interaction {
  id             String   @id @default(cuid())
  personId       String?
  person         Person?  @relation(fields: [personId], references: [id])
  opportunityId  String?
  opportunity    Opportunity? @relation(fields: [opportunityId], references: [id])
  channel        InteractionChannel @default(email)
  direction      InteractionDirection @default(note)
  summary        String
  body           String?
  occurredAt     DateTime @default(now())
  nextStep       String?
  createdAt      DateTime @default(now())
}

model Alert {
  id             String    @id @default(cuid())
  type           AlertType
  title          String
  body           String?
  companyId      String?
  company        Company?  @relation(fields: [companyId], references: [id])
  personId       String?
  person         Person?   @relation(fields: [personId], references: [id])
  opportunityId  String?
  opportunity    Opportunity? @relation(fields: [opportunityId], references: [id])
  createdAt      DateTime  @default(now())
  dismissedAt    DateTime?
}

model Profile {
  id                    String   @id @default(cuid())
  backgroundSummary     String
  targetSectors         String[] @default([])
  thesis                String?
  targetCompMin         Int?
  targetCompMax         Int?
  voiceSamples          String?
  updatedAt             DateTime @updatedAt
}
```

- [ ] **Step 2: Migrate and seed**

```bash
docker compose up -d
npx prisma migrate dev --name init
```

Seed default profile with Stanford ME / D1 / VC background placeholders.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add Prisma schema and profile seed"
```

---

### Task 3: Auth gate

**Files:**
- Create: `lib/auth.ts`, `app/login/page.tsx`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `middleware.ts`

**Interfaces:**
- Produces: `getSession()`, `requireSession()`, login/logout routes
- Consumes: `AUTH_PASSWORD`, `SESSION_SECRET`

- [ ] **Step 1: Implement sealed cookie session with iron-session**
- [ ] **Step 2: Protect all `/(dashboard)` routes via middleware; allow `/login`**
- [ ] **Step 3: Manual test — wrong password rejected; correct password reaches `/home`**
- [ ] **Step 4: Commit** — `feat: add single-user password auth`

---

### Task 4: Dashboard shell + navigation

**Files:**
- Create: `app/(dashboard)/layout.tsx`, `components/nav.tsx`
- Create: shell pages for home, companies, people, opportunities, agent, profile

- [ ] **Step 1: Nav links — Home, Companies, People, Opportunities, Agent, Profile**
- [ ] **Step 2: Each page renders a titled empty state**
- [ ] **Step 3: Commit** — `feat: add dashboard navigation shells`

---

### Task 5: Companies CRUD

**Files:**
- Create: company list/detail/new pages, `components/company-form.tsx`, server actions in `app/(dashboard)/companies/actions.ts`

**Interfaces:**
- Produces: `createCompany`, `updateCompany`, `listCompanies`

- [ ] **Step 1: List page with status/source filters**
- [ ] **Step 2: Create + edit form (zod validated)**
- [ ] **Step 3: Detail page shows linked people/opportunities counts and monitor fields**
- [ ] **Step 4: Commit** — `feat: companies CRUD`

---

### Task 6: People CRUD + interactions

**Files:**
- Create: people pages, `components/person-form.tsx`, `components/interaction-form.tsx`, `app/(dashboard)/people/actions.ts`

- [ ] **Step 1: List with relationship + company filters**
- [ ] **Step 2: Create/edit person including `nextFollowUpAt`**
- [ ] **Step 3: Detail timeline — log interactions; updating interaction can set `lastContactAt` / `nextFollowUpAt`**
- [ ] **Step 4: Commit** — `feat: people CRM and interactions`

---

### Task 7: Opportunities CRUD

**Files:**
- Create: opportunities pages, form, actions

- [ ] **Step 1: Pipeline list grouped or filterable by status**
- [ ] **Step 2: Create/edit with company + optional warm person**
- [ ] **Step 3: Detail shows fit fields (editable even before agent)**
- [ ] **Step 4: Commit** — `feat: opportunities pipeline CRUD`

---

### Task 8: CSV import for people

**Files:**
- Create: `lib/csv.ts`, `app/(dashboard)/people/import/page.tsx`, import action

**Interfaces:**
- Produces: `parsePeopleCsv(text) -> ParsedPerson[]`
- Expected columns: `name,email,linkedinUrl,currentTitle,companyName,relationshipStrength,hooks`

- [ ] **Step 1: Parse CSV with papaparse; zod-validate rows**
- [ ] **Step 2: Upsert company by name if `companyName` provided; create people**
- [ ] **Step 3: Show import results (created/skipped/errors)**
- [ ] **Step 4: Commit** — `feat: CSV import for network contacts`

---

### Task 9: Home attention views + profile editor

**Files:**
- Create: `lib/attention.ts`, implement `app/(dashboard)/home/page.tsx`, `app/(dashboard)/profile/page.tsx`

**Interfaces:**
- Produces: `getAttentionFeed()` → `{ needsAction, whatsNew }`

`needsAction` includes:
- People with `nextFollowUpAt <= now`
- Opportunities with status `interested` and no interaction in 14 days (or missing next step)

`whatsNew` includes:
- Alerts where `dismissedAt` is null, newest first
- Ability to dismiss alert

- [ ] **Step 1: Implement attention queries**
- [ ] **Step 2: Home UI with two stacks and deep links**
- [ ] **Step 3: Profile edit form for agent context fields**
- [ ] **Step 4: Commit** — `feat: home attention feed and profile editor`

---

### Task 10: README + verify Phase 0–1

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document setup (docker, env, migrate, seed, dev)**
- [ ] **Step 2: Smoke test checklist — login, CRUD each entity, CSV import, Home shows follow-up**
- [ ] **Step 3: Commit** — `docs: README for Phase 0–1 tracker`

---

## Phase 2–4 preview (not in this plan’s tasks)

- **Phase 2:** Agent panel tools + LLM wiring  
- **Phase 3:** Careers URL monitors → Opportunity + Alert  
- **Phase 4:** Network signals + `suggest_startups` approval flow  

Schema fields for monitors are already present after Task 2 so Phase 3 does not require a redesign.
