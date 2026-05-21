# Page editor blocks: schema notes for backend

Brief reference so the API/Mongoose page model stays aligned with the dashboard page editor (`/dashboard/pages/:id`).

## Section envelope

Each entry in `page.sections`:

```json
{
  "type": "hero",
  "data": {
    "settings": {},
    "content": {},
    "background": "transparent"
  }
}
```

- **`type`** — block identifier (string).
- **`data.settings`** — layout/behavior flags (object, may be empty).
- **`data.content`** — editable content (object, may be empty).
- **`data.background`** — optional section background token: `transparent` | `white` | `neutral-light` | `accent-light` | `gray-50` | `gradient-accent` | `dark`.

Frontend strips `_localId` before save; persisted sections may include `_id`.

## Supported `type` values

### Layout blocks

| type | Notes |
|------|--------|
| `hero` | Hero with image/video and overlay text |
| `gallery` | Image mosaic |
| `testimonials` | Quote grid |
| `stats` | Metric grid |
| `features` | Feature grid |
| `richText` | HTML body |
| `cta` | Call to action |
| `media` | **New.** Full-width image or video |
| `textBlock` | **New.** Plain text with optional side photo |
| `staySearch` | **New.** Stay search bar (no server-side logic) |

### Closer blocks (feature-flagged in editor)

`events`, `fundraiser`, `tokenStats`, `webinar`

## Schema changes in this iteration

### Gallery (`type: gallery`)

**Removed from editor (deprecated, ignore if present):**

- `data.settings.isRandomized`

**Added / preferred:**

- `data.settings.size`: `'standard' | 'large' | 'featured'`
  - `standard` — uniform tiles
  - `large` — taller uniform tiles
  - `featured` — first and last tiles oversized when more than 4 images

**Backward compatible:**

- `data.content.items[].width` / `height` may still exist on old pages; frontend no longer edits them.

### Features (`type: features`)

Per `data.content.items[]`:

| Field | Type | Notes |
|-------|------|--------|
| `title` | string | |
| `text` | string | HTML snippet |
| `imageUrl` | string | Used when `visualType` is `photo` |
| `visualType` | `'photo' \| 'icon' \| 'emoji' \| 'none'` | **New.** Optional; inferred as `photo` when `imageUrl` is set |
| `iconId` | string | **New.** One of curated icon keys (e.g. `home`, `users`, `leaf`) |
| `emoji` | string | **New.** Short emoji string |

### Media (`type: media`) — new

```json
{
  "settings": { "mediaType": "image" },
  "content": {
    "imageUrl": "https://…",
    "videoEmbedId": "",
    "alt": "",
    "caption": ""
  }
}
```

`mediaType`: `'image' | 'video'`. When `video`, `content.videoEmbedId` is YouTube embed ID.

### Text block (`type: textBlock`) — new

```json
{
  "settings": { "imagePosition": "left" },
  "content": {
    "title": "",
    "body": "Plain text with - lists and **bold**",
    "imageUrl": "",
    "imageAlt": ""
  }
}
```

`imagePosition`: `'left' | 'right' | 'none'`. Body is plain text (not HTML); formatted client-side.

### Stay search (`type: staySearch`) — new

```json
{
  "settings": {},
  "content": {
    "title": "",
    "subtitle": ""
  }
}
```

No backend endpoints required. Renderer uses platform `booking` config and navigates to `/stay/create` with query params; search uses existing `POST /stays/search`.

## Backend action items

1. **Allow new `type` enum values** on the page section schema: `media`, `textBlock`, `staySearch`.
2. **Keep `data` flexible** (Mixed/object) so new `settings`/`content` fields persist without strict sub-schemas, or extend sub-schemas additively.
3. **No migration required** — old gallery/features documents remain valid.
4. **Optional cleanup** — `isRandomized` and per-image W/H can be ignored on read.

## Save endpoint

Unchanged: `PUT /page/:id` (via `platform.page.put`) with `{ title, slug, description, ogImage, sections }`.

Validation errors from Mongoose are surfaced in the editor via `formatPageSaveError`.
