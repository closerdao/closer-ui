# Village API (Ambassador program)

Villages use the standard Closer base CRUD model route **`/village`** (same pattern as `/project`, `/event`, `/listing`).

## Base CRUD

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/village` | Create village |
| `GET` | `/village` | List (`?where=…` via `formatSearch`) |
| `GET` | `/village/:idOrSlug` | Read one |
| `PATCH` | `/village/:id` | Update (managers in `managedBy` + creator) |
| `DELETE` | `/village/:id` | Soft-delete when permitted |

Linking a live Closer tenant is a normal PATCH: `{ "projectApi": "<projectapiId>" }` (not a custom link route).

Companion model for tenants: **`/projectapi`** (base CRUD).

Depends on the Village / LandProject model shipping in closer-api (see [closer-api#290](https://github.com/closerdao/closer-api/pull/290); prefer model name `Village` / route `village` over `landprojects`).

## Attribution

```js
{
  name: 'referredBy',
  public: true,
  editable: true,
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null,
}
```

Same pattern for optional `ambassadorId` and on `ProjectApi.referredBy` when a tenant goes live.

## Verification & onboarding

- `verificationBadge`: enum `unverified | pending | verified | resonant`, default `unverified`
- `onboardingStatus`: enum `map_only | pre_assessed | intro_scheduled | subscribed | deploy_requested | deploying | live`, default `map_only`

## Criteria & project manager

- `criteria`: object with booleans/numbers for Appendix A hard + soft fit
- `projectManager`: `{ name, email, role }`

## Subscription & deploy request

- `platformSubscription`: `{ status, planPriceEur, trialStartedAt, subscribedAt, stripeSubscriptionId }`
  - Commercial: €0 setup, €49/mo, first month free
- `deployRequest`: `{ status, requestedAt, requestedBy, notes, processedAt, processedBy }`
  - Request allowed when subscription is `trialing` or `active`
  - Fulfillment human-gated initially; same object later triggers automation

## ACL

`managedBy` (baseFields) must include Ambassador and village owner. Base PATCH routes must authorize managers, not only `createdBy`.
