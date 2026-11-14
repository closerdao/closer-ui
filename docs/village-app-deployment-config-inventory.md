# 🏘️ Village App Deploy Config — Review Deck

**Every row asks one question: where does this config live?**

Five homes:

`env` · `build snapshot` · `runtime DB` · `CMS` · `code`

> This is a **review**, not a build plan. Nothing gets coded until it reads `accepted`.

> ✅ **Rows closed 2026-08-04.** Every `proposed` / `needs discussion` row in this deck was decided in one pass (owner: Avi). Decisions are recorded inline below; the reasoning lives in the config-revisit map. Where a decision commits to build work, that work is filed as repo issues rather than described here — this deck stays a map of *where config lives*, not a plan of what to write.

> ⚖️ **Zero-env-edit spin-up: decided — yes, for standard villages.** A village on the MVP path (commerce gates off) provisions with **no human editing env**. Provisioning already enforces this: `assembleVillageEnv` is the single assembly path and `validateDeployEnvWrite` rejects writes outside the village-owned rows. **One named exception:** Stripe Connect — `createStripeAccount` is a deliberately blocked provider, so a village turning on money features takes a manual Stripe onboarding step. Any *new* manual env row needs a reason recorded here; "it was easier" is how a village ends up inheriting another village's identity.

---

## 1 — Scope

**Small apps first. TDF later.**

Baseline (the small Reference Village Apps):

- `apps/earthbound`
- `apps/closer`
- `apps/foz`
- `apps/moos`
- `apps/per-auset`
- `apps/lios`

Skip `apps/tdf` this pass. It is big. Use it to stress-test the model *after* this baseline lands.

Reference apps are **sources to learn from**, not things we migrate.

---

## 2 — The five homes

| Home | Holds |
| --- | --- |
| **Deploy-time env** | Values the app needs *before* it can fetch backend config |
| **Build snapshot** | Backend `/config` frozen at prebuild → `appConfig.snapshot.json` |
| **Runtime DB config** | Knobs each village turns itself (product + policy) |
| **Village CMS** | Pages, homepage sections, media, nav, public copy |
| **Code** | Routes, shared behavior, flows, product mechanics |

---

## 3 — How to read the tables

| Status | Means |
| --- | --- |
| `accepted` | Agreed. Move on unless new evidence. |
| `accepted*` | Agreed **for now**, with a named revisit trigger in the notes. |
| `platform` | Not village config. Owned by the platform/deployment; outside this deck's remit — see §4a. |
| ~~`proposed`~~ | Retired 2026-08-04 — every row was decided. |
| ~~`needs discussion`~~ | Retired 2026-08-04 — every row was decided. |

| Flag | Means |
| --- | --- |
| `✓` / `✗` | Required / not required |
| `feature` | Only when that feature launches |
| `web3` | Only for web3 deployments |
| `page` | Only when that page launches |

---

## 4 — House rules

- Hardcoded village content → **CMS**, not DB config
- Public provider keys → **stay in env** by default
- `NEXT_PUBLIC_PLATFORM_URL` = the one true deployment URL
- `general.semanticUrl` must match that URL before launch
- Feature availability has **two switches — both must be on:**
  - **env gate** (`NEXT_PUBLIC_FEATURE_*`) — compiled per deployment. If not `true`, the code path is dead: route 404s, nav item hidden. This is the *capability* switch, read from `process.env` at build/server time.
  - **DB config** — per-village `enabled` flag (e.g. `fundraiser.enabled`). This is the *per-village* switch.
  - **Status: `accepted*` — env gates stay for MVP; revisit after launch.** Moving the gates to DB is attractive (an operator toggle that needs a redeploy is the same complaint #915 fixed for booking config, and env-held flags sit awkwardly against the zero-env-edit rule above) — but a DB flag read from the *build snapshot* is equally frozen, so the move only pays off combined with live runtime reads, and it turns dead routes into reachable-but-hidden ones. Not an MVP-path problem. Filed for post-launch.
- **Content / identity / structure** — the seam for anything that renders:
  - **content** (page bodies, FAQs, informational pages, public documents, hero and content images) → **CMS**
  - **identity** (village name, canonical URL, logo, contact, socials, OG defaults) → **`general`** DB config
  - **structure** (routes, layout shell, flows, product mechanics) → **code**
  - Applies to new content types too — the point is to stop re-arguing each one.
- **Neutral by default.** No schema default may carry another village's value. A village that seeds *nothing* must still render as itself, not as TDF. Seeding explicit empty strings is a workaround, not the mechanism — the defaults themselves must be neutral, and "absent bucket ⇒ neutral" is the acceptance test.

---

## 4a — 🏗️ Platform-owned, not village config

Some values are deployment or build-pipeline plumbing. They are **out of this deck's remit** — they are not pending review, and the config catalog should not mark them as awaiting a deck row.

| Value | Why it is not village config |
| --- | --- |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Deployment observability |
| `NEXT_PUBLIC_LOG_REQUESTS` | Debug switch (single read, `packages/closer/utils/api.js:351`) |
| `CONFIG_BUILD_API_URL` | Build-script input; deliberately outside the village env contract |
| `NEXT_PUBLIC_CLOUDFLARE_KEY` | Read by `packages/closer`, not the village env shape (ADR 0017) |

The catalog still owns and drift-checks these rows — they simply stop pretending to await deck review. `notInDeck` previously conflated "unreviewed" with "not our business", and because that status **locks a row out of form editing**, the conflation had teeth.

---

## 5 — 🌐 Deploy-time env

**The stuff the app needs before it can even phone home.**

Keep these in env vars unless review finds a strong reason to move them.

| Env var | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | village + refs | env | ✗ | ✓ | ✓ | accepted |
| `NEXT_PUBLIC_PLATFORM_URL` | village + refs | env | ✗ | ✓ | ✓ | accepted |
| `NEXT_PUBLIC_PLATFORM` | refs | **delete** | ✗ | ✗ | ✗ | accepted |
| `NEXT_PUBLIC_APP_NAME` | village | env, **required** | ✗ | ✓ | ✓ | accepted |
| `NEXT_PUBLIC_PLATFORM_NAME` | village | **delete** → `general.platformName` | ✗ | ✗ | ✗ | accepted |
| `NEXT_PUBLIC_CDN_URL` | village + refs | env | ✗ | ✗ | maybe | accepted |
| `NEXT_PUBLIC_NETWORK` | refs | env | ✗ | web3 | web3 | accepted* |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | refs | env | ✗ | web3 | web3 | accepted |
| `NEXT_PUBLIC_TOKEN_SALE_DATE` | refs | env | ✗ | ✗ | token sale | accepted* |
| `NEXT_PUBLIC_DEFAULT_TIMEZONE` | code refs | env fallback | ✗ | ✗ | ✓ | accepted |
| `NEXT_PUBLIC_FEATURE_CARROTS` | code refs | env gate | ✗ | ✗ | feature | accepted* |
| `NEXT_PUBLIC_FEATURE_SUPPORT_US` | code refs | env gate | ✗ | ✗ | feature | accepted* |
| `NEXT_PUBLIC_LOG_REQUESTS` | refs | env | ✗ | ✗ | ✗ | platform |
| `SENTRY_DSN` | code refs | env | mixed | ✗ | ✗ | platform |
| `NEXT_PUBLIC_SENTRY_DSN` | code refs | env | mixed | ✗ | ✗ | platform |
| Public provider keys | shared | env | ✗ | feature | feature | accepted |

**Why each stays put:**

- `NEXT_PUBLIC_API_URL` — needed before the app can fetch backend config
- `NEXT_PUBLIC_PLATFORM_URL` — canonical public deployment URL
- `NEXT_PUBLIC_PLATFORM` — **delete.** No shared code reads it. The only tracked read is `apps/village-app/env.js:97`, a fallback for `NEXT_PUBLIC_PLATFORM_URL` — which provisioning always supplies, so the fallback can never fire. Kept here as a tombstone so an old TDF env doesn't reopen the question.
- `NEXT_PUBLIC_APP_NAME` — **required, no default.** Not a display name: it is a feature discriminator (16+ `APP_NAME === 'tdf'` branches gating token-sale dashboards, revenue widgets, accounting actions) and the locale-bundle key. Provisioning supplies the **village slug**. Two traps worth knowing: `village-app/_app.tsx` spreads `appConfigFromEnv` **last**, so env beats DB `general.appName` (undocumented, and the only reason villages don't inherit `config.ts`'s `appName: 'tdf'` default); and `loadLocaleData`'s fallback branch currently loads the **Closer** bundle for any unknown app, so the slug only works once that resolver is generic. Both filed.
- `NEXT_PUBLIC_PLATFORM_NAME` — **delete.** Two sources for one display name is how a village shows its own name in the header and `'This village'` in the footer. `general.platformName` is the single source; it is already seeded end-to-end from the API's `PLATFORM_NAME`.
- `NEXT_PUBLIC_CDN_URL` — stays in env: platform-owned storage, and it is where uploads land regardless of who owns the pointer to them.
- `NEXT_PUBLIC_NETWORK` — env-owned blockchain network selector. `accepted*`: **revisit when a village enables web3.** Every web3 gate defaults false, so it cannot reach the MVP path.
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` — public WalletConnect key
- `NEXT_PUBLIC_TOKEN_SALE_DATE` — stays in env for now. It probably *is* campaign config that belongs in DB, but it is token-sale-gated and reaches no current village. `accepted*`: **revisit with the token sale.**
- `NEXT_PUBLIC_DEFAULT_TIMEZONE` — fallback only; `general.timeZone` wins once config loads
- `NEXT_PUBLIC_FEATURE_*` — env is the capability gate: it gates whole routes + nav from `process.env` at build/server time. `accepted*`: **revisit after launch** — see the two-switch rule in §4 for why moving them to DB is neither obviously right nor free.
- Sentry / log switches — see §4a, platform-owned
- Public provider keys — Firebase, Google Maps, Stripe publishable, WalletConnect, analytics

---

## 6 — 📦 Build-time DB snapshot

**Config frozen at build time.**

Prebuild fetches backend `/config` → writes `packages/closer/generated/appConfig.snapshot.json`.

| Concern | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `/config` rows | shared + village + refs | snapshot | ✗ | ✓ | ✓ | accepted |
| `general` snapshot | shared + village + refs | snapshot | ✗ | ✓ | ✓ | accepted |
| `booking` snapshot | `apps/lios` | snapshot | ✗ | ✓ | ✓ | accepted |

- `/config` rows — **six buckets are mandatory for deploy**: `general`, `events`, `booking`, `subscriptions`, `payment`, `web3`. Everything else is launch-time: seeded as an explicit neutral row when a village turns that feature on. Each of the six earns its place for a specific reason, not by category — see the table below.
- `general` snapshot — seeds identity, locale, currency, timezone, footer, page metadata
- `booking` snapshot — mandatory on **crash-avoidance** grounds: `getSettings('booking')` is dereferenced at 26 API call sites. The old worry ("split booking policy from homepage content first") is resolved: homepage content is CMS page documents, a separate concern entirely, so there is nothing left to split.

**Why each mandatory bucket is mandatory:**

| Bucket | Reason |
| --- | --- |
| `general` | The single biggest leak surface — every unset key backfills from a TDF literal (name, canonical URL, legal address, socials, Facebook pixel, FAQ sheet id). |
| `events` | The only bucket with **no env gate at all**, and its `enabled` default is inverted (`!== false`), so a fresh village gets Events on unconditionally. |
| `booking` | 26 API dereferences; commerce gate must be explicitly off. |
| `subscriptions` | Commerce gate off. |
| `payment` | VAT rate defaults to Portugal's `0.23` — wrong by default for any non-PT village. |
| `web3` | `bookingToken` defaults to `'TDF'`, which surfaces through the member menu. |

> Two seeding bugs exist **today**, independent of any decision here, and should be fixed with whatever writes these buckets: `booking` is seeded in a legacy nested shape the UI schema no longer expects, and `subscriptions` is seeded as `{plans: []}` while the UI reads `elements`.

**Which API the prebuild fetches from.** The prebuild reads `CONFIG_BUILD_API_URL` if set, falling back to `NEXT_PUBLIC_API_URL` (#942). Provisioned villages set it to the DigitalOcean ingress, because at build time the branded API domain may not resolve yet (closer-procurement#546). The fetch retries with backoff and **fails the build** if the API answers with an error — a village never ships a silently stale snapshot. Two paths still degrade quietly and matter for row decisions: neither URL set at all skips the fetch and keeps whatever snapshot the build started with, and a missing snapshot file is bootstrapped to `{}`, leaving pages on schema defaults.

---

## 7 — 🎛️ Runtime DB config

**Knobs each village turns itself.**

Editable per village through backend config.

| Concern | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Village identity | village + refs | `general` | ✗ | ✗ | ✓ | accepted |
| Footer social/contact | refs | `general` | ✗ | ✗ | ✓ | accepted |
| FAQ sheet id | refs | **CMS** — remove the field | ✗ | ✗ | FAQ | accepted |
| Feature enablement | shared | feature buckets | ✗ | ✗ | feature | accepted |
| Support settings | `apps/moos` | `fundraiser` | ✗ | ✗ | support | accepted |
| Page metadata | refs | `general` + CMS | ✗ | ✗ | page | accepted |

- Village identity — public name, app id, canonical URL, contact, timezone
- Footer social/contact — village identity, lives in `general`
- FAQ sheet id — **CMS FAQ blocks; `faqsGoogleSheetId` comes out of the schema entirely.** It is not an inert default: `isFaqEnabled` is `Boolean(config?.FAQS_GOOGLE_SHEET_ID)`, so inheriting TDF's value *force-enables* a TDF FAQ link in a fresh village's menu. Removing the field is required regardless of when TDF itself migrates off Sheets (post-MVP) — new villages simply never get the Sheets path.
- Feature enablement — booking, volunteering, citizenship, learning hub, affiliate, fundraiser flags
- Support settings — `apps/moos` uses fundraiser config for support-page availability + credit price. Stays where it is; feature-gated off by default. The hazard was never the row but `fundraiser`'s schema defaults (TDF campaign copy including a live Stripe price id), which the neutral-defaults rule in §4 now covers.
- Page metadata — identity (name, canonical URL, OG defaults) stays in `general`; per-page titles and descriptions live on the CMS document

---

## 8 — 📝 Code or CMS — NOT DB config

**Content and behavior. Not database rows.**

| Concern | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Homepages | refs | CMS | ✗ | ✗ | ✓ | accepted |
| Nested public pages | `apps/earthbound` | CMS | ✗ | ✗ | page | accepted |
| Informational pages | closer + foz + moos | **CMS** | ✗ | ✗ | page | accepted |
| Image assets | refs | **`general` or CMS** (split by kind) | ✗ | ✗ | ✓ | accepted |
| PDFs | refs | CMS docs | ✗ | ✗ | legal/page | accepted |
| App routes | refs | code | ✗ | ✓ | feature | accepted |
| Footer/layout shell | refs | code + config | ✗ | ✓ | ✓ | accepted |
| Shared behavior | shared | code | ✗ | ✓ | ✓ | accepted |

- Homepages — sections, copy, images, FAQs, CTAs → CMS
- Nested public pages — `apps/earthbound` needs custom slugs + section rendering
- Informational pages — CMS page documents on shared routes. Per the content/identity/structure rule: the route is structure (code), the words are content (CMS).
- Image assets — **no Brand Kit.** Identity images (logo) → `general` (`logoHeader` already exists and is wired end-to-end); hero and content images → CMS media. Brand Kit's real payload was colors and fonts, which cannot reach the frontend at all today (compile-time Tailwind themes), so the bucket would have been a container for values nothing can consume. When theme tokens are solved post-MVP, a Brand Kit can absorb `logoHeader` then.
- PDFs — CMS file links, not structured config
- App routes — code owns routes; feature config + nav decide visibility
- Footer/layout shell — code owns the shell; `general` + CMS own the content in it
- Shared behavior — stays in code unless it is a per-village policy

---

## 9 — 🚫 Never migrate these

- **Secrets** → never public env, never editable DB config
- **Deployment infra values** → never Brand Kit fields
- **Bespoke page content** → CMS, never runtime DB config

---

## 10 — ✅ Settled (was: still fighting about these)

All four closed on 2026-08-04:

- **Which buckets are mandatory for deploy vs launch?** → the six-bucket set in §6; everything else is launch-time.
- **FAQ: CMS or Google Sheet?** → CMS blocks; `faqsGoogleSheetId` comes out of the schema (it force-enables a TDF FAQ link today).
- **Informational pages: product routes or CMS?** → CMS pages on shared routes, per the content/identity/structure rule in §4.
- **PDFs: structured config or CMS file links?** → CMS file links.

## 11 — ⏭️ Deliberately deferred

Not open questions — decided answers with a named trigger to revisit.

| Item | Revisit when |
| --- | --- |
| `NEXT_PUBLIC_FEATURE_*` gates → DB config | After launch |
| `NEXT_PUBLIC_NETWORK`, `NEXT_PUBLIC_TOKEN_SALE_DATE` | A village enables web3 / the token sale |
| Theme colors + fonts (config-driven branding) | Post-MVP; needs template work, no seeding path can fix it |
| TDF's own migration off Google-Sheets FAQ | Post-MVP; does not block new villages |
| Platform-wide migration of `apps/closer` / TDF off hardcoded config | Post-MVP goal; this pass is the village path only |
