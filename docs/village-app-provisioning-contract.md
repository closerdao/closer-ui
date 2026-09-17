# Village App Provisioning Contract

## Purpose

The Village App must be deployable before a Village has public content. Provisioning should distinguish between a deployment that can run and a launch-ready Village.

## Deployable State

A Village Deployment is deployable when the frontend has:

- `NEXT_PUBLIC_APP_NAME` set to the Village slug. **Required, no default.**
- `NEXT_PUBLIC_API_URL` pointing at the Village backend.
- `NEXT_PUBLIC_PLATFORM_URL` or equivalent deployment domain.
- `NEXT_PUBLIC_DEFAULT_TIMEZONE`, or a backend `general.timeZone` config value.
- Optional CDN/media environment values used by shared Closer features.
- `NEXT_PUBLIC_POSTHOG_ENABLED=true` to opt the deployment into the shared
  Closer PostHog project (defaults to `false`; the public project key is baked
  into `packages/closer/utils/posthog.ts`, `NEXT_PUBLIC_POSTHOG_KEY` /
  `NEXT_PUBLIC_POSTHOG_HOST` override it).

The backend may have no homepage content. In that case `/` renders the Coming Soon State and marks it `noindex,nofollow`.

The app-level env contract is enforced with `@t3-oss/env-nextjs` and exported
from `apps/village-app/env.js` as `villageAppEnvSchema`. The same module exports
the required, optional, and defaulted provisioning key lists for future CI drift
checks and SDK sharing.

### `NEXT_PUBLIC_APP_NAME` is a hard build gate

`createEnv` runs without `skipValidation`, so a missing or empty
`NEXT_PUBLIC_APP_NAME` fails `next build` outright — it is not a warning and
there is no fall-through default. (There deliberately isn't one: the only other
source of `APP_NAME` is the shared config default `general.appName`, which is
`'tdf'`, so a defaulted Village would identify as TDF and switch on TDF-only
feature branches.)

Consequence for Villages provisioned before procurement#548 started supplying
the variable: their **next redeploy fails at build time**, and the deployment
platform keeps serving the last successful build. The Village stays up on stale
output — it does not go down — but no change ships until the variable is added
to the deployment's environment. Backfill `NEXT_PUBLIC_APP_NAME` on those
projects before redeploying them.

Because `@t3-oss/env-core` re-validates the client schema in the browser,
`experimental__runtimeEnv` must list every `NEXT_PUBLIC_` key explicitly as
`KEY: process.env.KEY`. Next.js only inlines member expressions, so a bare
`process.env` becomes `{}` client-side and validation throws during hydration.
`packages/closer/scripts/__tests__/villageAppRuntimeEnv.test.js` guards this.

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

The app-level runtime config contract is exported from
`apps/village-app/config.js` as `villageRuntimeConfigSchema`. It describes the
minimal config shape expected by the Village App, including defaultable
`general` fields and optional feature config buckets.

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

## Copy and Locale Bundles

Villages render `packages/closer/generated/locales/village/en.json`, which is
pure `locales/base-en.json` — there is no `locales/village/` overlay, on
purpose. Any message key a shared component renders must therefore exist in
`base-en.json` with brand-neutral wording; a key that lives only in an app
overlay renders as its raw key path for every other app, silently.
`packages/closer/scripts/__tests__/localeParity.test.js` asserts that every
generated English bundle covers the Closer bundle's key set.

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
