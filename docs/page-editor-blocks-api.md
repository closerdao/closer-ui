# API ticket: Page & blocks schema (Page Editor / Village CMS)

**Status:** Frontend is live — backend must accept and persist the full schema below.  
**Audience:** Backend / API / Mongoose `Page` model  
**Source of truth (frontend):** `packages/closer/types/page.ts`, `packages/closer/components/PageEditor/blockDefaults.ts`, `packages/closer/constants/dynamicBlockTypes.ts`, `packages/closer/constants/standardPages.ts`, `docs/page-editor-blocks-api.md` (this file)

---

## Summary

Update the `Page` API so the dashboard Page Editor and public standard-page routes can save and load the full block catalog. Prefer a **flexible `data` Mixed/object** on sections (do not reject unknown nested keys). Expand any `type` enum to the full list below. Support **standard pages** (fixed slugs) that are created on first editor save via `POST /page`.

No data migration is required for existing pages; new fields and types are additive.

---

## 1. Endpoints (unchanged paths, updated contracts)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/page` | List / filter pages (`limit`, `where` e.g. `{ slug }`) |
| `GET` | `/page/:id` | Fetch by Mongo ObjectId |
| `POST` | `/page` | Create page (custom pages **and** first save of a standard page) |
| `PUT` | `/page/:id` | Update existing page by ObjectId |
| `DELETE` | `/page/:id` | Delete page (frontend blocks delete for standard slugs) |
| `POST` | `/page/generate` (or existing generate route) | AI generate — returns page-shaped JSON |

Auth for write/generate: users with **PlatformSettings** (RBAC). Public read by slug is used for CMS-rendered URLs.

---

## 2. Page document schema

```ts
{
  _id: ObjectId,                 // server-assigned
  title: string,                 // required
  slug: string,                  // required, unique per tenant; leading "/", no trailing "/"
  description?: string,          // SEO meta description
  ogImage?: string,              // absolute or CDN URL
  sections: PageSection[],       // ordered blocks
  aiMeta?: object,               // opaque; persist if sent
  created?: Date,
  updated?: Date
  // optional server flags (frontend may set/read):
  // isStandard?: boolean  — true when slug ∈ standard set
}
```

### Create / update body (what the editor sends)

```json
{
  "title": "Volunteer",
  "slug": "/volunteer",
  "description": "…",
  "ogImage": "https://…",
  "sections": [
    {
      "_id": "optionalExistingSectionId",
      "type": "hero",
      "data": {
        "settings": {},
        "content": {},
        "background": "transparent"
      }
    }
  ],
  "aiMeta": {}
}
```

**Rules:**

- Strip / ignore client-only `_localId` (never persist).
- Persist section `_id` when present (update-in-place); assign new ids for new sections.
- Do **not** require a strict sub-schema for `data.settings` / `data.content` — use Mixed / nested objects.
- `slug` must remain unique. Standard slugs are locked in the UI but still must validate as `/path` form.
- First save of a standard page: client `POST`s without a real `_id` (virtual id `std:/volunteer` is **client-only** — never send `std:` to the API as `_id`).

### List / get response

Return the same fields. Frontend merges missing standard slugs with offline defaults when no DB row exists.

---

## 3. Section envelope

```ts
type PageSection = {
  _id?: string;           // Mongo id when persisted
  type: SectionType;      // see enum below
  data: {
    settings?: Record<string, unknown>;
    content?: Record<string, unknown>;
    background?: SectionBackground;  // optional; ignored for dynamic block types in UI
  };
};

type SectionBackground =
  | 'transparent'
  | 'white'
  | 'neutral-light'
  | 'accent-light'
  | 'gray-50'
  | 'gradient-accent'
  | 'dark';
```

**Minimum validation:** `type` non-empty string; `data` object; if present, `settings` and `content` are objects (not arrays/primitives).

---

## 4. Complete `SectionType` enum

Allow **all** of these as `sections[].type` (rejecting unknown types breaks the editor):

### Layout / content

`hero` · `gallery` · `testimonials` · `stats` · `features` · `timeline` · `collapsibleFaq` · `richText` · `cta` · `media` · `textBlock`

### Stay / booking

`bookAStay` · `staySearch` *(alias — frontend may store as `bookAStay`)* · `listingsPreviews` · `reviews`

### Events

`upcomingEvents` · `pastEvents` · `events` *(alias of upcoming)* · `eventsCalendar`

### Token / citizenship / cohousing / volunteer / subscriptions

`tokenStats` · `floatingBuyTokens` · `supplyGraph` · `priceHistory` · `webinar` · `citizenProgressBar` · `financedTokensStart` · `cohousingApplication` · `volunteerCta` · `dailyContribution` · `subscriptionPlans`

### Fundraiser

`fundraiser` · `fundraiserProgress` · `fundraiserMilestones` · `fundraiserRewards`

### Team

`teamStructure` · `teamMembers` · `teamDepartments` · `teamPartners` · `teamGovernance` · `teamJoinCta`

### Press

`pressStats` · `pressPublications` · `pressHighlights` · `pressPodcasts` · `pressContact`

### Data room

`dataroom`

**Recommendation:** store `type` as free string (or open enum). Prefer not hard-rejecting unknown types so the frontend can ship blocks without a backend deploy.

---

## 5. Dynamic vs content blocks

These types are treated as **dynamic** in the UI (no section background chrome). Many still store editable `content` chrome; others use empty `content` and pull live data from existing APIs/config.

| Live / mostly empty `content` | Editable content (+ optional live) |
|-------------------------------|--------------------------------------|
| `upcomingEvents`, `events`, `reviews`, `supplyGraph`, `priceHistory`, `subscriptionPlans`, `fundraiserProgress`, `fundraiserMilestones`, `fundraiserRewards` | layout blocks + team/press + CTAs + `fundraiser`, `tokenStats`, `dailyContribution`, etc. |
| `webinar`, `eventsCalendar` (settings only) | |

Backend does **not** need new endpoints for dynamic blocks — they reuse existing booking/events/token/fundraiser/subscriptions APIs. Persist whatever `data` the editor sends.

---

## 6. Per-block `data` schemas

Convention: `data.settings` = layout/behavior; `data.content` = copy/media/lists. All string fields may be plain text, HTML (where noted), or i18n tokens (`_i18n_<key>` — see §8).

### `hero`

```json
{
  "settings": {
    "alignText": "center",
    "isInverted": false,
    "isCompact": false
  },
  "content": {
    "title": "",
    "body": "",
    "eyebrow": "",
    "imageUrl": "",
    "videoEmbedId": "",
    "mobileVideoUrl": "",
    "cta": { "text": "", "url": "" },
    "secondaryCta": { "text": "", "url": "" }
  }
}
```

`alignText`: `bottom-left` | `bottom-right` | `top-left` | `top-right` | `left` | `right` | `center`

### `gallery`

```json
{
  "settings": { "size": "standard" },
  "content": {
    "title": "",
    "items": [{ "imageUrl": "", "width": 800, "height": 600, "alt": "" }]
  }
}
```

`size`: `standard` | `large` | `featured`  
Deprecated (ignore): `settings.isRandomized`

### `testimonials`

```json
{
  "settings": {},
  "content": {
    "eyebrow": "",
    "title": "",
    "items": [{ "quote": "", "name": "", "role": "", "avatar": "" }]
  }
}
```

### `stats`

```json
{
  "settings": {},
  "content": {
    "eyebrow": "",
    "title": "",
    "items": [{ "value": "", "label": "" }]
  }
}
```

### `features`

```json
{
  "settings": {
    "numColumns": 3,
    "isSmallImage": true,
    "isColorful": false,
    "hasBorder": false
  },
  "content": {
    "title": "",
    "description": "",
    "items": [{
      "title": "",
      "text": "<p>HTML</p>",
      "imageUrl": "",
      "visualType": "none",
      "iconId": "home",
      "emoji": "",
      "price": "",
      "cta": { "text": "", "url": "" }
    }]
  }
}
```

`visualType`: `photo` | `icon` | `emoji` | `none`  
`iconId` (when icon): `home` | `users` | `leaf` | `calendar` | `star` | `shield` | `heart` | `zap` | `sun` | `mapPin` | `wifi` | `utensils` | `sparkles`

### `timeline`

```json
{
  "settings": {},
  "content": {
    "title": "",
    "description": "",
    "items": [{
      "phase": "01",
      "title": "",
      "text": "<p>HTML</p>",
      "status": "upcoming"
    }]
  }
}
```

`status`: `current` | `upcoming` | `future` | `done`

### `collapsibleFaq`

```json
{
  "settings": {},
  "content": {
    "title": "",
    "description": "",
    "items": [{ "title": "Question?", "text": "Answer" }]
  }
}
```

### `richText`

```json
{
  "settings": { "isColorful": false },
  "content": { "html": "<p>…</p>" }
}
```

### `media`

```json
{
  "settings": { "mediaType": "image" },
  "content": {
    "imageUrl": "",
    "videoEmbedId": "",
    "alt": "",
    "caption": ""
  }
}
```

`mediaType`: `image` | `video`

### `textBlock`

```json
{
  "settings": { "imagePosition": "left" },
  "content": {
    "title": "",
    "body": "plain text with **markdown-ish** markers",
    "imageUrl": "",
    "imageAlt": ""
  }
}
```

`imagePosition`: `left` | `right` | `none`

### `cta`

```json
{
  "settings": { "style": "default" },
  "content": {
    "eyebrow": "",
    "title": "",
    "text": "",
    "primaryText": "",
    "primaryLink": "",
    "secondaryText": "",
    "secondaryLink": ""
  }
}
```

`style`: `default` | `accent` | `dark`

### `bookAStay` / `staySearch`

```json
{
  "settings": {},
  "content": { "title": "", "subtitle": "" }
}
```

### `listingsPreviews`

```json
{ "settings": {}, "content": { "title": "" } }
```

### `reviews` · `subscriptionPlans` · `supplyGraph` · `priceHistory` · `fundraiserProgress` · `fundraiserMilestones` · `fundraiserRewards`

```json
{ "settings": {}, "content": {} }
```

### `upcomingEvents` / `events`

```json
{ "settings": {}, "content": {} }
```

### `pastEvents`

```json
{ "settings": {}, "content": { "title": "" } }
```

### `eventsCalendar`

```json
{
  "settings": {
    "showCreateCta": true,
    "upcomingLimit": 100,
    "pastLimit": 50
  },
  "content": {}
}
```

### `fundraiser`

```json
{
  "settings": { "showTitle": true },
  "content": {
    "eyebrow": "",
    "title": "",
    "description": "",
    "ctaText": "",
    "ctaLink": "/fundraiser"
  }
}
```

### `tokenStats`

```json
{
  "settings": { "showCta": true },
  "content": {
    "eyebrow": "",
    "title": "",
    "description": "",
    "ctaText": "",
    "ctaLink": "/token/before-you-begin"
  }
}
```

### `floatingBuyTokens`

```json
{
  "settings": {},
  "content": { "title": "", "ctaText": "" }
}
```

### `webinar`

```json
{
  "settings": {
    "tags": ["landing-page", "investor-webinar"],
    "analyticsCategory": "CustomPage"
  },
  "content": {}
}
```

### `citizenProgressBar`

```json
{
  "settings": { "citizenTarget": 300 },
  "content": { "title": "" }
}
```

### `financedTokensStart`

```json
{
  "settings": {},
  "content": {
    "title": "",
    "description": "",
    "items": ["string", "string"],
    "ctaText": "",
    "ctaLink": "/token/finance"
  }
}
```

### `cohousingApplication` · `volunteerCta`

```json
{
  "settings": {},
  "content": {
    "title": "",
    "description": "",
    "ctaText": "",
    "ctaLink": ""
  }
}
```

### `dailyContribution`

```json
{
  "settings": {
    "bookingContext": "volunteer",
    "showAccommodation": true
  },
  "content": {
    "title": "",
    "description": "",
    "foodLabel": "",
    "utilitiesLabel": "",
    "accommodationLabel": "",
    "totalLabel": "",
    "freeLabel": "",
    "perDayLabel": "",
    "selectionLabel": ""
  }
}
```

### `teamStructure`

```json
{
  "settings": {},
  "content": {
    "items": [{ "icon": "landmark", "title": "", "description": "" }]
  }
}
```

### `teamMembers`

```json
{
  "settings": {},
  "content": {
    "eyebrow": "",
    "title": "",
    "description": "",
    "members": [{
      "name": "",
      "role": "",
      "bio": "",
      "imageUrl": "",
      "twitterUrl": "",
      "linkedinUrl": ""
    }]
  }
}
```

### `teamDepartments`

```json
{
  "settings": {},
  "content": {
    "eyebrow": "",
    "title": "",
    "description": "",
    "departments": [{
      "title": "",
      "subtitle": "",
      "description": "",
      "members": [{ "name": "", "role": "", "isOpen": false }]
    }]
  }
}
```

### `teamPartners`

```json
{
  "settings": {},
  "content": {
    "eyebrow": "",
    "title": "",
    "description": "",
    "partners": [{ "name": "", "role": "" }]
  }
}
```

### `teamGovernance`

```json
{
  "settings": {},
  "content": {
    "eyebrow": "",
    "title": "",
    "description": "",
    "items": [{ "title": "", "description": "" }],
    "governsTitle": "",
    "governsItems": ["string"]
  }
}
```

### `teamJoinCta`

```json
{
  "settings": {},
  "content": {
    "title": "",
    "description": "",
    "primaryText": "",
    "primaryLink": "",
    "secondaryText": "",
    "secondaryLink": ""
  }
}
```

### `pressStats`

```json
{
  "settings": {},
  "content": { "items": [{ "value": "", "label": "" }] }
}
```

### `pressPublications`

```json
{
  "settings": {},
  "content": {
    "eyebrow": "",
    "items": [{ "name": "" }]
  }
}
```

### `pressHighlights`

```json
{
  "settings": {},
  "content": {
    "eyebrow": "",
    "items": [{ "outlet": "", "date": "", "title": "", "url": "" }]
  }
}
```

### `pressPodcasts`

```json
{
  "settings": {},
  "content": {
    "eyebrow": "",
    "description": "",
    "items": [{
      "title": "",
      "date": "",
      "duration": "",
      "host": "",
      "speaker": "",
      "url": ""
    }]
  }
}
```

### `pressContact`

```json
{
  "settings": {},
  "content": {
    "title": "",
    "description": "",
    "email": ""
  }
}
```

### `dataroom`

Full investor data-room experience (email gate, loan terms, legal structure, financial tables, team, documents, webinar, CTA). Editable chrome:

```json
{
  "settings": {},
  "content": {
    "heroEyebrow": "",
    "heroTitle": "",
    "heroDescription": "",
    "stats": [{ "value": "€450K", "label": "" }],
    "loanTerms": [{ "value": "€450K", "label": "" }],
    "documents": [{ "title": "", "href": "", "downloadLabel": "" }],
    "partners": [{ "name": "", "role": "" }],
    "webinarTags": ["dataroom", "investor-webinar"],
    "webinarAnalyticsCategory": "Dataroom"
  }
}
```

---

## 7. Standard pages

Fixed product landings edited in Page Editor and served at their public URLs (coded UIs remain under `/legacy/:page`).

| Slug | Feature gate (frontend) |
|------|-------------------------|
| `/volunteer` | volunteering env + config |
| `/cohousing` | cohousing config |
| `/events` | events config |
| `/stay` | booking env + config |
| `/token` | token sale env |
| `/subscriptions` | subscriptions env + config |
| `/citizenship` | citizenship env + config |
| `/fundraiser` | support-us env + fundraiser config |
| `/team` | always on |
| `/press` | always on |
| `/dataroom` | always on (TDF route) |

TDF marketing landings (`/abela-art-faire`, `/artists`, `/learn-more`, `/impact-map`, `/webinar`, `/roadmap`, `/pages/restaurant`, `/pages/regenerative-agriculture`, `/how-to-build-a-regenerative-village`) are **coded pages**, not standards. CMS-shaped seeds live under `docs/static-pages/`.

**Backend expectations:**

1. Allow `POST /page` with these slugs (create override).
2. Enforce **unique slug**; updating a standard page uses `PUT /page/:id` after create.
3. Prefer **not** deleting by slug restriction server-side unless desired; frontend already prevents delete and uses delete only for “reset to default”.
4. Query by slug: `GET /page?where={"slug":"/volunteer"}&limit=1` must work (same as custom pages).
5. Optional: mark `isStandard: true` when slug ∈ set above (frontend also derives this).

Client-only virtual ids (`std:/volunteer`) are **never** sent as Mongo `_id`.

---

## 8. i18n string protocol

String fields (including nested) may store:

- Plain text / HTML, or
- Whole-value token: `_i18n_<next-intl-key>` (e.g. `_i18n_volunteers_page_title`)
- Inline tokens inside a string: `… _i18n_some_key …`

Backend should **persist tokens as opaque strings**. Resolution happens on the client. Do not strip the `_i18n_` prefix.

---

## 9. Backend action checklist

1. **Expand / open `sections.type`** to accept the full enum in §4 (or store free string).
2. **Keep `sections[].data` Mixed** — nested `settings` / `content` / `background` with arbitrary nested arrays/objects.
3. **Persist** `title`, `slug`, `description`, `ogImage`, `sections`, `aiMeta`.
4. **Create on POST** for first standard-page save (slug uniqueness only).
5. **Do not require** new micro-endpoints for dynamic blocks.
6. **Surface Mongoose validation errors** as clear messages (editor parses `Page validation failed: …`).
7. **No migration** — existing documents remain valid; unused legacy gallery fields can be ignored.

---

## 10. Acceptance tests

- [ ] `POST /page` with `type: "teamMembers"` (and nested `members`) round-trips unchanged.
- [ ] `POST /page` with `type: "timeline"` / `collapsibleFaq` / `dailyContribution` / `eventsCalendar` succeeds.
- [ ] `POST /page` with `slug: "/volunteer"` then `GET /page?where={slug:"/volunteer"}` returns it.
- [ ] `PUT /page/:id` updating `sections` order and nested list items persists.
- [ ] Rejecting unknown nested keys does **not** strip `content` fields the editor sends.
- [ ] Saving a page whose strings contain `_i18n_foo` returns `_i18n_foo` on read.

---

## 11. Out of scope

- Computing live fundraiser/token/event data inside the Page model.
- Server-side i18n resolution of `_i18n_` tokens.
- Routing `/legacy/*` (frontend-only).
- Changing RBAC role names (still PlatformSettings for editor writes).
