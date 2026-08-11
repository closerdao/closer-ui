# TDF static pages (Page model JSON)

Compiled snapshots of TDF-only marketing pages into the Village CMS `Page` document shape (`title`, `slug`, `description`, `ogImage`, `sections[]`).

These are **seed / migration artifacts** only — they are **not** registered as standard pages in the Page Editor. Live TDF routes use coded React pages (with `/legacy/*` mirrors of the same implementations).

## Live as standard CMS pages

`/volunteer`, `/stay`, `/token`, `/subscriptions`, `/events`, `/citizenship`, `/fundraiser`, `/team`, `/press`, `/dataroom`

Coded originals (where applicable) live under `/legacy/*` on TDF.

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
