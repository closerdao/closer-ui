# Village API (Ambassador program)

Villages use the standard Closer base CRUD model route **`/village`** (same pattern as `/project`, `/event`, `/listing`).

Backend: [closer-api#493](https://github.com/closerdao/closer-api/pull/493) (merged), extended by
[closer-api#544](https://github.com/closerdao/closer-api/pull/544) (deploy state on the model) and
[closer-api#556](https://github.com/closerdao/closer-api/pull/556) (the deploy route).

## Base CRUD

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/village` | Create village |
| `GET` | `/village` | List (`?where=…` via `formatSearch`) |
| `GET` | `/village/:idOrSlug` | Read one |
| `PATCH` | `/village/:id` | Update (managers in `managedBy` + creator) |
| `DELETE` | `/village/:id` | Soft-delete when permitted |
| `POST` | `/village/:id/deploy` | Ask procurement to build the village |
| `POST` | `/villages/:id/invite-owner` | Send the founder their first-login invite |

Note the two prefixes: the model routes are singular `/village`, `invite-owner` is plural `/villages`.

## Deploy

`POST /village/:id/deploy`, body `{ notes? }`. Allowed for `admin`, the `team` role, or a member of
the village's `managedBy`. Founders (`createdBy`) are **not** authorized yet — there is a TODO on the
API for when the subscription gate lands, so the UI shows them the deploy card read-only.

The route writes `deployRequest` + `onboardingStatus: deploy_requested`, freezes the slug, and calls
procurement. Every later state is written onto the Village by procurement itself; nothing is marked
by hand.

| Status | Meaning |
|--------|---------|
| `202` + Village | Recorded and handed to procurement |
| `202` + `warning` | Recorded, but procurement did not answer (5xx / timeout). Still `deploy_requested` |
| `403` | Caller may not deploy this village |
| `409` | A deploy is already requested or running |
| `422` | No founder email, or an invalid slug |
| `503` | Procurement is not configured |

A 4xx from procurement is passed through verbatim as `{ error, code }` — surface that text.

## Attribution

```js
{
  name: 'referredBy',
  public: true,
  editable: false,
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null,
}
```

`referredBy` is the referring ambassador (attribution). Access is `managedBy`, the assigned
ambassador. There is no `ambassadorId`.

## Identity

- `slug`: required, unique. 2–40 chars of `[a-z0-9-]`, reserved names refused. Generated from `name`
  on create; admin-editable until the slug freezes, and never editable by anyone else.
  Frozen once `onboardingStatus` is `deploy_requested` or later, or `managed` is true — it is
  procurement's join key with the deployed village.

## Verification & onboarding

- `verificationBadge`: enum `unverified | pending | verified | resonant`, default `unverified`
- `onboardingStatus`: enum, in pipeline order,
  `map_only | pre_assessed | intro_scheduled | subscribed | deploy_requested | deploying | failed | live | suspended`,
  default `map_only`. Closer moves a village up to `deploy_requested`; procurement writes
  `deploying`, `failed`, `live` and `suspended`. `suspended` sits after `live` so a suspended
  village keeps its (frozen) subdomain for reactivation.
- `deploy_requested` and `deploying` cannot be set by hand — the API rejects the PATCH.

## Criteria & project manager

- `criteria`: object with booleans/numbers for Appendix A hard + soft fit
- `projectManager`: `{ name, email, role }`. Its email is the first candidate for the founder
  address the deploy route resolves (`projectManager.email` → `contact.email` → the creator's).

## Deploy state

All of these are pipeline-owned: written by the deploy route or by procurement, never via PATCH.

- `deployRequest`: `{ status, requestedAt, requestedBy, notes, processedAt }`, where `status` is
  `none | requested | completed | failed`. There is no approve/reject step — pressing the CTA is the
  approval, so there is no `processedBy`. `processedAt` is set when procurement picks the request up.
- `deployError`: the last provisioning error message, or null
- `deployedAt`: set when the village reaches `live`
- `managed`: true once procurement owns this village's deployment. An unmanaged village runs Closer
  but predates procurement (e.g. TDF) — its status and URLs are admin-typed.
- `appUrl` / `apiUrl`: procurement-authoritative once `managed`

There is no `platformSubscription` on the Village.

## ACL

`managedBy` (baseFields) must include Ambassador and village owner. Base PATCH routes must authorize managers, not only `createdBy`.
