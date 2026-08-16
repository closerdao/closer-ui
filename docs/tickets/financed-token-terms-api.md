# Backend: financed token contract terms + overpayment carryover

**Status:** ready for backend
**Depends on:** nothing — frontend already quotes APR / min monthly / max term and
sends the locked installment on create; schedule UIs read `amountDue` when present
and fall back to `monthlyPaymentAmount` for older contracts
**Frontend:** `packages/closer/utils/tokenFinancing.ts`,
`packages/closer/components/CitizenFinanceTokens/index.tsx`,
`packages/closer/pages/token/finance/index.tsx`,
`packages/closer/utils/financeApplicationMonthlyDue.ts`

## Why

Admins can now set **max financing length**, **APR**, and **minimum monthly
payment** on the `token` config. Buyers pick any token count (no more fixed
30/60/90/120 blocks) and a term up to that max. The monthly installment is
calculated with standard amortisation and must clear the minimum.

Two backend behaviours are required for the contract to match what the buyer
agreed to:

1. **Write monthly dues at contract creation time** — do not recompute them later
   from `totalToPayInFiat / duration`.
2. **Carry overpayments into later months** — paying €400 against a €250 due
   marks month N paid and leaves €150 on month N+1.

## Config (already on frontend `token` slug)

| key | type | meaning |
| --- | --- | --- |
| `maxFinancingMonths` | number | Hard ceiling (e.g. `6`, `180`, `360`) |
| `financingAprPercent` | number | Annual APR applied to financed principal |
| `minMonthlyPayment` | number | Floor on the quoted monthly installment |
| `financingDurationsMonths` | text | Optional presets, filtered by the max |
| `downPaymentPercent` | number | Unchanged |
| `tokenPriceModifierPercent` | number | Unchanged |

## Endpoints

### 1. `POST /token/finance-application` (extend existing)

Body now also sends:

```json
{
  "tokensToFinance": 10,
  "totalToPayInFiat": 2600,
  "iban": "PT50...",
  "durationInMonths": 6,
  "monthlyPaymentAmount": 433.33,
  "downPaymentAmount": 0,
  "aprPercent": 0,
  "isCitizenApplication": false
}
```

Required behaviour:

- Cap `durationInMonths` at the platform `token.maxFinancingMonths`.
- Recompute / verify the monthly installment with the same amortisation rules
  (`principal = total - down`, zero-APR → equal split, otherwise standard
  `P * r(1+r)^n / ((1+r)^n - 1)` with `r = apr/100/12`). Reject with `400` if
  the verified monthly amount is below `token.minMonthlyPayment`.
- Persist on the application: `monthlyPaymentAmount`, `downPaymentAmount`,
  `aprPercent`, `durationInMonths`.
- When building `paymentsScheduled`, write each month with an explicit
  `amountDue` equal to the locked monthly installment (plus the usual
  `status`, `amountPaid: 0`, `paymentDate`).

Example schedule month:

```json
{
  "2026-09": {
    "status": "pending",
    "amountDue": 433.33,
    "amountPaid": 0,
    "paymentDate": "2026-09-15T00:00:00.000Z"
  }
}
```

### 2. Payment matching / charge application (existing financed-token payment path)

Wherever a paid charge is applied to a finance application schedule (bank
transfer match, admin mark-paid, Stripe webhook, etc.):

- Walk pending months in chronological order.
- Apply the payment to `amountPaid` until `amountPaid >= amountDue`, then mark
  that month `paid`.
- Any remainder **must** continue into the next pending month (carryover). Do
  not leave surplus parked only on the current month or as an unallocated
  credit that ignores future dues.
- Prefer reading each month's `amountDue`; if missing (legacy contracts), fall
  back to `application.monthlyPaymentAmount`.

Reference algorithm (already unit-tested on the frontend as
`applyPaymentWithCarryover`):

```ts
// payment €400, dues [250, 250, 250]
// → [{ paid: 250, status: 'paid' }, { paid: 150, status: 'pending' }, ...]
```

No new public route is strictly required if the existing charge-matching code
path is updated. If payment application is currently only reachable through an
admin action, expose or extend that path so carryover is applied consistently
for every funded charge linked to a `FinanceApplication`.

### 3. Optional: `POST /token/finance-application/:id/apply-payment`

Only needed if there is no shared internal helper today. Body:

```json
{ "amount": 400, "chargeId": "..." }
```

Apply carryover as above and return the updated application (including
`paymentsScheduled`).

## Acceptance checks

- Admin sets max `6`, APR `0`, min monthly `250`; 10 tokens at €260 each with 0%
  down quotes ~€433.33/mo and creates a schedule of six `amountDue: 433.33` rows.
- Same config rejects (or frontend disables) a package whose amortised monthly
  amount is below €250.
- A €400 payment against €250 dues marks the first month paid and leaves €150
  paid on the second month.
