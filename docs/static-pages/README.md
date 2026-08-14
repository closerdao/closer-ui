# TDF static pages (Page model JSON)

Compiled snapshots of TDF-only marketing pages into the Village CMS `Page` document shape (`title`, `slug`, `description`, `ogImage`, `sections[]`).

These are **seed / migration artifacts** only — with the exception noted below they are **not** registered as standard pages in the Page Editor. Live TDF routes use coded React pages (with `/legacy/*` mirrors of the same implementations).

## Live as standard CMS pages

`/`, `/volunteer`, `/projects`, `/stay`, `/token`, `/subscriptions`, `/events`, `/citizenship`, `/fundraiser`, `/team`, `/press`, `/dataroom`

Coded originals (where applicable) live under `/legacy/*` on TDF.

## Home page (`/`)

`/` is a standard page, so every platform gets an editable landing page. Its
shipped default (`constants/standardPages.defaults.json`) is a generic welcome
page, and `packages/closer/pages/index.tsx` renders it — falling back to a coded
"Welcome to &lt;platform&gt;" hero when the page has no sections. The editor
reaches it at `/dashboard/pages/home`, since `/` leaves no route segment.

TDF now serves `/` from the CMS like any other standard page
(`apps/tdf/pages/index.tsx` re-exports `HomePage`), and the coded original lives
at `/legacy/home`.

> **Seed `home.json` before deploying TDF.** The shipped default for `/` is the
> generic welcome page, not TDF's landing page — standard page defaults are
> shared across brands and there is no per-app override. Until a `/` page exists
> in TDF's database, `traditionaldreamfactory.com` renders the generic welcome
> page. Create the Home page in the editor and paste `home.json` into the custom
> JSON field to restore the real landing page.

## Static / coded TDF marketing pages

| Route | Seed file | Live implementation |
|-------|-----------|---------------------|
| `/abela-art-faire` | `abela-art-faire.json` | Coded (`apps/tdf/pages/…` + `/legacy/…`) |
| `/how-to-build-a-regenerative-village` | `how-to-build-a-regenerative-village.json` | Coded |
| `/artists` | `artists.json` | Coded index; `[slug]` stays coded |
| `/learn-more` | `learn-more.json` | Coded |
| `/impact-map` | `impact-map.json` | Coded |
| `/webinar` | `webinar.json` | Coded |
| `/roadmap` | `roadmap.json` | TDF coded village roadmap; Closer keeps its own coded platform roadmap |
| `/pages/restaurant` | `restaurant.json` | Coded |
| `/pages/regenerative-agriculture` | `regenerative-agriculture.json` | Coded |

## Still coded / next candidates

| Route | Notes |
|-------|--------|
| `/pages/ecology` | Dense species / eDNA content — needs custom block or richer seed |
| `/artists/[slug]` | Detail pages stay coded |

String values may use `_i18n_<key>` tokens (resolved client-side from TDF locale dictionaries).
