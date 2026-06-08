# Village App Provisioning Contract

## Purpose

The Village App must be deployable before a Village has public content. Provisioning should distinguish between a deployment that can run and a launch-ready Village.

## Deployable State

A Village Deployment is deployable when the frontend has:

- `NEXT_PUBLIC_API_URL` pointing at the Village backend.
- `NEXT_PUBLIC_PLATFORM_URL` or equivalent deployment domain.
- `NEXT_PUBLIC_DEFAULT_TIMEZONE`, or a backend `general.timeZone` config value.
- Optional CDN/media environment values used by shared Closer features.

The backend may have no homepage content. In that case `/` renders the Coming Soon State and marks it `noindex,nofollow`.

## Launch-Ready State

A Village is launch-ready when it has valid brand configuration and either:

- a published CMS homepage with at least one section, or
- an explicitly accepted Coming Soon State for pre-launch use.

Launch readiness should be an operational check. It should not block frontend deployment.

## Required Brand Config

The backend `general` config should provide:

- `platformName`: public Village name.
- `appName`: stable app identifier.
- `semanticUrl`: canonical public URL or domain.
- `teamEmail`: public contact email.
- `timeZone`: Village timezone.

## Optional Brand Config

The Village App can use these when present:

- `logoHeader`
- `instagramUrl`
- `facebookUrl`
- `twitterUrl`
- `telegramUrl`
- `platformLegalAddress`
- `primaryCtaVisitor`
- `primaryCtaMember`
- `primaryCtaCustomUrl`
- `primaryCtaCustomText`

## Homepage Page Record

The v1 Village App queries the existing `/page` endpoint for:

```json
{
  "slug": "/"
}
```

A launch-ready homepage should include:

- `_id`
- `title`
- `slug`
- `description`
- `ogImage`
- `sections`

`sections` must follow the existing custom page section shape:

```json
{
  "type": "hero",
  "data": {
    "settings": {},
    "content": {}
  }
}
```

Supported section types are defined by `packages/closer/types/page.ts` and rendered by `CustomSectionComponent`.

## Future Contract Shape

After v1, the backend may add an explicit homepage marker such as:

```json
{
  "isHomePage": true
}
```

That should be treated as a v2 contract change. The v1 contract remains slug-based so it can use the existing page API without backend changes.
