# Backend: subscription self-service endpoints

**Status:** ready for backend
**Depends on:** nothing — frontend is already shipped and degrades gracefully
**Frontend:** `packages/closer/utils/subscriptionActions.ts`, `packages/closer/hooks/useActiveSubscription.ts`, `packages/closer/components/SubscriptionManageCard/index.tsx`

## Why

`/subscriptions` now lets a member change or cancel their plan without leaving the
page. Until today the only option was a redirect to the Stripe customer portal,
which drops the member into Stripe-branded UI, loses our translations, and gives
us no event to log.

The frontend calls three endpoints that **do not exist yet**. When any of them
answers `404`, `405`, or `501`, the UI silently falls back to
`GET /stripe/create-customer-portal` and redirects as before — so nothing is
broken while this ticket is open. Shipping these endpoints turns the fallback
off automatically; no frontend release is needed.

## Endpoints

All three act on the authenticated user's own subscription. No id is passed in
the body on purpose — the caller must never be able to name someone else's
subscription. Resolve the Stripe subscription from the session user.

### 1. `POST /stripe/change-subscription`

```json
{ "priceId": "price_1U2qhrE9CDXOM807g1tTpJrd" }
```

- Validate that `priceId` belongs to a plan in the `subscriptions` config and
  that the plan is `available`. Reject unknown or unavailable prices with `400`.
- Update the existing Stripe subscription item to the new price with
  `proration_behavior: 'create_prorations'`. The UI tells the member "we only
  charge the difference for the rest of this month" — please match that.
- Do **not** create a second subscription. A member must never end up billed twice.
- Persist the new `priceId`, `plan`, `monthlyPrice`, `monthlyCredits`, and `tier`
  on the user.

#### Upgrades must actually collect the difference

An upgrade is a **charge**, so it needs the same care as first checkout:

- `create_prorations` only writes proration line items onto the *next* invoice.
  If the intent is to charge the difference today, the handler must also invoice
  immediately (`invoice.create` + `invoice.pay`, or
  `payment_behavior: 'pending_if_incomplete'` on the update) and treat an
  unpaid invoice as a failure — do not persist the new plan until the money is
  collected, or a member upgrades for free.
- The saved card may need **SCA / 3D Secure** on that proration invoice. Off
  session confirmation fails with `authentication_required` for European cards
  fairly often. When that happens, return `200` with
  `{ "status": "requires_action", "clientSecret": "pi_..." }` rather than an
  error, and the frontend will confirm it with Stripe.js the same way
  `SubscriptionCheckoutForm` already does for first payment. Until that shape
  exists the frontend has no way to complete an authenticated upgrade in place —
  it can only fall back to the Stripe customer portal, which handles SCA itself.
- Downgrades produce a credit balance rather than a charge, so they can complete
  without any of the above.

### 1b. Cancelled members switching plan

The frontend calls `POST /stripe/resume-subscription` **before**
`POST /stripe/change-subscription` when the member has a pending cancellation,
because picking a new plan means they are staying. Both must be safe in that
order: resuming an already-active subscription is a no-op `200`, and changing
the plan must not re-apply `cancel_at_period_end`.

### 2. `POST /stripe/cancel-subscription`

```json
{ "atPeriodEnd": true }
```

- `atPeriodEnd: true` (the only value the UI sends today) →
  `cancel_at_period_end = true`. The member keeps access until `validUntil`.
- Set `user.subscription.cancelledAt`. Leave `validUntil` untouched — the UI uses
  the pair to render "Ends on 9 September 2026" plus a Resume button.
- Cancelling an already-cancelled subscription should be a no-op `200`, not a `500`.

### 3. `POST /stripe/resume-subscription`

- No body. Clears `cancel_at_period_end` on Stripe and unsets
  `user.subscription.cancelledAt`.
- Only valid while the period has not ended yet. Once `validUntil` has passed
  there is nothing to resume — return `409` and the member re-subscribes normally.

## Response shape

Any `2xx` body is accepted; the frontend re-reads the user via `refetchUser()`
rather than trusting the response. What matters is that by the time the endpoint
returns, `GET /user/me` reflects the change:

| field | after change | after cancel | after resume |
| --- | --- | --- | --- |
| `subscription.priceId` | new price | unchanged | unchanged |
| `subscription.plan` | new plan slug | unchanged | unchanged |
| `subscription.monthlyPrice` | new price | unchanged | unchanged |
| `subscription.cancelledAt` | unchanged | set to now | unset |
| `subscription.validUntil` | unchanged | unchanged | unchanged |

If the write is asynchronous (webhook-driven), the member will see stale state
for a moment — please write these fields synchronously in the request handler and
let the webhook reconcile afterwards.

## Errors

Return a JSON body with an `error` string. The UI renders it verbatim in the
membership card, so it is member-facing: "Your card was declined" is good,
a raw Stripe stack trace is not.

Reserve `404`/`405`/`501` for "this endpoint does not exist" — the frontend
treats those three statuses as the signal to fall back to the Stripe portal, so
do not use them for business errors like an unknown price.

## Acceptance criteria

- [ ] A member on the €5 plan can switch to the €20 plan and is charged a prorated
      difference, with exactly one active Stripe subscription afterwards.
- [ ] That upgrade fails closed when the prorated charge fails: the member stays
      on the €5 plan and sees the decline reason.
- [ ] An upgrade on a card that demands 3D Secure returns `requires_action` with a
      `clientSecret` instead of silently succeeding.
- [ ] A cancelled member who switches plan ends up on the new plan **and** with
      `cancel_at_period_end` cleared.
- [ ] A member can cancel, keeps access until `validUntil`, and sees no further charge.
- [ ] A cancelled member can resume before `validUntil` and billing continues.
- [ ] `GET /user/me` reflects each change immediately after the call returns.
- [ ] Attempting to act on another user's subscription is impossible via these routes.
- [ ] Business errors return `400`/`409` with a readable `error` message, never `404`/`501`.

## Nice to have (not blocking)

`GET /stripe/subscription-preview?priceId=…` returning the exact proration amount,
so the change-plan panel can say "you'll be charged €7.42 today" instead of the
generic note. The frontend will pick this up in a follow-up.
