# Backend prompt — `POST /residency-agreements`

Paste this into a session on **closer-api**. It is self-contained: it does not
assume the reader has seen the closer-ui work.

---

Add a `POST /residency-agreements` endpoint to closer-api.

## Context

closer-ui has a **volunteer season tool** at `/roles/[id]`. A role with
`isResidency` opens it, and what it lays out is participation in an
environmental volunteer program run by an association under a volunteering
framework (in the first deployment, the Portuguese `Lei n.º 71/98` and
`Decreto-Lei n.º 389/99`).

The legal shape matters, because it is what the endpoint has to preserve:

- **Volunteering is unpaid.** There is no salary, wage or cash-out anywhere in
  this flow, and nothing accrues to the volunteer by reason of volunteering.
- **The community token allocation is a quantity, not a sum.** The association
  sizes it the way it budgets any position — the role's monthly budget, plus
  what seniority adds, scaled by the rhythm agreed, less what the program
  spends housing and feeding the volunteer — and converts the remainder at the
  bonding curve price into a number of tokens. **That arithmetic is internal
  budgeting and never leaves the association**: it is not in the request body,
  not in the agreement, and not on the volunteer's screen. What the volunteer
  is told is the quantity of tokens and its fair market value, which is
  **zero** — the token has no liquid market to be sold into. The allocation is
  not remuneration, confers no right to payment, and may be discontinued.
- **The association covers the volunteer's costs** — a bed, meals, utilities —
  as support in kind under the gratuitidade principle. It is not remuneration
  and carries no monetary value owed in its place, so no figure for it is
  quoted to the volunteer or stored here.
- **Upgrades are personal purchases.** A volunteer may take a better room than
  the covered one and pay the difference themselves, in euros or by spending
  DAO tokens they already hold. That is the only money in the flow.
- **Either side may end participation at any time**, without penalty and
  without owing compensation. There is no boundary penalty, no minimum term
  and no early-exit charge to compute.
- Paid team roles are arranged separately, under a work or services contract.
  They do not come through this endpoint.

The volunteer picks a season, arrival and departure dates, an indicative rhythm
in half-days per week, and a room. The page generates the bilingual Volunteer
Agreement (Acordo de Voluntariado, EN + PT) from a template, and the volunteer
ticks the association's acknowledgement boxes plus a final "I agree".

Pressing **Join** sends everything below in one request. The endpoint must
**create the stay and store the agreed terms atomically** — if either half
fails, neither is persisted. The UI deliberately does not create the stay
itself, because a client-side `POST /stays` followed by a separate agreement
call leaves an orphan stay behind whenever the second call fails.

## Request body

```jsonc
{
  "roleId": "6a933b91e545af913393dfbc",
  "roleTitle": "Mushroom Farm Lead",
  "agreementVersion": "1.0",

  // The booking to create. Mirrors POST /stays' own fields.
  // NULL when the volunteer houses themselves off site — create no stay.
  "stay": {
    "listingId": "6a16bff839fad05906276ec1",
    "start": "2026-09-01T00:00:00.000Z",
    "end": "2026-11-30T00:00:00.000Z",
    "adults": 1,
    "isTeamBooking": true
  },

  // The rendered markdown the volunteer actually read, already interpolated,
  // in both languages. The Portuguese version prevails.
  "agreementBody": "# Volunteer Agreement · Acordo de Voluntariado\n…",
  "acceptedAt": "2026-08-31T20:00:00.000Z",
  "acknowledgedIds": ["unpaid", "conduct"],

  // Exactly what the volunteer chose in the form.
  "selection": {
    "seasonId": "fall",
    "arrivalDayOffset": 0,
    "departureDayOffset": 90,
    "accommodationId": "6a16bff839fad05906276ec1",
    // Tokens the volunteer chose to spend on an upgrade, if any.
    "tokensSpent": 4.5,
    // Indicative rhythm agreed with the coordinator. Not hours owed.
    "halfDaysPerWeek": 4,
    // False when the volunteer houses themselves. Absent means true.
    "needsAccommodation": true
  },

  // Community records the page displayed, at signing time. Read-only: they
  // carry no right to payment and do not change here.
  "standing": { "presence": 500, "tokensHeld": 78, "sweat": 120, "lockableTokens": 78 },

  // Frozen copy of the season as signed. Store verbatim: a later change to
  // config, listing prices or the token price must never rewrite it.
  "program": {
    "seasonId": "fall",
    "seasonLabel": "Fall",
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2026-11-30T00:00:00.000Z",
    // Calendar months the stay touches, not 30-day blocks.
    "months": 3,
    "halfDaysPerWeek": 4,
    // The room the program covers, and the one actually taken.
    "includedAccommodationId": "6a16bff839fad05906276ec1",
    "accommodationId": "6a16bff839fad05906276ec2",
    "needsAccommodation": true,
    "isUpgrade": true,
    // The difference over the covered room, per month. Zero without an upgrade.
    "upgradeFiatMonthly": 510,
    "upgradeTokensMonthly": 1.5,
    // What the volunteer owes for the upgrade after their own tokens are spent.
    "seasonFiatOwed": 0,
    "seasonTokensSpent": 4.5,
    // Days on the land this season — what $Presence counts.
    "presenceEarned": 91,
    // The community allocation, in tokens, for the whole season.
    "seasonTokensDistributed": 13.35,
    // What it was worth when signed. Always 0 — there is no liquid market.
    "tokenFairValue": 0
  }
}
```

There is deliberately no `gross`, `net`, `cash` or `monthlyBreakdown` field,
and no euro value anywhere except what the volunteer owes for an upgrade they
chose. If you find yourself adding one, the flow has stopped being
volunteering.

## Behaviour

1. **Authenticate.** Members only. The agreement belongs to `req.user`; ignore
   any user id in the body.
2. **Validate** (see below). Reject the whole request on any failure.
3. **Create the stay**, unless `stay` is null, using the existing
   stay-creation path — the same validation, availability check and pricing
   `POST /stays` runs, with `isTeamBooking: true`. Do not reimplement it. A
   season runs past the 28-night threshold, so the monthly duration discount
   applies as it would to any long stay.
4. **Persist the agreement** with `stayId` set to the new stay — null when no
   stay was created — plus everything in the request body stored verbatim.
5. **Roll back** the stay if step 4 fails.
6. **Respond** `{ results: { agreement, stay } }`, with `stay: null` when none
   was created.

## Volunteers who house themselves

`needsAccommodation: false` means the volunteer sleeps off site. Send no stay,
persist the agreement alone with a null `stayId`, and expect
`presenceEarned: 0` — presence counts days on the land, which are logged by
check-in, not by an agreement. Meals on volunteering days are still provided;
that is support in kind and nothing is charged either way.

## Validation

Reject with a clear message when:

- The role does not exist, or `isResidency` is not true on it.
- `residency.enabled` is false in config.
- The `residency` config is incomplete — the UI refuses to lay out a season
  without `associationName`, `legalFramework`, `noticeWeeks`,
  `expenseReimbursementDays`, `presenceScaleMax`, `tokenDistributionMonthly`,
  `presenceTiers`, `seasons` and `agreementVersion`, and so should the
  endpoint.
- `acknowledgedIds` does not cover every id in the `residency` config's
  `acknowledgements` list.
- `stay.start` / `stay.end` fall outside the named season's window, as derived
  from the `residency` config's `seasons` entry for `selection.seasonId`.
- `stay.listingId` is not a listing open to residents: not hourly, and
  `availableFor` **explicitly** including `resident`. An unset `availableFor`
  is not enough — a season holds a room for months.
- The volunteer already has a **non-terminal** agreement overlapping this
  window. One season at a time.

Skip the window, listing and availability checks when `stay` is null — there is
nothing to place. The overlapping-agreement check still applies.

**Recompute, never trust:**

- `includedAccommodationId` is the **cheapest listing open to residents**, and
  it is covered by the program at no cost. Derive it; do not take the client's
  word for which room is free.
- `upgradeFiatMonthly` / `upgradeTokensMonthly` are `chosen − included`, per
  month, floored at zero. Zero whenever the volunteer takes the covered room or
  houses themselves.
- `seasonFiatOwed` is `upgradeFiatMonthly × months × (1 − tokensSpent /
  (upgradeTokensMonthly × months))`, floored at zero. Tokens the volunteer does
  not hold cannot be spent, so cap `tokensSpent` at the on-chain balance.
- `seasonTokensDistributed`. Recompute it from your own inputs — you have all
  of them:

  ```
  fte      = halfDaysPerWeek / role.daysPerWeek        (capped at 1)
  budget   = (role.baseCompensation + min(sweat × residency.sweatRate,
                                          residency.sweatMaxBonus)) × fte
  costs    = food + utilities (from the booking config and the default food
             option, per 30-day month) + the covered room's monthly rate
  tokens   = max(0, budget − costs) / bondingCurvePrice × months
  ```

  The covered room is the cheapest listing open to residents — an upgrade the
  volunteer buys themselves does not change what the program spends, so it does
  not change the allocation. `tokenFairValue` is always 0.

  Keep every euro in that calculation out of the response, the agreement and any email:
  the moment a volunteer is shown what their season was "worth", the program
  stops looking like volunteering.
- Nothing else has a money value. Do not compute, store or return a figure for
  the accommodation, meals or utilities the program provides, or for the token
  allocation — putting a price on support in kind, or on a token with no
  market, is what makes it look like pay.

## Distributing the tokens

The endpoint records what was agreed; it does not move tokens. Whatever the
association uses to actually transfer $TDF stays a separate, discretionary act
— that discretion is part of why the allocation is not remuneration (agreement
clause 7.5). If you later add a transfer, keep it out of this transaction and
keep it revocable.

## Model

Collection `residencyagreements`, following the closer-api base model
(`visibility`, `visibleBy`, `createdBy`, `attributes`, `managedBy`, `created`,
`updated`) plus:

| field | type | notes |
| --- | --- | --- |
| `roleId` | ObjectId → Role | indexed |
| `stayId` | ObjectId → Stay | indexed, unique; **nullable** — a volunteer who houses themselves has no stay |
| `status` | String | `pending` \| `countersigned` \| `cancelled`; starts `pending` |
| `agreementVersion` | String | |
| `agreementBody` | String | the rendered markdown, verbatim, both languages |
| `acceptedAt` | Date | |
| `acknowledgedIds` | [String] | |
| `selection` | Mixed | |
| `standing` | Mixed | |
| `program` | Mixed | the frozen snapshot |
| `countersignedBy` | ObjectId → User | set when a space host countersigns for the association |
| `countersignedAt` | Date | |

Visibility: readable by the volunteer who signed it and by `space-host`; only a
`space-host` may countersign or cancel. The agreement carries personal data and
a confidentiality clause, so it must never be public.

Ending participation is not a state machine to enforce: either party may end it
at any time. `cancelled` records that it happened, and nothing is charged or
clawed back on the way out.

## Also needed

`GET /residency-agreements` — the volunteer's own agreements by default, all of
them for a `space-host`, filterable by `roleId`, `stayId` and `status`. The UI
needs it to show someone their existing season instead of offering a fresh one.

## Already done

`models/role.js` in this repo has the fields the tool reads: `isResidency`,
`baseCompensation` (the association's own monthly budget for the position, used
to size the allocation and never shown as pay), `minPresence`, `daysPerWeek`
(the ceiling of the indicative rhythm, in half-days), `hoursPerDay`, `team`,
`responsibilities`, `communityDuties` and `agreementTemplate`. `minTermMonths`
is no longer read — volunteering has no minimum term.
