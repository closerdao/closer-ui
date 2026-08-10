# Backend: favicon upload endpoint

**Status:** ready for backend
**Depends on:** nothing — the frontend ships first and degrades gracefully
**Frontend:** `packages/closer/components/FaviconUpload.tsx`,
`packages/closer/components/Metatags/AppHead.tsx`, see
`docs/tickets/favicon-upload-ui.md`

## Why

Admins can now set a favicon from `/admin/config` → General. Until this endpoint
exists the UI falls back to `POST /upload/file` and we point `<link rel="icon">`
at a single client-resized 512×512 PNG. That works, but every visitor downloads
a 512px image to draw 16 CSS pixels, Safari gets no `apple-touch-icon` at the
size it wants, and there is no `.ico` for the clients that ask for one.

The fallback stays in place while this ticket is open. When the endpoint answers
anything other than `404`/`405`/`501`, the frontend uses it automatically — no
frontend release needed.

## Endpoint

### `POST /upload/favicon`

`multipart/form-data`, one part named `file`. Admin-only — the caller must hold
the `admin` role, since the result becomes the brand mark of the whole platform.

Accept `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/avif` and
`image/svg+xml`, up to 5 MB. Sniff the actual bytes; do not trust the declared
`Content-Type` or the filename extension.

From the uploaded image, produce a square master (contain, transparent padding,
centred — never stretch) and render these derivatives:

| derivative | format | used for |
| --- | --- | --- |
| `-32.png` | PNG, 32×32 | `rel="icon"`, the tab |
| `-180.png` | PNG, 180×180 | `rel="apple-touch-icon"` |
| `-192.png` | PNG, 192×192 | Android home screen, push notification icon |
| `-512.png` | PNG, 512×512 | PWA / install prompt, and the master we keep |
| `.ico` | ICO containing 16, 32 and 48 | bare `GET /favicon.ico` and old clients |

PNG throughout, not JPEG — the existing photo pipeline emits `.jpg`, which would
flatten transparency onto black and put a square block in the tab. Preserve the
alpha channel. Reuse the photo pipeline's storage and CDN, but keep favicons in
their own prefix so nothing shares the `-post-md.jpg` naming.

Serve derivatives at `<CDN>/favicon/<id>-<size>.png` and `<CDN>/favicon/<id>.ico`
— the frontend builds those URLs from the returned id and never asks for them
individually.

### Response

```json
{
  "results": {
    "_id": "6a1f…",
    "url": "https://cdn.oasa.co/favicon/6a1f…-512.png",
    "sizes": [32, 180, 192, 512],
    "contentType": "image/png"
  }
}
```

`_id` is what the frontend stores in `config.general.favicon`; everything else is
informational. Generate all derivatives **before** returning — the admin
previews the result immediately, and a lazily generated icon shows as a broken
image.

### Errors

JSON body with an `error` string, rendered verbatim to the admin: "That file is
larger than 5 MB" is good, a raw sharp stack trace is not. Use `400` for a
rejected file and `413` for one over the size limit. Reserve `404`/`405`/`501`
for "this endpoint does not exist" — the frontend treats those three as the
signal to fall back to `/upload/file`, so never use them for a bad upload.

## SVG handling

Rasterise SVG input to PNG and store only the PNG. Do not store or serve the
original SVG, and do not add a `rel="icon" type="image/svg+xml"` path later
without a sanitiser in front of it: an SVG is a script-bearing document, and
this one is admin-supplied and served from our CDN origin. When rasterising,
disable external entity and remote resource loading in the renderer so a crafted
SVG cannot make the server fetch a URL of its choosing.

Apply the same limits to the decoder as to the upload: cap decoded pixel
dimensions (a 5 MB PNG can decode to gigabytes) and cap render time, so a
decompression-bomb upload fails as a `400` rather than taking the process down.

## Also worth doing here

`public/sw.js` falls back to `/favicon.ico` for push notification icons, and the
payload's `icon` is backend-controlled. Once favicons exist, send
`<CDN>/favicon/<id>-192.png` in the push payload for communities that have one —
a one-line change where the notification is built, and the notification finally
carries the community's mark instead of Closer's.

## Acceptance criteria

- [ ] An admin uploads a 1600×1600 PNG with transparency and all five
      derivatives exist, square, with alpha intact.
- [ ] A 1600×1200 JPEG produces square derivatives with padding, not a stretched
      or cropped-through-the-subject icon.
- [ ] An SVG upload produces PNG derivatives; no SVG is reachable on the CDN
      afterwards.
- [ ] An SVG referencing an external URL does not cause the server to fetch it.
- [ ] A non-image file renamed `logo.png` is rejected with `400`.
- [ ] A file over 5 MB is rejected with `413` before it is decoded.
- [ ] A non-admin call is rejected.
- [ ] `GET <CDN>/favicon/<id>.ico` returns a valid multi-size ICO.
- [ ] The response returns only after every derivative is retrievable.
