# 🏘️ Village App Deploy Config — Review Deck

**Every row asks one question: where does this config live?**

Five homes:

`env` · `build snapshot` · `runtime DB` · `CMS` · `code`

> This is a **review**, not a build plan. Nothing gets coded until it reads `accepted`.

> ⚖️ **Open decision, not a settled goal:** whether we should be able to *spin up a new village without touching env vars* is **still a discussion** — not something this deck assumes or commits to. Env vars stay in play until that discussion lands.

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
| `proposed` | Probably right. Needs a look. |
| `needs discussion` | **Do not code yet.** |

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

---

## 5 — 🌐 Deploy-time env

**The stuff the app needs before it can even phone home.**

Keep these in env vars unless review finds a strong reason to move them.

| Env var | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | village + refs | env | ✗ | ✓ | ✓ | accepted |
| `NEXT_PUBLIC_PLATFORM_URL` | village + refs | env | ✗ | ✓ | ✓ | accepted |
| `NEXT_PUBLIC_PLATFORM` | refs | env | ✗ | ✗ | ✗ | proposed |
| `NEXT_PUBLIC_CDN_URL` | village + refs | env | ✗ | ✗ | maybe | proposed |
| `NEXT_PUBLIC_LOG_REQUESTS` | refs | env | ✗ | ✗ | ✗ | proposed |
| `NEXT_PUBLIC_NETWORK` | refs | env | ✗ | web3 | web3 | proposed |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | refs | env | ✗ | web3 | web3 | accepted |
| `NEXT_PUBLIC_TOKEN_SALE_DATE` | refs | DB config | ✗ | ✗ | token sale | needs discussion |
| `NEXT_PUBLIC_DEFAULT_TIMEZONE` | code refs | env fallback | ✗ | ✗ | ✓ | accepted |
| `NEXT_PUBLIC_FEATURE_CARROTS` | code refs | env gate | ✗ | ✗ | feature | accepted |
| `NEXT_PUBLIC_FEATURE_SUPPORT_US` | code refs | env gate | ✗ | ✗ | feature | accepted |
| `SENTRY_DSN` | code refs | env | mixed | ✗ | ✗ | proposed |
| `NEXT_PUBLIC_SENTRY_DSN` | code refs | env | mixed | ✗ | ✗ | proposed |
| Public provider keys | shared | env | ✗ | feature | feature | accepted |

**Why each stays put:**

- `NEXT_PUBLIC_API_URL` — needed before the app can fetch backend config
- `NEXT_PUBLIC_PLATFORM_URL` — canonical public deployment URL
- `NEXT_PUBLIC_PLATFORM` — legacy id / fallback; keep only if shared code still needs it
- `NEXT_PUBLIC_CDN_URL` — stays in env until media ownership is clearer
- `NEXT_PUBLIC_LOG_REQUESTS` — debug switch, not village config
- `NEXT_PUBLIC_NETWORK` — env-owned blockchain network selector
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` — public WalletConnect key
- `NEXT_PUBLIC_TOKEN_SALE_DATE` — smells like campaign config; check usage before adding a DB field
- `NEXT_PUBLIC_DEFAULT_TIMEZONE` — fallback only; `general.timeZone` wins once config loads
- `NEXT_PUBLIC_FEATURE_*` — env is **only** the capability gate: it gates whole routes + nav from `process.env` at build/server time, so it can't become pure DB config. The per-village on/off already lives in DB (`fundraiser.enabled`, feature buckets), not env.
- Sentry values — deployment observability, not village config
- Public provider keys — Firebase, Google Maps, Stripe publishable, WalletConnect, analytics

---

## 6 — 📦 Build-time DB snapshot

**Config frozen at build time.**

Prebuild fetches backend `/config` → writes `packages/closer/generated/appConfig.snapshot.json`.

| Concern | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `/config` rows | shared + village + refs | snapshot | ✗ | ✓ | ✓ | proposed |
| `general` snapshot | shared + village + refs | snapshot | ✗ | ✓ | ✓ | accepted |
| `booking` snapshot | `apps/lios` | snapshot | ✗ | ✗ | maybe | needs discussion |

- `/config` rows — pick the required bucket subset after row-level review
- `general` snapshot — seeds identity, locale, currency, timezone, footer, page metadata
- `booking` snapshot — split booking policy from homepage content before coding

**Which API the prebuild fetches from.** The prebuild reads `CONFIG_BUILD_API_URL` if set, falling back to `NEXT_PUBLIC_API_URL` (#942). Provisioned villages set it to the DigitalOcean ingress, because at build time the branded API domain may not resolve yet (closer-procurement#546). The fetch retries with backoff and **fails the build** if the API answers with an error — a village never ships a silently stale snapshot. Two paths still degrade quietly and matter for row decisions: neither URL set at all skips the fetch and keeps whatever snapshot the build started with, and a missing snapshot file is bootstrapped to `{}`, leaving pages on schema defaults.

---

## 7 — 🎛️ Runtime DB config

**Knobs each village turns itself.**

Editable per village through backend config.

| Concern | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Village identity | village + refs | `general` | ✗ | ✗ | ✓ | accepted |
| Footer social/contact | refs | `general` | ✗ | ✗ | ✓ | accepted |
| FAQ sheet id | refs | CMS or `general` | ✗ | ✗ | FAQ | needs discussion |
| Feature enablement | shared | feature buckets | ✗ | ✗ | feature | accepted |
| Support settings | `apps/moos` | `fundraiser` | ✗ | ✗ | support | proposed |
| Page metadata | refs | `general` + CMS | ✗ | ✗ | page | proposed |

- Village identity — public name, app id, canonical URL, contact, timezone
- Footer social/contact — part of the Village Brand Kit
- FAQ sheet id — prefer CMS FAQ blocks if they can replace Google Sheets
- Feature enablement — booking, volunteering, citizenship, learning hub, affiliate, fundraiser flags
- Support settings — `apps/moos` uses fundraiser config for support-page availability + credit price
- Page metadata — identity stays in `general`; page bodies go to CMS

---

## 8 — 📝 Code or CMS — NOT DB config

**Content and behavior. Not database rows.**

| Concern | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Homepages | refs | CMS | ✗ | ✗ | ✓ | accepted |
| Nested public pages | `apps/earthbound` | CMS | ✗ | ✗ | page | accepted |
| Informational pages | closer + foz + moos | CMS or code | ✗ | ✗ | page | needs discussion |
| Image assets | refs | CMS or Brand Kit | ✗ | ✗ | ✓ | proposed |
| PDFs | refs | CMS docs | ✗ | ✗ | legal/page | needs discussion |
| App routes | refs | code | ✗ | ✓ | feature | accepted |
| Footer/layout shell | refs | code + config | ✗ | ✓ | ✓ | proposed |
| Shared behavior | shared | code | ✗ | ✓ | ✓ | accepted |

- Homepages — sections, copy, images, FAQs, CTAs → CMS
- Nested public pages — `apps/earthbound` needs custom slugs + section rendering
- Informational pages — split reusable product pages from village editorial pages
- Image assets — logos → Brand Kit; content images → CMS media
- PDFs — split public docs from structured legal config
- App routes — code owns routes; feature config + nav decide visibility
- Footer/layout shell — code owns layout; CMS / Brand Kit owns content
- Shared behavior — stays in code unless it is a per-village policy

---

## 9 — 🚫 Never migrate these

- **Secrets** → never public env, never editable DB config
- **Deployment infra values** → never Brand Kit fields
- **Bespoke page content** → CMS, never runtime DB config

---

## 10 — 🔥 Still fighting about these

- Which config buckets are **mandatory for deploy** vs just launch-readiness?
- FAQ: move fully into CMS, or keep Google Sheet support?
- Which informational pages are reusable product routes vs village-owned CMS pages?
- Which public documents need structured config instead of CMS file links?
