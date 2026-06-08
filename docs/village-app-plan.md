# Village App Plan

## Goal

Ship `apps/village-app` as a deployable, brand-editable Closer instance that can run before homepage content exists.

## V1 Tickets

- [x] Create Village App shell
  - Add `apps/village-app` to workspaces.
  - Keep the app close to the Earthbound shape for v1.
  - Preserve existing Village apps unchanged.
  - Verified with `yarn workspaces info --silent`.
  - Verified with `yarn workspace village-app lint`.

- [x] Replace Earthbound homepage with CMS-or-Coming-Soon
  - Fetch the homepage from the existing `/page` API with `slug: '/'`.
  - Render existing custom page sections when homepage content exists.
  - Render a neutral Coming Soon State when content is missing, empty, or unavailable.
  - Mark the Coming Soon State `noindex,nofollow`.
  - Remove Earthbound homepage copy and media from the Village App homepage.
  - Verified with `../../node_modules/.bin/next lint` from `apps/village-app`.

- [x] Neutralize public branding defaults
  - Replace copied Earthbound footer defaults with neutral/config-derived defaults.
  - Remove Earthbound-specific public metadata and attribution from generic public surfaces.
  - Keep deeper copied route behavior for v1 unless it leaks Earthbound branding.
  - Replaced copied static marketing pages with CMS-backed routes.
  - Verified with `rg "earthbound|Earthbound|EARTHBOUND|Grimsn|Zuzanna|dicte@|earthbound\\.eco|traditionaldreamfactory|©" apps/village-app -n`.
  - Verified with `yarn workspace village-app lint`.

- [ ] Document minimal provisioning contract
  - Define deployable state.
  - Define launch-ready state.
  - List required brand/config fields.
  - List homepage page fields and section expectations.

- [ ] Verify empty deployment path
  - Build or document build blockers with concrete next steps.
  - Start the app locally.
  - Confirm `/` renders Coming Soon without homepage backend data.
  - Confirm existing shared routes still resolve through copied/exported pages.

## V2 Track

- Export shared `_app`, `_error`, Coming Soon, Layout, and Footer from `packages/closer`.
- Build full Village CMS for homepage, navigation, footer, media, and brand kit.
- Add admin readiness UI or a health endpoint.
- Add configurable navigation model and remove app-name branches from shared navigation.
- Formalize homepage lookup with `isHomePage: true` if backend supports it.
- Add seeded starter homepage templates.
- Compare Next App Router, current SSR patterns, and TanStack Start.
- Introduce framework-portable loaders only after the Village App shape is proven.
- Unify duplicated app shells after `village-app` has shipped.
