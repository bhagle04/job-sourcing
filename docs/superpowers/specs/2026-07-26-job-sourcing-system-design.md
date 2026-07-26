# Job Sourcing System — Design Spec

**Date:** 2026-07-26  
**Status:** Approved  
**Owner:** Personal tool (single user) through graduation

## 1. Goal

A personal system that keeps you on top of **startup and target-company opportunities** and **important people** (especially Stanford network), with a dashboard as the source of truth and agents/monitors doing research, drafts, and unattended checks.

Primary value: turn networking and opportunity tracking from a manual, high-friction process into a systematic loop — without sounding generic, and without relying on noisy job boards alone.

## 2. Scope

### In scope

1. **Outreach / relationship CRM** — companies, people, research hooks, outreach drafts, conversation history, follow-up timing
2. **Opportunity research & matching** — roles and non-public paths, fit notes, talking points, watchlist monitoring

### Out of scope

- Interview & narrative prep system (explicitly removed)
- Auto-send on LinkedIn or email
- Aggressive LinkedIn / Indeed / X crawling as a core path
- Multi-user productization / billing

### User

Single user (you). Auth is personal gatekeeping only.

## 3. Product principles

1. **Dashboard is the source of truth** — agent and monitors write into the same records you browse
2. **People and companies are equal** — a Stanford contact can surface a startup before it was on the watchlist
3. **Ship trust before automation** — manual + CSV first; design for unattended monitoring from day one
4. **You approve and you send** — agent drafts; suggestions require approval; no silent outreach
5. **Startups over name brands** — seeded watchlist + network-led discovery, not FAANG-only

## 4. Architecture

**Approach:** Unified Next.js + Postgres app, hosted so monitors run with the laptop closed.

| Layer | Responsibility |
|---|---|
| Next.js dashboard | Home, Companies, People, Opportunities, Agent panel |
| Postgres | Canonical store for all entities |
| Agent | Tool-using assistant that reads/writes the DB |
| Scheduled workers | Careers polls, follow-up alerts, later network/funding signals |

```
Dashboard ──┐
Agent ──────┼──► Postgres
Workers ────┘       ▲
                    │
            Careers / network / funding sources
```

**Deployment:** Develop locally; deploy early. Always-on workers must not depend on the laptop being open.

## 5. Data model

### Company

Watchlist unit (startup, VC firm, hard-tech, AI/defense, etc.)

- `name`, `stage`, `sectors[]`, `careersUrl`, `websiteUrl`
- `source`: `seeded` | `network` | `suggested`
- `status`: `watching` | `active` | `parked`
- `whyInteresting`, `notes`
- `lastCheckedAt`, `monitorError` (for careers monitor health)

### Person

Network + outreach targets

- `name`, `email`, `linkedinUrl`, `currentTitle`
- `companyId` (optional FK)
- `relationshipStrength`: `know` | `warm` | `cold`
- `hooks` (Stanford, athletics, VC, engineering, shared background)
- `researchNotes`
- `lastContactAt`, `nextFollowUpAt`
- Stanford / network flags as structured or freeform hooks

### Opportunity

Roles or non-public paths

- `title`, `companyId`, `url`, `source`
- `type`: `job_post` | `intro_path` | `upcoming_hire` | `other`
- `status`: `new` | `interested` | `applied` | `closed`
- `fitScore`, `whyFit`, `talkingPoints`, `questionsToAsk`
- `compensationNotes`
- `warmPersonId` (optional)

### Interaction

Conversation history

- `personId` and/or `opportunityId`
- `channel` (email, linkedin, call, other)
- `direction` (outbound, inbound, note)
- `summary`, `body` (optional draft text)
- `occurredAt`, `nextStep`

### Alert

Attention inbox

- `type`: `new_role` | `follow_up_due` | `funding` | `network_move` | `monitor_error`
- Entity refs (`companyId`, `personId`, `opportunityId`)
- `title`, `body`, `createdAt`, `dismissedAt`

### Profile

Agent/context config (singleton for this personal app)

- Background summary (Stanford ME, D1 athletics, early-stage VC)
- Target sectors / thesis
- Target compensation range
- Voice samples (past emails that sound like you)

## 6. Dashboard views

1. **Home / Attention** — two stacks: needs action (follow-ups, stuck opportunities) and what’s new (undismissed alerts)
2. **Companies** — watchlist table + detail (people, opportunities, alerts, monitor health)
3. **People** — filterable CRM + detail (hooks, timeline, drafts)
4. **Opportunities** — pipeline list + fit notes + warm path
5. **Agent panel** — research, draft, score, triage; writes back to same records

Open Home and know the next actions in under a minute.

## 7. Discovery strategy

**Hybrid:** seeded watchlist + continuous suggestions, with Stanford network as a primary avenue.

| Phase | Network behavior |
|---|---|
| First | People you already know + opportunity-through-people signals |
| Later | Broader Stanford alumni search if A+C is insufficient |

Startup discovery flow: network person → company suggested/approved → watchlist → careers monitor + outreach path.

## 8. Ingestion & monitors

### Phase A+B (first)

1. Manual entry + URL paste
2. CSV import for contacts

### Phase C (unattended) — priority order

1. **Careers watchlist** — Greenhouse / Ashby / Lever / public careers URLs; detect new/removed jobs
2. **Network signals** — job changes / hiring notes tied to people
3. **Funding / news** — raises and launches matching thesis → suggested companies (approval required)
4. **Secondary** — LinkedIn / Indeed / X as paste-assisted or optional later; not core crawlers

### Monitor rules

- Dedupe by canonical URL or title+company
- Store `careersUrl` + `lastCheckedAt` per company
- Follow-up due alerts derived from `Person.nextFollowUpAt`
- Surface monitor failures on company detail / Home

## 9. Agent capabilities

### Tools

| Tool | Behavior |
|---|---|
| `upsert_company` / `upsert_person` / `upsert_opportunity` | Create/update from description or URL |
| `log_interaction` | Record outreach/replies; set follow-up |
| `research_person` / `research_company` | Hooks and notes saved on the record |
| `draft_outreach` | Cold/warm draft in your voice; you send |
| `score_opportunity` | Fit notes, talking points, questions |
| `weekly_triage` | Rank due follow-ups + new alerts |
| `suggest_startups` | Propose companies; require approve |

### Guardrails

- No auto-send
- Approve watchlist adds from suggestions
- Every write visible on the dashboard
- Cite sources/links on research when possible

## 10. Phased delivery

| Phase | Deliverable | Outcome |
|---|---|---|
| **0 Foundation** | Schema, auth, hosted shells, profile seed | App runs |
| **1 Tracker** | CRUD + CSV import + Home follow-ups | Single source of truth |
| **2 Agent** | Research, drafts, fit scoring, weekly triage | Faster research/messaging |
| **3 Careers monitors** | Always-on watchlist job detection | What’s new without input |
| **4 Network + discovery** | Network signals + startup suggestions | Pipeline grows via network |

## 11. Success criteria (fall)

- Open Home → know the next ~5 actions
- Watchlist surfaces new roles without manually checking boards
- Warm Stanford paths linked to companies/opportunities
- Outreach drafts feel like you; follow-ups don’t fall through

## 12. Tech stack (locked)

- **App:** Next.js (App Router) + TypeScript
- **DB:** Postgres via Prisma
- **Auth:** Simple single-user gate (password / session cookie)
- **Jobs:** Scheduled workers (Inngest, Trigger.dev, or equivalent cron worker)
- **LLM:** API-backed agent with tool calling for Phase 2+

## 13. Non-goals for v1 polish

- Fancy analytics
- Social feed clones
- Multi-tenant roles
- Mobile-native apps
