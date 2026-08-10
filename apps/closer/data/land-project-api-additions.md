# LandProject API additions (Ambassador program)

Companion to [closer-api#290](https://github.com/closerdao/closer-api/pull/290). UI implementation in closer-ui expects these fields on `LandProject` in addition to the PR model.

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

Same pattern for optional `ambassadorId` (alias) and on `ProjectApi.referredBy` when a tenant goes live.

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

`managedBy` (baseFields) must include Ambassador and village owner. Confirm generic PATCH routes authorize managers, not only `createdBy` (link-project-api already checks managers).
