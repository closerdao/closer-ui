# Village API (Ambassador program)

Villages use the standard Closer base CRUD model route **`/village`** (same pattern as `/project`, `/event`, `/listing`).

Backend: [closer-api#493](https://github.com/closerdao/closer-api/pull/493) (merged).

## Base CRUD

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/village` | Create village |
| `GET` | `/village` | List (`?where=…` via `formatSearch`) |
| `GET` | `/village/:idOrSlug` | Read one |
| `PATCH` | `/village/:id` | Update (managers in `managedBy` + creator) |
| `DELETE` | `/village/:id` | Soft-delete when permitted |

Deployments are managed via the **Procurement** app (not a separate closer-api tenant model). After subscribe + deploy request, ops fulfill in Procurement; marking `onboardingStatus: live` / `closer: true` updates the Village record.

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

Optional `ambassadorId` alias on Village for the referring Ambassador.

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
  - Fulfillment human-gated via Procurement initially; same object later triggers automation

## ACL

`managedBy` (baseFields) must include Ambassador and village owner. Base PATCH routes must authorize managers, not only `createdBy`.
