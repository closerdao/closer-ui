# Review Village App deployment config

This document inventories the config needed to deploy the generic Village App. Use it to decide what stays in environment variables, what moves to backend database config, what belongs in the Village content management system, and what stays in product code.

This is a review document, not an implementation plan.

## Decision scope

Use the smaller Reference Village Apps as the first baseline:

- `apps/earthbound`
- `apps/closer`
- `apps/foz`
- `apps/moos`
- `apps/per-auset`
- `apps/lios`

Exclude `apps/tdf` from this pass. TDF has a larger config footprint and should stress-test the model after this baseline review.

## Review legend

| Value | Meaning |
| --- | --- |
| `accepted` | Agreed unless new evidence appears |
| `proposed` | Likely direction, needs review |
| `needs discussion` | Do not code yet |
| `✓` | Required or true |
| `✗` | Not required or false |
| `feature` | Required only when that feature launches |
| `web3` | Required only for web3 deployments |
| `page` | Required only when that page launches |

## Agreed rules

- Reference apps are sources for the inventory, not migration targets
- The first pass combines all smaller Reference Village Apps except TDF
- Hardcoded village content should move to Village CMS, not database config
- Public provider keys stay in deploy-time env by default
- `NEXT_PUBLIC_PLATFORM_URL` is the deployment URL source of truth
- `general.semanticUrl` should match the deployment URL before launch
- Feature availability has two layers: env capability gates and per-village database config

## Target categories

| Target | Use for |
| --- | --- |
| Deploy-time env | Values needed before the app can fetch backend config |
| Build snapshot | Backend `/config` fetched during prebuild |
| Runtime DB config | Editable per-village product and policy settings |
| Village CMS | Pages, homepage sections, media, navigation, and public copy |
| Code | Routes, shared behavior, flows, and product mechanics |

## Deploy-time env

These values should stay in environment variables unless review finds a stronger reason to move them.

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

Notes:

- `NEXT_PUBLIC_API_URL`: required before the app can fetch backend config
- `NEXT_PUBLIC_PLATFORM_URL`: canonical public deployment URL
- `NEXT_PUBLIC_PLATFORM`: legacy identifier or fallback; keep only if shared code still needs it
- `NEXT_PUBLIC_CDN_URL`: keep in env until media ownership is clearer
- `NEXT_PUBLIC_LOG_REQUESTS`: debug logging switch, not village config
- `NEXT_PUBLIC_NETWORK`: environment-owned blockchain network selector
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: public WalletConnect project key
- `NEXT_PUBLIC_TOKEN_SALE_DATE`: likely campaign config; inspect usage before adding a DB field
- `NEXT_PUBLIC_DEFAULT_TIMEZONE`: fallback only; `general.timeZone` should win after config loads
- `NEXT_PUBLIC_FEATURE_CARROTS` and `NEXT_PUBLIC_FEATURE_SUPPORT_US`: env gates availability; DB config enables each village
- Sentry values: deployment observability, not village config
- Public provider keys: Firebase, Google Maps, Stripe publishable keys, WalletConnect, analytics

## Build-time DB snapshot

The prebuild flow fetches backend `/config` and writes `packages/closer/generated/appConfig.snapshot.json`.

| Concern | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `/config` rows | shared + village + refs | snapshot | ✗ | ✓ | ✓ | proposed |
| `general` snapshot | shared + village + refs | snapshot | ✗ | ✓ | ✓ | accepted |
| `booking` snapshot | `apps/lios` | snapshot | ✗ | ✗ | maybe | needs discussion |

Notes:

- `/config` rows: decide the required bucket subset after row-level review
- `general` snapshot: seeds identity, locale, currency, timezone, footer, and page metadata
- `booking` snapshot: separate booking policy from homepage content before coding

## Runtime DB config

These values should be editable per village through backend config.

| Concern | Source | Target | Secret | Deploy | Launch | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Village identity | village + refs | `general` | ✗ | ✗ | ✓ | accepted |
| Footer social/contact | refs | `general` | ✗ | ✗ | ✓ | accepted |
| FAQ sheet id | refs | CMS or `general` | ✗ | ✗ | FAQ | needs discussion |
| Feature enablement | shared | feature buckets | ✗ | ✗ | feature | accepted |
| Support settings | `apps/moos` | `fundraiser` | ✗ | ✗ | support | proposed |
| Page metadata | refs | `general` + CMS | ✗ | ✗ | page | proposed |

Notes:

- Village identity: public name, app id, canonical URL, contact details, and timezone
- Footer social/contact: part of the Village Brand Kit
- FAQ sheet id: prefer CMS FAQ blocks if they can replace Google Sheets
- Feature enablement: includes booking, volunteering, citizenship, learning hub, affiliate, and fundraiser flags
- Support settings: `apps/moos` uses fundraiser config for support page availability and credit price display
- Page metadata: keep identity in `general`; move page bodies to CMS

## Code or CMS, not DB config

These concerns should not become database config by default.

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

Notes:

- Homepages: move sections, copy, images, FAQs, and calls to action to CMS
- Nested public pages: `apps/earthbound` needs custom slugs and section rendering
- Informational pages: split reusable product pages from village-owned editorial pages
- Image assets: logos belong in Brand Kit; content images belong in CMS media
- PDFs: separate public documents from structured legal config
- App routes: code owns routes; feature config and navigation decide visibility
- Footer/layout shell: code owns layout; CMS or Brand Kit owns content
- Shared behavior: keep in code unless it is a per-village policy

## Do not migrate

- Secrets must not move to public env or editable DB config
- Deployment infrastructure values should not become Village Brand Kit fields
- Bespoke page content should move to Village CMS, not runtime DB config

## Open questions

- Which config buckets are mandatory for deployment, and which are only launch readiness?
- Should FAQ content move fully into CMS, or keep Google Sheet support?
- Which informational pages are reusable product routes versus village-owned CMS pages?
- Which public documents need structured config instead of CMS file links?
