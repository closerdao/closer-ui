# UI: admin uploads a favicon from any image

**Status:** built — see "What shipped" at the bottom
**Depends on:** nothing — ships and works on its own, upgrades automatically when
`docs/tickets/favicon-upload-api.md` lands
**Touches:** `packages/closer/config.ts`, `packages/closer/components/FaviconUpload.tsx` (new),
`packages/closer/components/Metatags/FaviconLinks.tsx` (new),
`packages/closer/components/Metatags/AppHead.tsx`, `apps/*/pages/_app.tsx`,
`packages/closer/pages/admin/config.tsx`,
`packages/closer/scripts/data/configAdminLabelTranslations.json`, `locales/base-{en,pt}.json`

## Why

Every provisioned community ships the Closer favicon, because the only way to
change it today is to commit a new `apps/<app>/public/favicon.ico` file. Admins
can already upload their header logo from `/admin/config` → General
(`logoHeader`, `type: 'image'`), so the tab icon is the last piece of branding
that needs a developer.

The requirement is "from any image": the admin drops in whatever they have — a
1600×1600 PNG, a JPEG screenshot, an SVG — and gets a correct favicon out. The
browser wants a small square icon, so the size and format work has to happen for
them, not be a checklist they're asked to satisfy.

## Approach

Store **one string** on the `general` config, key `favicon`. Two shapes are
valid and `AppHead` tells them apart the same way it already tells apart
`LOGO_HEADER`:

| stored value | meaning | rendered as |
| --- | --- | --- |
| starts with `http` or `/` | a single uploaded file (fallback path) | one `<link rel="icon">` |
| anything else | a favicon id from `POST /upload/favicon` | the full size set, see below |

That is what makes this ticket shippable before the backend one: the upload
tries `POST /upload/favicon` first, and on `404`/`405`/`501` falls back to the
existing `POST /upload/file`, which returns a plain URL. Nothing breaks while
the backend ticket is open, and no frontend release is needed when it lands.

Before either upload, the browser normalises the image: draw it onto a
512×512 canvas (contain, transparent padding, centred) and export PNG. This
means the fallback path already serves a small square transparent PNG rather
than the admin's 4 MB photo, and it rasterises SVG uploads client-side so we
never put an author-supplied SVG behind a `<link rel="icon">` — see Security.

## 1. Config schema

`packages/closer/config.ts`, in the `general` block right after `logoHeader`:

```ts
favicon: {
  type: 'image',
  default: '',
},
```

Adding a config key requires a label. Add `favicon` to both the `en` and `pt`
maps in `packages/closer/scripts/data/configAdminLabelTranslations.json`
("Favicon" / "Favicon") and re-run `node scripts/applyConfigAdminLabels.cjs` —
the script exits `1` on a key with no translation, so skipping this breaks the
build.

## 2. `FaviconUpload` component

`ConfigImageUpload` is close but wrong for this field: it previews at
`max-h-20`, which tells the admin nothing about how the icon reads at 16px, and
it uploads the raw file. Add a sibling component rather than adding a `variant`
prop — the dropzone is the only shared part and it is six lines.

- `accept: 'image/png, image/jpeg, image/webp, image/gif, image/svg+xml, image/avif'`,
  `multiple: false`.
- Reject files over 5 MB before upload with a readable message.
- Normalise to a 512×512 PNG via canvas as described above. Non-square input is
  padded, never stretched — and show a note when we padded, so the admin knows
  why there is space around their logo.
- `POST` the resulting `Blob` as `file` to `/upload/favicon`; on `404`/`405`/`501`
  retry against `UPLOAD_FILE_PATH`. Store `results._id` from the first,
  `results.url` from the second.
- Preview as a **mock browser tab**: a rounded tab shape with the icon at 16×16
  and the platform name beside it. This is the whole point of the field — the
  admin should see the thing they are actually buying at the size it renders.
  Show a 32×32 preview next to it for the retina case.
- Remove button clears the value back to `''` (reuse `config_remove_image`).

## 3. Rendering

**`AppHead` is not mounted anywhere.** Every app renders its own `<Head>` in
`apps/<app>/pages/_app.tsx`, so editing `AppHead` alone changes nothing that a
visitor sees. The icon links go in a small `FaviconLinks` component that renders
its own `<Head>` (Next merges instances and dedupes by `key`), mounted next to
each app's existing head block:

```tsx
<FaviconLinks favicon={config?.FAVICON} />
```

`AppHead` still hardcodes `/favicon.ico` and then, when `LOGO_HEADER` is set,
points `rel="icon"` and `rel="apple-touch-icon"` at the header logo. That is
wrong twice over — a wide header logo is unreadable at 16px, and it overrides a
correct `favicon.ico` with it. It delegates to `FaviconLinks` instead.

The URL shapes `FaviconLinks` renders:

- No `FAVICON` → keep exactly today's behaviour minus the `LOGO_HEADER` icon
  links: `<link rel="shortcut icon" href="/favicon.ico" />` only.
- `FAVICON` is a URL → that URL as `rel="icon" type="image/png"` plus
  `rel="apple-touch-icon"`, with the static `.ico` kept as the ahead-of-it
  fallback line.
- `FAVICON` is an id → emit `rel="icon" sizes="32x32"` → `${faviconBase}-32.png`,
  `sizes="192x192"` → `-192.png`, `rel="apple-touch-icon"` → `-180.png`, and
  `rel="icon" href="${faviconBase}.ico"` for anything that ignores the PNG links.
- Stop using `LOGO_HEADER` for `rel="icon"` / `rel="apple-touch-icon"` entirely.
  Keep it for `og:image`, which is the one place a wide logo is right.

Leave the per-app `public/favicon.ico` in place. It stays the answer for the
bare `GET /favicon.ico` that browsers issue before parsing any HTML, and it is
what an unconfigured community keeps showing.

## 4. Propagation delay

`useConfig()` reads `generated/appConfig.snapshot.json`, which is fetched at
build time — so a saved favicon reaches visitors on the next rebuild, the same
as the header logo, and the existing
`admin_platform_changes_production_delay` note on the config page already says
so. Do not try to make this live; the preview in the admin UI updates
immediately, which is what the admin is actually checking.

## Security

Never render an admin-supplied SVG through `<link rel="icon">` or an `<img>` we
control the origin of. SVG is executable, and a stored XSS through a config
field is exactly what f87caec9 just fixed for HTML blocks. Rasterising to PNG in
the canvas step removes the question — an SVG drawn into a canvas cannot run its
scripts, and what leaves the browser is a PNG. The backend ticket repeats this
requirement server-side, since the client check is a convenience, not a control.

## i18n

New keys in `base-en.json` and `base-pt.json`:
`config_favicon_preview_label`, `config_favicon_hint` ("Square PNG works best —
we'll resize whatever you upload"), `config_favicon_padded_notice`,
`config_favicon_too_large`, `config_favicon_invalid_type`.

## Acceptance criteria

- [x] An admin can upload a PNG, a JPEG and an SVG in `/admin/config` → General →
      Favicon, and each one produces a visible tab icon after the next build.
- [x] A 1600×1200 non-square upload is padded to a square, not stretched, and the
      admin is told it was padded.
- [x] The preview shows the icon at 16×16 in a tab mock, not as a large image.
- [x] A file over 5 MB and a non-image file are both rejected with a readable
      message and no request sent.
- [x] With `/upload/favicon` absent, upload still succeeds via `/upload/file` and
      the icon renders.
- [x] With `/upload/favicon` present, the stored value is an id and the app emits
      the 32/180/192/`.ico` links.
- [x] Clearing the field returns the app to the static `/favicon.ico`.
- [x] A community that never sets a favicon renders exactly what it renders today.
- [x] No `<link rel="icon">` anywhere points at `LOGO_HEADER`.

## What shipped

Two things differed from the plan above, both found while building:

1. **`AppHead` is dead code** — nothing renders it, and each app's `_app.tsx`
   owns its `<Head>`. The icon links moved to `FaviconLinks`, mounted in all
   seven apps that have an `_app.tsx` (`apps/foz` has none). `AppHead` was
   updated too and now delegates, so it is correct if it is ever mounted.
2. **`apps/closer` pointed its icon links at `/images/closer-logo-icon.png`,
   which does not exist** — the dev server returns 404 for it. Those two lines
   were removed; the app already fell back to its `public/favicon.ico`.

`NEXT_PUBLIC_CDN_URL` ends in `/photo/`, so `getFaviconCdnBase` swaps that last
segment for `/favicon/` rather than requiring a second env var per deployment.

Verified: the emitted `<link>` tags for all three config states (unset, URL, id)
against a running dev server; the canvas normalisation in a real browser
(1600×1200 → 512×512 PNG, transparent corners, aspect preserved; 300×100 SVG →
512×512 PNG); and the validation, preview, padded-notice, remove and
upload-fallback paths in `components/FaviconUpload.test.tsx`,
`utils/__tests__/favicon.test.ts` and `utils/__tests__/faviconUpload.test.ts`.

Not verified end-to-end: the admin config page itself, which needs an admin
session against the API. The field is wired the same way `logoHeader` is.
