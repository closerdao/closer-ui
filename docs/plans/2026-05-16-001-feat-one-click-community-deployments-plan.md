---
name: one-click-community-deployments
description: Alignment document for the Pillar 1 work — self-service deployment of new Closer villages. Captures current architecture for sign-off, defines goals, prerequisites, non-goals, and the medium-grain technical decisions before track-level breakdown.
status: draft-for-alignment
created: 2026-05-16
type: feat
target_repos: closer-ui, closer-api, plus new infra repo(s) TBD
origin_documents:
  - "Closer v4 Scaling Roadmap (Sam Delesque) — Pillar 1"
  - "Closer platform features — scalability assessment"
  - closer-ui/STRATEGY.md (Track 1 "One-click deployments") via PR #887 branch ui-improvements-27
  - closer-api PR #290 "Add land projects + projectapis"
  - closer-api PR #330 "V4: Add federation, passports, land-projects, project-apis"
---

# feat: One-Click Community Deployments

> **Status of this document.** This is an **alignment doc**, not an implementation plan. The goal is to lock in (a) a shared understanding of the current architecture, (b) the goals and non-goals of this work, (c) the medium-grain technical decisions, and (d) the open questions the team needs to answer together. A follow-up plan will break the work into engineer-level units once direction is signed off.

---

## 1. Summary

The Closer v4 Scaling Roadmap (Pillar 1) commits to removing the biggest growth bottleneck: **each new village currently requires ~half a day of developer time and ~€1,000 to deploy.**

This document proposes the medium-grain technical direction for that work: a self-serve signup at `closer.earth` that auto-provisions a new village's domain (either a `<slug>.closer.earth` subdomain or a custom domain such as `earthbound.eco`), database, application instances, and payment rails — replacing the manual runbook the central team executes today. The current architecture (shared MongoDB server with per-village databases, per-village droplet hosting `closer-api`, per-village Vercel app per `closer-ui/apps/<village>/`, per-village Stripe Connect account, ~68 env vars per village) is documented in Section 3 so the team can sign off on the baseline before discussing change.

The concrete sign-off test for v1 is: **could we redeploy Earthbound as a customer onto the new system, with its existing `earthbound.eco` custom domain, without bespoke central-team work?** If yes, v1 is done.

Two deployment tiers are described in the roadmap (shared-DB at €50/mo, self-hosted at €100+/mo); this doc proposes shipping the shared-DB tier first (because it most closely matches production today) and treating the self-hosted tier as a documented follow-up. The team should validate or override that call in Section 9.

This doc deliberately omits per-engineer track breakdown, implementation units, and file-level changes. Once Sections 3–8 are signed off, a separate detailed plan will produce those.

---

## 2. Glossary

A handful of terms have specific meaning in this doc; quick reference:

- **Village** — a single Closer community / land project. Synonymous with "tenant", "community", or "instance" in earlier drafts. Aligned with the roadmap's preferred term.
- **Hub** — a federation coordinator (per Token Model doc: "any community can become a hub"). `api.closer.earth` is the first hub today.
- **`ProjectApi`** — a record (introduced by closer-api PRs #290 + #330) in the central registry that maps a village to its running instance (API URL, app URL, status, server tier).
- **`LandProject`** — the curated, geolocated catalog record for a village. Distinct from `ProjectApi`: a village can exist as a catalog entry before it is deployed.
- **Per-village vs shared resource** — "per-village" means each village has its own instance of the resource (own droplet, own Stripe account, own DB). "Shared" means one resource serves many villages (shared MongoDB server, shared `api.closer.earth` hub).

---

## 3. Current Architecture

> **What we believe is true about how Closer deploys today.** This section exists for sign-off — please flag anything that is inaccurate before reading further. The proposals in Sections 5–8 assume this baseline.

### 3.1 Live villages and traction

- **6 villages live**: TDF (Traditional Dream Factory, Portugal), MOOS, LIOS, FOZ, EARTHBOUND, PER-AUSET. Confirmed by the Scaling Roadmap.
- **280+ TDF token holders**, **3,000+ guests hosted over 5 years**, **€1.25M+ raised through TDF token sales**.
- **~€1,000 and ~half a day of developer time** to deploy each new village today.
- **100+ platform features** already in production (full list in "Closer platform features" doc).

### 3.2 Repos and code layout

- **`closerdao/closer-ui`** — Turborepo monorepo. One Next.js app per village in `apps/<village>/`: `apps/closer` (official/generic), `apps/tdf`, `apps/earthbound`, `apps/moos`, `apps/lios`, `apps/foz`, `apps/per-auset`. All apps consume a shared `packages/closer` package containing ~95% of components, pages, hooks, contexts. Per-village customization happens via env vars, per-app `public/images/` assets, and occasional per-app pages.
- **`closerdao/closer-api`** — Single Node/Koa codebase. One deployment per village. Deploy script is 3 lines: `rsync` to a hardcoded `crocodile` host + `pm2 restart`. No tenancy primitives in models (no `tenantId`/`communityId` field). Background jobs include per-village folders (`jobs/tdf/`, `jobs/foz/`, `jobs/moos/`).
- **Federation work in flight**: closer-api PR #290 adds `LandProject` + `ProjectApi` registry models. PR #330 (a superset) adds federated identity (`Passport`), Lamport quantum-safe signing for instance authentication, DigitalOcean DNS provisioning helper, and instance self-registration. Both PRs are open and currently unmerged on `develop`.

### 3.3 Runtime topology per village

| Resource | Per-village or shared? | Notes |
|---|---|---|
| Frontend (Next.js `closer-ui`) | **Per-village** | One Vercel project per village; built from `apps/<village>/`; ~68 `NEXT_PUBLIC_*` env vars baked in at build, including 17 feature flags |
| API (`closer-api`) | **Per-village** | One DigitalOcean droplet per village; runs `closer-api` via PM2 |
| Database (MongoDB) | **Hybrid** — shared server, per-village database | Single shared MongoDB server with a separate logical DB per village (e.g., `closer_tdf`, `closer_moos`). Isolation is by Mongo user permissions, not separate clusters |
| Stripe Connect account | **Per-village** | One Connect account per village; ~14-step manual onboarding documented in `closer-ui/MIGRATE_PLATFORM_STRIPE_ACCOUNT.md` |
| Firebase project (auth) | **Per-village** | One Firebase project per village; manual GCP console setup |
| Email (Mailgun) | **Per-village** | One Mailgun subdomain per village; manual DKIM/SPF setup |
| DNS (`<village>.closer.earth`) | **Per-village record on shared zone** | Manual record creation in the registrar |
| Background jobs | **Per-village** | Village-specific code in `closer-api/jobs/<village>/init.js`, `jobs/tdf/`, etc. |
| Federation hub | **Shared** | `api.closer.earth` is the first hub (per Token Model doc); future hubs supported by PR #330 architecture |
| CDN / Spaces storage | **Shared** | Single DigitalOcean Spaces bucket; per-village paths |

### 3.4 What blocks scaling today (from the "Closer platform features" doc)

The scalability assessment in the supplementary doc categorizes each feature by what it depends on. The recurring blockers, in roughly descending order of how often they show up:

1. **Property-specific FE code or env vars** — page layouts, brand colors, fonts, logo, token bookings, token sale, site copy. Each village needs a build-time deploy to change.
2. **Hardcoded backend code or env vars** — emails (defaults baked in), payment settings (some hardcoded variables), separate utility/food price (logic is TDF-specific).
3. **Manual / no-code steps** — Stripe account connection, refunds, deployment itself.
4. **Partial config-driven** — most features are *partly* config-driven and *partly* hardcoded. The transition is in flight but incomplete.
5. **Site copy and i18n** — partly in JSON files, partly hardcoded text fragments throughout `packages/closer`. Adding a language requires code changes.
6. **Database and backend** — the doc explicitly flags "shared database can cut setup/cloud/maintenance costs" and same for "shared app". The team has already considered tier-based deployment.

### 3.5 What the "manual half-day" actually consists of

Reconstructed from `closer-api/SETUP.md`, `closer-ui/MIGRATE_PLATFORM_STRIPE_ACCOUNT.md`, `closer-api/deploy.fish`, `closer-api/jobs/tdf/init.js`, and the `apps/<village>/.env.sample` files:

1. Create new Vercel project; link to `closer-ui` repo; populate ~68 env vars by hand.
2. Copy `apps/tdf/` → `apps/<new-village>/` template; adjust branding assets, env vars, custom pages.
3. Provision a DigitalOcean droplet; SSH in; install Node 22, MongoDB connection, PM2.
4. Add a new database on the shared MongoDB server with a scoped user.
5. Populate ~80 API env vars on the droplet.
6. Create a Stripe Connect account; complete the 14-step manual process in `MIGRATE_PLATFORM_STRIPE_ACCOUNT.md`; configure webhook endpoint.
7. Create a Firebase project; generate service account key; populate Firebase config.
8. Create a Mailgun subdomain; generate API keys; configure DKIM/SPF in DNS.
9. Generate web push VAPID keys; populate Twilio if needed; populate web3 keys.
10. Create DNS A and CNAME records for `<village>.closer.earth` and `api.<village>.closer.earth`.
11. Hand-write a `jobs/<village>/init.js` seed script (or copy + edit from TDF); run it to populate default config, roles, founder admin user, example listings.
12. Configure Stripe webhook endpoint to point at the new API host.
13. Verify SSL, test booking flow, test token flow if applicable, verify email delivery.
14. Hand off credentials to the village founder.

### 3.6 What the central team owns vs the village team

- **Central team owns:** the entire deployment process above, the federation hub (`api.closer.earth`), shared Mongo, the CDN, the deploy pipeline (such as it is), all per-village secrets.
- **Village team owns:** content (via existing admin UI in `packages/closer/pages/dashboard/admin/`), bookings/listings/events configuration, member management, and operations.

**The gap this work addresses:** every village currently waits on the central team for the first 12 of the 14 steps above. That is the bottleneck.

---

## 4. Problem Frame

The Scaling Roadmap is direct: *"Each new village requires ~half a day of developer time and ~€1,000 to deploy. … This is the #1 bottleneck — eliminating it is the gating factor for all growth."*

Three downstream effects compound from this:

1. **Growth is capped by central-team capacity.** With 6 villages today and an ambition measured in tens-to-hundreds, the runbook does not scale even at one new village per week.
2. **Village teams cannot iterate without escalating.** Most platform changes for a village (branding, emails, payment settings) require developer time on the central team rather than the village team self-serving via the admin UI. This is partly a deployment problem and partly a configurability problem (Pillar 2) — they reinforce each other.
3. **Network effects stall.** Pillar 3 (passport, cross-village portability) and Pillar 4 (AI village operations) only deliver compounding value once there are enough villages. Pillar 1 is the gate.

Closer's strategic framing — "communities own the ground they live on and govern the intelligence that mediates it" (STRATEGY.md) and "any community can become a hub" (Token Model) — also makes hand-built deployments off-brand: a federation operationalized by hand-deploy is, at scale, just a central platform.

---

## 5. Goals

### 5.1 Primary goals

1. **Self-serve onboarding live.** A founding steward can complete signup at `closer.earth` and reach a working village instance within ≤30 minutes wall-clock without central-team intervention on the happy path.
2. **Zero per-village code changes for new villages.** Adding a new village requires only configuration records and orchestrated provisioning. No new `apps/<village>/` folder, no new `jobs/<village>/` directory.
3. **Custom domains supported in v1.** A village can be deployed onto either a `<slug>.closer.earth` subdomain or its own custom apex/subdomain (e.g., `earthbound.eco`). The concrete success test: **we could redeploy Earthbound as a customer onto the new system with its existing `earthbound.eco` domain, without bespoke central-team work.** Migration of other existing villages remains out of scope, but the system must be capable of receiving them.
4. **Capacity to grow village count by an order of magnitude** without degrading central-team capacity or shared-infrastructure performance. No hard count attached to v1; the gating constraint is that growth is no longer rate-limited by manual deploy work.
5. **First deploy tier shipped: shared-DB / per-village app.** Matches current production topology and the roadmap's €50/mo tier. The €100+/mo self-hosted tier is a documented follow-up (see KTD3).
6. **Existing villages continue to work unchanged.** TDF, MOOS, LIOS, FOZ, EARTHBOUND, PER-AUSET keep their current deployments. Migration is out of scope for this work, with the Earthbound-as-customer test (goal 3) being the closest the work gets to migration — it is a redeploy onto the new system, not an in-place migration of the existing instance.

### 5.2 Quality bar

- Provisioning is **observable** — the founder sees real-time progress at every phase.
- Provisioning is **resumable and rollback-safe** — a failure leaves no orphan infrastructure and a clear error path for the central team.
- The federation primitives from PRs #290 and #330 are used **as designed** — this work consumes them rather than reinventing the registry, identity, or DNS layers.
- Secrets management is **acceptable for v1 even if not ideal long-term** — explicit follow-up for a proper vault.

---

## 6. Prerequisites

### 6.1 Code prerequisites

- **closer-api PR #290 merged.** Provides the `LandProject` + `ProjectApi` registry models, geospatial search, and the pull-based daily stats sync job that this work consumes.
- **closer-api PR #330 merged, with its known issues resolved first.** Provides `Passport`, Lamport-signed instance identity, DigitalOcean DNS provisioning helper, and instance self-registration. The Copilot review surfaced 8 issues that need fixing before production federation traffic depends on this code:
  1. HMAC signature implementation missing the secret (forgery risk).
  2. Lamport key index persisted in `/tmp` (lost on restart, risks key reuse).
  3. Hardcoded DigitalOcean Spaces credentials in `closer-api/config.js`.
  4. `fetch` timeout silently ignored (hung requests not aborted).
  5. `/api/stats` endpoint missing auth (information leakage).
  6. Variable assignment bug in `closer-api/utils/passportBenefits.js` (benefits always empty).
  7. Inconsistent input sanitization on federation payloads (NoSQL injection risk).
  8. Timezone default changed without migration for existing users.
- **closer-api payment-correctness PRs #355, #360, #362, #363, #365 merged.** These fix Stripe intent binding, dedup token claims, and stay-slug ambiguity. Not strict-blocking for the *code* of this plan, but blocking for inviting real founders onto new villages (the bugs would scale with village count).

### 6.2 Operational prerequisites

- **Inventory of the shared MongoDB server's current spec, headroom, and connection-count ceiling.** Capacity at 25/50/100 villages must be understood before opening signup.
- **Admin credentials for the shared MongoDB server stored in a secret store the orchestrator can access** (not on engineer laptops).
- **DigitalOcean account API token with droplet-creation rights and a confirmed quota** that comfortably exceeds the 20-village target.
- **Vercel team account API token** with project-creation rights.
- **Stripe platform account with Connect enabled** (already exists per `MIGRATE_PLATFORM_STRIPE_ACCOUNT.md`).
- **Mailgun account** with capacity for many sending subdomains.

### 6.3 Team

The working group for this work:

- **Avi** — primary owner of the one-click deployment work end-to-end (control plane, orchestration, integration automation).
- **Vlad** — primary owner of `closer-ui` (including the runtime multi-tenancy refactor implied by KTD4).
- **Sam** — CTO; technical direction and decisions on KTDs and Open Questions.
- **Paul** — Operations and technical support; signoff on the operational prerequisites in 6.2, owner of the runbook for failure modes that surface to humans.

**Alignment on this doc** is the gate to per-engineer track breakdown. Once Sections 3–8 are signed off, the follow-up plan will assign units to the people above.

---

## 7. Non-Goals

The following are explicitly **out of scope for v1 of Pillar 1**. Several are downstream priorities in their own right; calling them out here keeps the scope honest.

1. **Migrating the existing 6 villages off their per-app deployments.** They keep working as-is. Migration is a separate follow-up. The Earthbound-as-customer test in goal 3 is a *redeploy* onto the new system, not an in-place migration of the existing Earthbound instance.
2. **The €100+/mo self-hosted tier.** Architecturally allowed for, but v1 ships the shared-DB tier only. See KTD3.
3. **Pillar 2 (Platform Configurability) work.** The WYSIWYG page builder, theme system, and admin-driven feature flag management are their own pillar. This plan assumes the *current* configurability and only addresses the deployment bottleneck. The two pillars reinforce each other but can be sequenced.
4. **Pillar 3 (Integrated Passport) extensions.** PR #330's existing passport primitives are consumed; no new federation features are built here.
5. **Pillar 4 (AI Village Operations).** Out of scope for this work.
6. **Self-serve UI for granular branding** (logo upload, theme color picker, copy editing) during signup. v1 uses sensible defaults; the village admin UI handles post-provision customization.
7. **A proper secrets vault** (HashiCorp Vault, Doppler, AWS Secrets Manager). v1 uses cloud-init-injected encrypted env vars; vault is a documented follow-up.
8. **Replacing PM2 with systemd, Kubernetes, or other orchestration on the droplet.** v1 matches `closer-api/deploy.fish` conventions.
9. **Cross-village analytics, billing, or multi-instance moderation tools** beyond what PR #290's daily `sync-project-stats.js` already provides.
10. **Replacing the shared MongoDB server with Atlas or per-village dedicated Mongo.** Documented follow-up; trigger is capacity-driven (KTD3 and Open Question 4).
11. **Replacing per-village Firebase projects with shared-project + tenant IDs.** Out of scope for v1; manual Firebase remains the documented gap. See Open Question 5.

---

## 8. Key Technical Decisions

> Medium-grain technical direction. Each KTD is a call this doc is asking the team to ratify or push back on. Implementation detail (which files, which functions, which test cases) is intentionally omitted — it belongs in the follow-up plan.

### KTD1 — Topology: per-village app instances on shared infrastructure (matches today)

**Decision.** Each new village gets its own droplet, its own Vercel project, its own Stripe Connect account, its own Firebase project, its own Mailgun subdomain, and its own logical database on the **shared** MongoDB server. This matches the current production topology and the roadmap's €50/mo shared-DB tier.

**Why.** Three reasons. First, it's what production already does — building automation around the known pattern is lower-risk than refactoring to a new one. Second, it preserves the per-village sovereignty that STRATEGY.md commits to at the application layer (own API process, own payments rails, own domain) while keeping storage cost down. Third, it leaves the door open for a follow-up "self-hosted" tier where heavy villages get dedicated Mongo without re-architecting v1.

**Trade-off.** "Federated isolation" is the right label for the API/UI/payments/domain layers, but the shared Mongo is a single backbone — a misconfigured user grant or a server-level outage affects all villages on the shared tier. The plan accepts this trade-off for v1; revisiting (Atlas or per-village dedicated Mongo) is in the follow-up scope.

### KTD2 — Build on closer-api PRs #290 and #330 as merged prerequisites

**Decision.** Treat `ProjectApi`, `LandProject`, Lamport signing, instance self-registration, and the DigitalOcean DNS helper from PRs #290 and #330 as the foundation. This work consumes those primitives; it does not reinvent them.

**Why.** Together those PRs already deliver ~60% of the federation registry and identity layer needed for self-serve provisioning. Building a parallel registry would be ~15k LOC of duplicate work and would conflict at merge. The roadmap's "architecture locked" milestone implicitly assumes these PRs are the architecture.

**Trade-off.** This plan is blocked on PR #290 and #330 merging (and on the 8 Copilot-flagged issues in #330 being resolved first). Mitigation: Track 0 in the follow-up plan is dedicated to landing #330 cleanly before anything depends on it.

### KTD3 — Ship the shared-DB tier first; self-hosted tier is a documented follow-up

**Decision.** v1 ships only the shared-DB (€50/mo) tier described in the Scaling Roadmap. The self-hosted (€100+/mo) tier — where a village gets a dedicated Mongo cluster (likely Atlas or a dedicated VM) — is a follow-up. The architecture leaves room for it but does not build it.

**Why.** Shipping both tiers in v1 doubles the surface area of the work without doubling the value: the bottleneck is the *first* tier of automation, not the choice between tiers. Most early adopter villages will be small enough that shared-DB is the right default; villages that outgrow it are a good problem to have. Building the self-hosted tier first would also require provisioning a new database vendor account, which the team has not done yet.

**Trade-off.** Villages with strong sovereignty requirements (e.g., regulatory pressure to hold their own data) cannot self-serve in v1 — they need to wait for the follow-up or stay on the manual path. Acceptable for v1.

### KTD4 — Runtime multi-tenancy in the FE (single deployable, host-resolved tenant)

**Decision.** A new `apps/federation-host` Next.js app (or refactor of `apps/closer`) becomes the single deployable artifact serving all new village subdomains plus the `closer.earth` apex domain. It reads the incoming `Host` header, resolves the village via a new `GET /v4/tenants/by-host` endpoint, and renders. Per-village branding (logo, theme JSON, copy overrides) loads from the CDN at runtime, keyed by village slug. **Existing per-village apps (`apps/tdf`, `apps/moos`, etc.) continue to work unchanged.**

**Why.** The current "one app folder per village" pattern is fundamentally incompatible with self-serve — every new village would need a code change, a new build, and a new Vercel project. Runtime resolution decouples village count from build count. The "Closer platform features" scalability assessment explicitly flags this ("Private app deployments — shared app can cut setup, cloud and maintenance costs"). The existing apps stay on their existing path so this work does not block on a risky migration.

**Trade-off.** A single shared FE deploy means a bad release affects all new villages at once. Mitigation: the new app starts with one village, then onboards more gradually. Old apps remain insulated.

### KTD5 — Control plane lives as new routes in `closer-api`, not a separate service

**Decision.** Add a new `routes/control-plane.js` route group to `closer-api` (running on the central `api.closer.earth` instance, which is itself one of the federated nodes). The orchestration worker runs as a `closer-api` background job. No new service.

**Why.** Adding a new service doubles the ops burden, requires its own deploy pipeline (which doesn't exist for `closer-api` either), and forces the team to learn a second codebase before they've automated the first. Putting the control plane in `closer-api` keeps the auth, model, and ops surface a single team already maintains.

**Trade-off.** The central API instance becomes a slightly larger blast radius. Mitigation: the control plane endpoints are well-isolated; the orchestrator state machine is a separate job; nothing the control plane does is in the per-request hot path for normal API traffic.

### KTD6 — Stripe Connect Express (not Standard)

**Decision.** Programmatically create a Stripe Connect Express account per village; email the founder a Stripe-hosted onboarding link; listen for the `account.updated` webhook to write the Connect account ID back to `ProjectApi.technical`.

**Why.** Express accounts let Stripe handle KYC and dashboard hosting, removing most of the 14 steps in `MIGRATE_PLATFORM_STRIPE_ACCOUNT.md`. The trade-off (less direct customization) is acceptable for the simplest path to "villages can take payments."

**Trade-off.** Villages that outgrow Express can be migrated to Standard later; the migration runbook already exists.

### KTD7 — Replace per-village `jobs/<village>/init.js` with a generic seed script

**Decision.** A single `scripts/seed-new-tenant.js` in `closer-api` is parameterized by the signup form (slug, founder email, language, currency, feature-flag preset). It creates default roles, founder admin user, default config, default email templates, and one example listing. The existing per-village init scripts are preserved for the existing villages; they are not refactored.

**Why.** The current per-village pattern (`jobs/tdf/init.js`, `jobs/foz/`, `jobs/moos/`) is fundamentally incompatible with self-serve. A generic script keeps the seeding logic in one place and removes the need for a developer to write village-specific code per signup.

**Trade-off.** Some villages may want non-default seed data (extra roles, custom listings). v1 handles this via the existing admin UI after provision; richer onboarding presets are a follow-up.

### KTD8 — Secrets via DigitalOcean App Platform encrypted env vars in v1; vault deferred

**Decision.** Per-village secrets (Mongo URI, JWT secret, Stripe Connect ID, Mailgun key, etc.) are injected at droplet provision time via DigitalOcean's encrypted env-var mechanism (or cloud-init `write_files`). No central plaintext storage; the central `ProjectApi.technical` field stores IDs/references, not raw secrets. A proper vault is deferred.

**Why.** Adding a vault adds a third infra dependency, a new failure mode, and an ops surface for a team that does not currently run one. v1 needs to ship, not be a vault project. Encrypted env vars on DO are a known, supported pattern.

**Trade-off.** Secrets rotation is harder without a vault (each rotation is a manual re-deploy step). v1 documents the rotation runbook; the follow-up replaces it with a vault when the village count justifies it.

### KTD9 — Custom domains supported in v1, via PR #330's existing verification flow

**Decision.** A village can be deployed onto either a `<slug>.closer.earth` subdomain (the default) or its own custom apex/subdomain (e.g., `earthbound.eco`). The DNS verification primitive in PR #330 (`closer-api/utils/digitalocean-dns.js` + custom-domain TXT verification routes) is the foundation; this work surfaces it in the signup and admin flows and wires it through to Vercel + the per-village `closer-api` instance.

**Why.** The Earthbound-as-customer goal (5.1 #3) is the explicit sign-off test; supporting it requires that v1 can attach `earthbound.eco` to a fresh deploy without bespoke central-team work. Custom domains are also the simpler half of two related features (custom domain at signup vs custom branding) and the federation primitives already exist for them. Deferring would push the Earthbound test out of reach.

**Concrete shape.** Signup form asks "use `<slug>.closer.earth` or bring your own domain?" → if custom, the founder is shown the CNAME and TXT records to configure at their registrar → the orchestrator polls PR #330's verification endpoint → once verified, the domain is attached to the village's Vercel project and SSL is provisioned (Let's Encrypt via Vercel). Both the `<slug>.closer.earth` record and the custom domain remain configured; the custom domain becomes the canonical URL once verified.

**Trade-off.** Custom domain signup adds a wait-state in provisioning (DNS propagation can be minutes to hours; the founder may close the tab and come back later). The orchestrator state machine must handle "waiting on founder to configure DNS" as a first-class phase rather than a failure. The status dashboard must show clear "what you need to do next" steps when the system is blocked on the founder.

---

## 9. Open Questions

> Questions the team needs to answer together before the detailed plan is written. **Please add to this list** — it is expected to grow during review.

| # | Question | Why it matters | Who decides |
|---|----------|----------------|-------------|
| Q1 | Is the topology in KTD1 the right call, or should v1 default to a "fully shared" tier (multiple villages sharing one droplet + shared Mongo)? | A fully-shared tier would cost ~€10–20/mo per village instead of ~€50, but loses per-village API process isolation. The roadmap mentions €50/mo as the shared-DB minimum, which implies per-village droplet. | Sam + Avi |
| Q2 | Should v1 also ship the self-hosted (€100+/mo) tier, or strictly defer as a follow-up? | Some early-adopter villages may have sovereignty requirements that only the self-hosted tier satisfies. Shipping both in v1 doubles the work. | Sam |
| Q3 | Vercel hosting strategy — wildcard `*.closer.earth` on one Vercel project, or one Vercel project per village created via API? | Wildcard requires Vercel Enterprise (or per-subdomain attachment via API on Pro). Per-project hits Vercel domain limits at ~100 villages. The decision is also coupled with KTD9: custom domains (e.g., `earthbound.eco`) sit outside the wildcard and must be attached individually regardless of which path we pick for subdomains. | Avi + Paul |
| Q4 | Shared MongoDB server capacity — what is the current spec, connection-count headroom, and at what village count do we need to upsize or shard? | Capacity is currently unknown. Without baseline, we cannot set the alert thresholds or know when to trigger the follow-up self-hosted tier. | Vlad + Paul |
| Q5 | Firebase strategy — per-village project (manual, status quo) or shared project with Firebase tenant IDs (requires research + refactor)? | Per-village Firebase is the only currently-manual step left if KTD6 + KTD7 land. Shared Firebase eliminates that step but is a bigger change. | Avi |
| Q6 | DigitalOcean droplet region — village-chosen at signup, or fixed (e.g., `fra1`)? | Village UX vs. ops simplicity. Default `fra1` (EU) is reasonable; some villages may want US/Asia. | Sam + Avi |
| Q7 | How do we backfill the 6 existing villages into the new `ProjectApi` registry so they appear in the federation directory? | Without backfill, the existing villages are invisible to the federation hub. Backfill is small but should be sequenced. | Vlad + Sam |
| Q8 | What's the right founder-account UX — passwordless email-link auto-login on first visit, or invite-accept flow? | UX decision that affects time-to-first-value. Lean magic-link, but worth confirming. | Sam |
| Q9 | Does the v1 signup form support choosing a feature-flag preset (Booking-focused / Token-focused / Education / Custom)? | Affects seed-script complexity and onboarding clarity. v1 could ship with one default preset and add more later. | Sam |
| Q10 | What is the upgrade path from "village deployed on shared tier" to "village on self-hosted tier"? | Even if the self-hosted tier is deferred, the v1 architecture should not make this migration impossible. | Avi |
| Q11 | How does this work coordinate with Pillar 2 (Platform Configurability — custom pages, theme system)? | Pillars 1 and 2 overlap in the "config-driven branding and copy" space. Risk of duplicating work or building incompatible abstractions. | Sam + Vlad |
| Q12 | What's the right interplay between this work and the federation hub (`api.closer.earth`)? Is `api.closer.earth` also where the control plane lives, or is it a separate central service? | KTD5 assumes same instance; needs explicit confirmation from whoever owns federation hub design. | Sam |
| Q13 | Custom domain onboarding UX — does the founder configure DNS during signup (blocking provision until they're done) or post-signup from the admin UI (provision finishes on `<slug>.closer.earth`, custom domain is a separate step later)? | Affects orchestrator state machine, signup UX, and what "30 minutes to working instance" actually means for custom-domain villages. Lean post-signup, but worth confirming. | Sam + Avi |
| Q14 | For the Earthbound-as-customer test (goal 5.1 #3), do we treat it as a *fresh* deploy with manual data import after, or do we build any import tooling as part of v1? | Affects scope. Lean fresh deploy + manual data ops handled by Paul, with import tooling as a follow-up. | Sam + Paul |
| Q15 | When custom domains are in play, does the email sender domain (Mailgun) follow the custom domain (`mail.earthbound.eco`), follow the closer.earth subdomain (`mail.<slug>.closer.earth`), or is it founder-configurable? | Affects Mailgun automation, DKIM/SPF, and what the founder sees in their inbox. Each path has trade-offs in branding vs deliverability vs setup complexity. | Sam + Paul |
| _add yours_ | | | |

---

## 10. What's Not in This Document

To keep this an alignment doc and not an implementation plan, the following are deliberately omitted and will land in a follow-up plan once Sections 3–8 are signed off:

- Per-engineer track breakdown
- Implementation units (file-level changes, functions, test cases)
- Interface contracts between tracks
- Mermaid sequence diagrams of the provisioning lifecycle
- The specific shape of the Terraform modules / cloud-init / CLI
- Test scenarios for individual units
- Risk register at the implementation level

These existed in an earlier draft (git history of this file) and will be regenerated against the signed-off direction.

---

## 11. Decision Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-05-16 | Initial draft with per-track implementation units | First pass before supplementary docs landed |
| 2026-05-17 | Corrected Mongo topology to shared server with per-tenant DBs | Founder confirmed production reality |
| 2026-05-17 | Restructured to alignment-first shape; dropped track and unit detail; added Current Architecture section for sign-off | Team direction: lock medium-grain alignment before implementation detail |
| 2026-05-17 | Removed all hard-deadline language; added custom domains as in-scope (KTD9) anchored to the Earthbound-as-customer test; replaced team-prerequisites placeholder with the actual working group (Avi, Vlad, Sam, Paul); added Q13–Q15 for custom-domain UX/import/email questions | Document should be time-agnostic; custom domains are required for the v1 sign-off test; team composition is confirmed |
