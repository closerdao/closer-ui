# Plan Village App deployment config

## What this document is for

This document helps stakeholders decide what configuration the generic Village App needs before anyone writes migration or schema code. It inventories the smaller Reference Village Apps, classifies each configurable concern, and marks what should stay in deployment environment variables, move to backend database config, move to Village content management system, or stay as product code.

This is not an implementation plan yet. It is a decision map for review.

## Who should read this

Read this if you need to decide:

- What a new Village Deployment needs before it can boot
- What a Village needs before public launch
- Which settings belong in backend config
- Which content belongs in Village CMS
- Which values must stay in environment variables
- Which existing app-specific code should not become config

## Key terms

- **Village App**: the generic app package that can deploy many Villages without bespoke application code
- **Reference Village App**: an existing bespoke app used as source material for this inventory
- **Village Deployment**: one deployed instance of the Village App connected to a Village backend, domain, environment, and editable config
- **Deploy-time env**: environment variables needed before the app can fetch backend config
- **Backend database config**: editable config stored in backend `/config` records
- **Village CMS**: the Village content management system for homepage sections, pages, media, navigation, and public content
- **Build-time DB snapshot**: backend config fetched during prebuild and written into `generated/appConfig.snapshot.json`

## Current decision

Use the smaller Reference Village Apps as the first baseline:

- `apps/earthbound`
- `apps/closer`
- `apps/foz`
- `apps/moos`
- `apps/per-auset`
- `apps/lios`

Exclude `apps/tdf` from the first pass. TDF has a much larger config footprint, so use it later as a stress test after the baseline categories have been reviewed.

## What has already been agreed

- Existing bespoke apps are reference sources, not migration targets in this session
- The first inventory should combine all smaller Reference Village Apps except TDF
- Inventory rows should describe distinct config concerns, not duplicate every app occurrence
- The inventory should include env vars, backend config, content, assets, and village-specific behavior
- Hardcoded content should default to Village CMS, not DB config
- Public third-party provider keys should stay in deploy-time env by default
- `NEXT_PUBLIC_PLATFORM_URL` is the deployment URL source of truth
- `general.semanticUrl` should match the deployment URL for launch readiness
- Feature availability has two layers: Platform Capability Gate plus Village Feature Config
- The review table should include `Review status` and `Implementation note`

## How to review this document

Review the rows by status:

- `accepted`: already agreed unless new evidence appears
- `proposed`: likely direction, needs stakeholder review
- `needs discussion`: do not code until the decision is resolved

For each `proposed` or `needs discussion` row, decide:

- Is the target category right?
- Is the value required for deploy, launch, both, or neither?
- Does the value belong in backend config, Village CMS, deploy-time env, or code?
- Does the implementation note create a useful next step?

## Classification rules

Classify each concern into one target category:

- **Deploy-time env**: values needed before the app can contact backend services or initialize deployment infrastructure
- **Build-time DB snapshot**: backend database config fetched from `/config` during prebuild and embedded into `generated/appConfig.snapshot.json`
- **Runtime DB config**: editable per-Village backend database config used by the Village App
- **Code-only / CMS-not-config**: product behavior, route structure, or public content that should stay in code or move to Village CMS instead of DB config

Do not move secrets into public env or editable DB config.

**Platform Capability Gate** means a deploy-time switch that determines whether a capability is available to a Village Deployment.

**Village Feature Config** means editable backend config that determines whether an available capability is enabled for one Village.

`required for deploy` means a value is needed for a technical Village Deployment to run. Keep this list small: API URL, public deployment URL, reachable backend config, and enough defaulted `general` config to avoid broken UI.

`required for launch` means a value is needed for an operationally acceptable public launch. Launch readiness includes a complete Village Brand Kit, feature configuration for enabled modules, and either a published CMS homepage or an intentionally accepted Coming Soon State.

## Default target rules

When you find a hardcoded village-specific item, classify it by what kind of decision it represents:

- **Village CMS**: homepage sections, public page copy, image galleries, downloadable PDFs, footer link sets, and public marketing content
- **Village Brand Kit / `general` config**: logo, public name, contact details, social URLs, legal address, and primary calls to action
- **Runtime DB config buckets**: booking policy values, feature enablement, payment currencies, subscription offerings, event settings, governance settings, and similar operational policies
- **Code-only product behavior**: route availability, checkout flow, auth behavior, dashboard structure, shared component behavior, and other product mechanics

## Inventory record format

Each inventory item uses the same field order:

- **Source**: where the concern appears
- **Current location**: where the value or behavior lives today
- **Current usage**: what the app does with it
- **Target**: the proposed category and target field when one exists
- **Exposure**: whether the value is secret or public
- **Required for deploy**: whether the app needs it to boot
- **Required for launch**: whether the Village needs it for public launch
- **Review status**: `accepted`, `proposed`, or `needs discussion`
- **Implementation note**: what coding work this may imply later
- **Migration note**: what reviewers should remember before choosing work

## Source apps

- `apps/village-app`
- `apps/earthbound`
- `apps/closer`
- `apps/foz`
- `apps/moos`
- `apps/per-auset`
- `apps/lios`
- Other app packages only when they contain unique config relevant to the generic Village App

The first pass should combine the smaller Reference Village Apps and explicitly exclude `apps/tdf`. Defer TDF to a later stress-test pass after reviewers agree on the baseline categories.

The combined smaller-app pass should include env/config values and hardcoded village-specific content or behavior. Classify hardcoded content and bespoke behavior separately as `code-only / CMS-not-config` so it does not become oversized DB config.

The inventory should be broad enough to support later coding choices. Inclusion in the inventory does not mean the item should be implemented, migrated, or turned into DB config.

Inventory rows should be deduplicated by distinct config concern or usage pattern. The `Source app` column should list every smaller Reference Village App where that concern appears. Add app-specific rows only for meaningful differences.

## Deploy-time env

Values in this section should remain environment variables unless review finds a safer replacement.

| Env var | Source | Current location | Current usage | Target | Exposure | Required for deploy | Required for launch | Review status | Implementation note | Migration note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `apps/village-app` plus smaller Reference Village Apps except `apps/lios` | env / `.env.sample` | backend API base URL used before config can be fetched | deploy-time env, no DB field | public, not secret | yes | yes | accepted | keep in env schema and deployment provisioning docs | keep as env |
| `NEXT_PUBLIC_PLATFORM_URL` | `apps/village-app`, smaller Reference Village Apps by code usage | env | canonical public deployment URL used by pages and metadata | deploy-time env, mirrored by `general.semanticUrl` | public, not secret | yes | yes | accepted | ensure Village App env schema uses this as primary public URL | keep env as deployment source. Treat DB mismatch as launch-readiness issue, not deploy blocker |
| `NEXT_PUBLIC_PLATFORM` | smaller Reference Village Apps except `apps/lios` | env / `.env.sample` | legacy public platform identifier or URL fallback | deploy-time env, no DB field | public, not secret | no | no | proposed | add compatibility only if shared code still references it | prefer `NEXT_PUBLIC_PLATFORM_URL`; review for deprecation |
| `NEXT_PUBLIC_CDN_URL` | `apps/village-app` plus smaller Reference Village Apps except `apps/lios` | env / `.env.sample` | public media/CDN base used by shared features and static media helpers | deploy-time env, target DB field to be decided | public, not secret | no | depends on media usage | proposed | keep as env until media ownership and upload/CDN model are clarified | do not move to Village Brand Kit yet |
| `NEXT_PUBLIC_LOG_REQUESTS` | smaller Reference Village Apps except `apps/lios` | env / `.env.sample` | debug logging toggle for request behavior | deploy-time env, no DB field | public, not secret | no | no | proposed | keep out of DB config; decide whether Village App needs the toggle | operational/debug setting, not Village config |
| `NEXT_PUBLIC_NETWORK` | smaller Reference Village Apps except `apps/lios` | env / `.env.sample` | selects blockchain network | deploy-time env; `web3` may describe per-village token details | public, not secret | depends on web3 | depends on web3 | proposed | keep network selection env-owned unless platform-managed web3 environments are introduced | infrastructure capability, not brand config |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | smaller Reference Village Apps except `apps/lios` | env / `.env.sample` | WalletConnect project identifier | deploy-time env, no DB field | public, not secret | depends on web3 wallet | depends on web3 wallet | accepted | keep as provider/infrastructure key | public but infrastructure-owned |
| `NEXT_PUBLIC_TOKEN_SALE_DATE` | smaller Reference Village Apps except `apps/lios` | env / `.env.sample` | legacy token sale date used by older token sale surfaces | runtime DB config, likely `fundraiser`, `web3`, or token-sale-specific config | public, not secret | no | only if token sale is enabled | needs discussion | locate current runtime usage before creating a field | looks like village/product campaign config, not deploy env |
| `NEXT_PUBLIC_DEFAULT_TIMEZONE` | smaller Reference Village Apps by code usage | env | fallback timezone when backend `general.timeZone` is absent | deploy-time env fallback; launch value belongs in `general.timeZone` | public, not secret | no | yes | accepted | keep env fallback; prefer DB config for launch readiness | DB config should win after config is loaded |
| `NEXT_PUBLIC_FEATURE_CARROTS`, `NEXT_PUBLIC_FEATURE_SUPPORT_US` | smaller Reference Village Apps by code usage | env | Platform Capability Gates for credits/carrot and support-us surfaces | deploy-time env plus `fundraiser.enabled` or relevant feature bucket | public, not secret | no | depends on feature | accepted | keep as capability gates and pair with DB feature config | per-Village enablement belongs in DB config |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | smaller Reference Village Apps by code usage | env | error monitoring DSNs | deploy-time env, no DB field | mixed; private-ish DSN and public client DSN | no | no | proposed | keep Sentry project wiring out of Village DB config | deployment observability, not Village config |
| Public third-party provider keys | shared | env | Firebase, Google Maps, Stripe publishable key, Stripe connected account, WalletConnect, analytics | deploy-time env, no DB field | public, not secret | depends on feature | depends on feature | accepted | keep as provider/infrastructure keys until a platform integration model exists | public but infrastructure-owned; do not treat as Village Brand Kit |

## Build-time DB snapshot

Current prebuild flow fetches backend `/config?limit=500` through `packages/closer/scripts/syncBuildConfig.cjs` and writes `packages/closer/generated/appConfig.snapshot.json`.

| Concern | Source | Current location | Current usage | Target | Exposure | Required for deploy | Required for launch | Review status | Implementation note | Migration note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/config` rows | shared, `apps/village-app`, smaller Reference Village Apps | backend config API | build-time merged config for server-side rendering and initial `ConfigProvider` state through `configCached` / `configKeyed` | build-time DB snapshot, existing config buckets | mostly public to app, no secrets | yes for connected build | yes | proposed | decide required bucket subset after row-level review | inventory which buckets are required vs optional |
| `general` snapshot | shared, `apps/village-app`, smaller Reference Village Apps | backend config API / `configCached.general` | seeds app-wide identity, locale/currency/timezone helpers, footer values, page metadata, and public page titles | build-time DB snapshot, `general` | public, not secret | yes, with defaults | yes | accepted | keep defaulted enough for deploy; require complete values for launch readiness | runtime DB config remains source; snapshot is delivery mechanism |
| `booking` snapshot | `apps/lios` | backend config API / `getCachedConfig('booking')` | homepage uses booking settings for village-specific stay/booking content | build-time DB snapshot, `booking` | public, not secret | no | if booking homepage content is shown | needs discussion | separate booking policy config from homepage content | some current usage may belong in CMS instead of booking config |

## Runtime DB config

Values in this section should be editable per Village through backend config.

| Concern | Source | Current location | Current usage | Target | Exposure | Required for deploy | Required for launch | Review status | Implementation note | Migration note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Village identity | `apps/village-app`, smaller Reference Village Apps | `general` config | public name, app id, canonical URL, contact, timezone | runtime DB config: `general.platformName`, `general.appName`, `general.semanticUrl`, `general.teamEmail`, `general.timeZone` | public, not secret | no | yes | accepted | already in Village App runtime config schema | already documented as Required Brand Config |
| Footer social/contact values | smaller Reference Village Apps | `useConfig()` / `general` | footers read Instagram, Facebook, Telegram, Twitter, and team email variants | runtime DB config: `general.instagramUrl`, `general.facebookUrl`, `general.telegramUrl`, `general.twitterUrl`, `general.teamEmail` | public, not secret | no | yes | accepted | normalize casing through `prepareGeneralConfig` / shared config helpers | Brand Kit field, not CMS page content |
| `FAQS_GOOGLE_SHEET_ID` / `faqsGoogleSheetId` | smaller Reference Village Apps | `useConfig()` / `generalConfig` | resources/home/community pages embed or fetch FAQ content from Google Sheets | runtime DB config or CMS: `general.faqsGoogleSheetId` if retained | public-ish, not secret | no | only if FAQ surface launches | needs discussion | prefer CMS FAQ blocks if Village CMS can replace Sheets | existing usage straddles config and content |
| Feature enablement | shared | config buckets | enables Village-specific modules | runtime DB config: `booking.enabled`, `volunteering.enabled`, `citizenship.enabled`, `learningHub.enabled`, `affiliate.enabled`, `fundraiser.enabled`, and similar fields | public, not secret | no | depends on feature | accepted | keep paired with Platform Capability Gates where present | requires platform capability gate when one exists |
| Support/fundraiser page settings | `apps/moos` | `getCachedConfig('fundraiser')` | controls support-us page availability and credit price display | runtime DB config: `fundraiser.enabled`, `fundraiser.creditPricePerUnit`, related package/campaign fields | public, not secret | no | if support-us launches | proposed | reuse existing fundraiser config bucket; CMS should own surrounding copy | numeric campaign policy/config should not stay hardcoded |
| Resource/legal/history page metadata | smaller Reference Village Apps | `general` config plus page code | uses `general.platformName` for titles and public page names | runtime DB config plus CMS: `general.platformName`; page body in CMS | public, not secret | no | if page launches | proposed | keep identity in `general`; move page body to CMS | avoid one-off config fields for page prose |

## Code-only / CMS-not-config

Values in this section should not become DB config.

| Concern | Source | Current location | Current usage | Target | Exposure | Required for deploy | Required for launch | Review status | Implementation note | Migration note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hardcoded homepages | smaller Reference Village Apps | `pages/index.tsx` | app-specific homepage sections, copy, images, FAQs, community/story content, and CTAs | code-only / CMS-not-config; move content to Village CMS pages | public, not secret | no | yes when published | accepted | map repeatable section needs into CMS section types, not config fields | move content to CMS, not config |
| Hardcoded nested public pages | `apps/earthbound` | `pages/pages/community`, `pages/pages/events`, `pages/pages/invest` | Earthbound-specific public marketing pages | code-only / CMS-not-config; move content to Village CMS pages | public, not secret | no | if those pages launch | accepted | ensure CMS can support custom slugs and section rendering | move content to CMS |
| Public informational pages | `apps/closer`, `apps/foz`, `apps/moos` | `pricing`, `philosophy`, `donate`, `agent`, `history`, `support-us`, `legal/terms` | app-specific editorial, legal, pricing, support, or history pages | code-only / CMS-not-config; move to Village CMS pages or code-only product pages | public, not secret | no | if page launches | needs discussion | split reusable product pages from village-owned editorial pages | do not create DB config blobs for page copy |
| Public image assets | smaller Reference Village Apps | `public/images/*` | logos, backgrounds, hero images, token imagery, icons, and village-specific imagery | code-only / CMS-not-config; move to Village CMS media library or Brand Kit logo fields | public, not secret | no | yes for branded launch | proposed | logos belong in Brand Kit; content images belong in CMS media | static assets should not be copied into generic Village App per deployment |
| Public PDFs | smaller Reference Village Apps | `public/pdf/*` | pitch decks, legal policies, reports, menus, consent forms, private-sale documents | code-only / CMS-not-config; move to Village CMS media/documents or structured legal settings | public, not secret | no | depends on page/legal needs | needs discussion | separate public document publishing from structured legal config | avoid hardcoded PDF paths in generic app |
| App route surface | smaller Reference Village Apps | `pages/**` | shared product routes for booking, stays, events, learning, listings, members, projects, subscriptions, token, volunteer, dashboard, auth, settings | code-only / CMS-not-config, no DB field | public, not secret | yes | depends on enabled modules | accepted | keep route implementation in code; hide/enable via feature config and navigation | product mechanics, not DB config |
| App-local footer/layout components | smaller Reference Village Apps | `components/Footer`, `components/Layout` | per-app footer link/social rendering and app shell composition | code-only / CMS-not-config; footer links in CMS or Brand Kit, shell in code | public, not secret | yes | yes | proposed | move generic shell to shared Village App; make footer content configurable | separate layout mechanics from footer content |
| Route and component behavior | shared | code | determines product behavior | code-only / CMS-not-config, no DB field | public, not secret | yes | yes | accepted | keep in code unless it is genuinely per-Village policy | keep in code unless it is genuinely per-Village policy |

## Rejected migrations

- Secrets must not move to public env or editable DB config.
- Deployment infrastructure values should not be treated as Village Brand Kit fields.
- Bespoke page content should move to Village CMS, not runtime DB config.

## Open questions

- Which config buckets are mandatory for a connected Village Deployment versus only required for launch readiness?
