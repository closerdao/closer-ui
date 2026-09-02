# Volunteer residencies — how closer-ui talks to the API

Everything lives under `/residencies`. `POST /residency-agreements` and
`GET /residency-agreements` no longer exist and return 404; they never shipped
outside api-47, so there is no compatibility shim and nothing in this repo
should reference them.

## What this flow is, and what it must not look like

A role with `isResidency` opens the season tool at `/roles/[id]`. What it lays
out is participation in an environmental volunteer program run by an
association under a volunteering framework (in the first deployment, the
Portuguese `Lei n.º 71/98` and `Decreto-Lei n.º 389/99`). The legal shape is
what the API is built to preserve, and the UI has to preserve it too:

- **Volunteering is unpaid.** No salary, wage or cash-out appears anywhere in
  this flow. The API has no field for one.
- **The token allocation is a quantity, not a sum.** Show the number of tokens
  and its fair market value, which is zero — there is no liquid market to sell
  into. It is not remuneration, confers no right to payment, and may be
  discontinued.
- **The bed, the meals and the utilities are support in kind.** Never put a
  price on any of them — not even a zero. The API returns no figure, so there
  is nothing to render even by accident.
- **The only euro figures a volunteer may see** are the room they chose above
  the covered one and whatever of it they still owe (`upgradeFiatMonthly`,
  `upgradeFiatSeason`, `seasonFiatOwed`). In a normally-budgeted role
  `seasonFiatOwed` is 0 — hide the line entirely when it is.
- **No minimum term, no notice penalty, no early-exit charge.** Either side may
  end participation at any time. Never render a countdown, a penalty warning,
  a refund percentage or a "you committed to N months" line.
- Paid team roles are arranged separately under a work or services contract and
  do not come through these endpoints.

## Endpoints

| Method | Path | Who | What |
| --- | --- | --- | --- |
| POST | `/residencies/apply` | any member | Sign the agreement, book the stay, file the season |
| GET | `/residencies` | any member | The caller's own agreements (all of them, for a space-host) |
| POST | `/residencies/:id/approve` | space-host | Countersign for the association, activate the stay |
| POST | `/residencies/:id/cancel` | the volunteer, or a space-host | End participation, release the stay |

All four are authenticated and return `{ results: … }`, or `{ error: "…" }`
with a 400/401. The error messages are written to be shown to a volunteer, so
render them directly — `parseMessageFromError` already does.

## `POST /residencies/apply`

One request creates the stay and files the signed agreement atomically. **Do
not create the stay client-side**: a `POST /stays` followed by a separate
agreement call leaves an orphan stay behind every time the second call fails.
That is the whole reason this endpoint exists.

`buildAgreementSubmission` in `utils/residency.helpers.ts` builds the body:
`roleId`, `roleTitle`, `agreementVersion`, `stay` (or null), `agreementBody`,
`acceptedAt`, `acknowledgedIds`, `selection`, `standing`, and a `program`
carrying **only** `startDate` and `endDate`.

**The server recomputes the season.** It works every number out from the
association's own inputs — the role, the residency and booking configs, the
listings open to residents, the default food option, the live bonding curve
price — and files its own result. Browser-side arithmetic is never trusted and
never stored. The two dates are there only to say which year's instance of the
season is being joined, which the day offsets cannot, and the server reads them
only when there is no stay to read them off.

So: **render the `program` that comes back, not the one the page drew.** If the
curve moved between the read that drew the tool and the write that filed the
agreement, the two differ, and the response is the one that was signed. The
roles page shows the returned agreement in `ResidencyAgreementCard` for exactly
this reason.

Response: `{ results: { agreement, stay } }`. The stay is a **`pending`**
Booking — never self-confirmed, the same rule any team booking follows — or
null for a self-housed volunteer. It waits for a space-host to approve. Two
payment targets are written onto it from the server's program, and both are
usually 0:

- `stay.tokensTarget.val = program.seasonTokensSpent` — the tokens the
  volunteer chose to stake against a room above the covered one.
- `stay.fiatTarget.val = program.seasonFiatOwed` — whatever euros neither pass
  could absorb.

Nothing else on the season is owed. Do not show a "balance due" for a stay
whose targets are both zero.

### The settlement, in three passes

A room above the covered one is settled in this order. Show them as passes, not
as a bill:

1. **Tokens the volunteer already holds and chose to stake** —
   `seasonTokensSpent`. Capped at what the upgrade needs and at their on-chain
   balance; asking to stake more than they hold is silently reduced, not
   rejected.
2. **The season's own allocation** — `seasonTokensWithheld`. The association
   simply issues fewer tokens, because the room came out of the same budget for
   the position. This is not a charge to the volunteer.
3. **Euros** — `seasonFiatOwed`, only for what neither pass could absorb. Hide
   the line when it is 0, which is the normal case.

`seasonTokensDistributed` is the allocation after pass 2. Present it as a
quantity with a fair market value of zero (`tokenFairValue`, always 0), never
as a euro amount and never as pay.

### Volunteers who house themselves

`selection.needsAccommodation: false` with `"stay": null`. Sending a stay
alongside it is a 400, and so is omitting one when it is true.

`presenceEarned` comes back 0 — presence counts days on the land, logged by
check-in, not by signing. Do not display a presence figure for them at all;
"0 days" reads as a season worth nothing. Meals on volunteering days are still
provided, and there is no figure to show either way. Their token allocation is
larger, because the program spends nothing housing them. That is correct — do
not "correct" it in the UI.

### Which room is free is not our call

`includedAccommodationId` is derived server-side as the cheapest listing open
to residents, and is covered at no cost. A listing counts as open to residents
only when `availableFor` **explicitly** contains `resident` and `priceDuration`
is not `hour` — an unset `availableFor` is not enough here, unlike elsewhere in
the app, because a season holds a room for months.

### Whether a room is free is checked before the volunteer signs

Open to residents is not the same thing as open *then*, and apply books a real
stay — so a taken listing is a 400 arriving after the volunteer has read and
agreed to a whole season. `useResidencyAvailability` asks
`POST /stays/listing/:id/availability` about each resident listing over the
window on screen, with the same `{ adults: 1, isTeamBooking: true }` the
agreement's stay carries; asking anything else would grey out rooms apply
accepts. The per-listing endpoint rather than `/stays/search`: search filters
by what a listing is open for, so a room missing from its results is
indistinguishable from a taken one, and it returns no calendar to count the
clash off — the tool shows how many days of the window a room is spoken for,
because three nights inside a three-month season is a date to move rather than
a dead end.

It fails open. A room the platform could not answer for stays pickable: the
endpoint checks again at apply time, and a flaky network is not a reason to
tell a volunteer the village is full.

### Rejections

All 400s with human-readable messages: role missing or not `isResidency`;
`residency.enabled` false; residency config incomplete; an acknowledgement left
unticked; dates outside the named season; listing not open to residents;
`stay.listingId` ≠ `selection.accommodationId`; an overlapping live agreement.

Config completeness is worth handling before the tool draws anything. The
endpoint requires `associationName`, `legalFramework`, `agreementVersion`,
`noticeWeeks`, `expenseReimbursementDays`, `presenceScaleMax`, `sweatRate`,
`sweatMaxBonus`, `presenceTiers` and `seasons`. `parseResidencyConfig` treats
the same set as required, and the page names whatever is missing one by one
instead of rendering the tool. Three of them — `expenseReimbursementDays`,
`sweatRate`, `sweatMaxBonus` — are read only by the API (they size the
allocation server-side) and render nowhere on the page; they are in the
`residency` config schema so an admin can state them, and 0 is a stated
value for the two sweat fields.

`providesInsurance`, `legalFrameworkUrl`, `jurisdiction`, `acknowledgements`
and `agreementTemplate` are optional, as are the association's particulars the
agreement names — `associationTaxNumber` (NIPC), `associationAddress`,
`signatoryName`, `signatoryOffice`, `privacyContactEmail`,
`coordinatorContact` and `insurancePolicy`. An unset particular renders as a
visible `[•]` in the agreement rather than an empty clause. **An unset
`providesInsurance` means no policy** — never render "the association insures
you" off an unset box.

## `GET /residencies`

The caller's own agreements; a space-host gets everyone's. Query: `roleId`,
`stayId`, `status` (comma-separated), `limit` (1–100, default 50), and
`mine=true` so a host can ask for just their own. Newest first, so there is no
sort to send. Agreements are private and carry a confidentiality clause — only
the volunteer who signed and a space-host can read one, and there is no public
view to build.

## `POST /residencies/:id/approve`

Space-host only; body ignored. The association countersigns: the agreement
moves to `countersigned` with `countersignedBy` / `countersignedAt`, and the
stay the season reserved moves `pending → confirmed`, then reconciles.

Response `{ results: { agreement, stay } }`, `stay` null for a self-housed
volunteer. **Read `stay.status` to decide what to show next:**

- `paid` — nothing was owed (both targets 0, the normal case): done. Do not
  send the volunteer to a payment screen.
- `confirmed` — tokens or euros are owed on a room above the covered one. The
  room is theirs; the stay reads `paid` once they settle through the ordinary
  stay rails (below).

The residencies page says which of the three it was in a sentence, and — for
the few countersigned seasons that carry `seasonTokensSpent` or
`seasonFiatOwed` — reads the stay to tell the volunteer whether the room is
settled or still to settle, linking them to their booking when it is not.

Idempotent: re-running after a partial failure is safe and keeps the original
`countersignedBy`. Errors: 401 for a non-host, 400 for a residency that has
already ended or whose stay was cancelled underneath it.

Countersigning **moves no tokens.** Whatever the association uses to actually
transfer them is a separate, discretionary act, and that discretion is part of
why the allocation is not remuneration (agreement clause 7.5). Do not render
"tokens sent" off the back of this call.

### Settling a room upgrade after approval

This is the existing stay payment flow — nothing residency-specific. The
volunteer is sent to the stay's payment page (`getBookingPaymentCheckoutPath`)
and uses:

- `POST /stays/:id/token-stake` — verifies the on-chain accommodation stake
  against `stay.tokensTarget` and records it. Pass 1 of the settlement, the
  volunteer's own tokens.
- `POST /stays/:id/checkout` then `/checkout/confirm` — for `stay.fiatTarget`,
  when it is above zero.

**How much to stake, per night.** The server verifies each night on chain
against `stay.tokensTarget.val / nights` — an exact per-night match within wei
tolerance. So the wallet call for each night must stake `tokensTarget /
nights`: 9 tokens over a 90-night season is 0.1 a night.
`getStayAccommodationTokenTotal` returns `tokensTarget` for a stay with
`residencyAgreementId`, which is what `buildStayTokenStakePlan` sizes the
per-night stake from. Two figures on the stay are **not** what to stake:

- `stay.dailyRentalToken` is the listing's full nightly token rate, copied
  from the price lock unconditionally. Informational only on a residency stay.
- `stay.rentalToken` is 0 on every team booking.

`tokensTarget` is the single source of truth for tokens owed, and `fiatTarget`
for euros. Both survive a `PATCH /stays/:id/options` or
`POST /stays/:id/payment-method` — the server refuses to rewrite a residency
stay's targets from its (zero) team price lock — so the payment-method switch
is withheld on a residency stay (`canChangeStayPaymentMethod`), and the token
rail is offered once the stay is `confirmed` even though `volunteerInfo` would
otherwise hide it (`canShowStayTokenCreditPaymentOptions`).

When both rails are covered the stay flips to `paid` and the ordinary
`booking_paid_guest` email goes out. Until then it sits at `confirmed`; a
volunteer who never stakes simply has a confirmed room and an unsettled stay —
nothing is auto-cancelled, and that is a host's call. The
`residency_approved_volunteer` email already tells them what is left to stake
or pay, and only when there is something.

### A residency stay cannot be edited on its own

`POST /stays/:id/extend`, `/upgrade`, `/guests` and `/shorten` return 400 for
a stay with `residencyAgreementId` — its dates and room are the agreement's
frozen program, and changing them would leave the two disagreeing. The path to
a different room or different dates is `POST /residencies/:id/cancel` followed
by a fresh `POST /residencies/apply`. `/stay/[slug]` withholds those controls
on a residency stay and says why, with a link to `/residencies`, rather than
surfacing the error.

## `POST /residencies/:id/cancel`

The volunteer or a space-host. Body: `{ "reason": "…" }`, optional, in the
leaver's own words.

Either party may end participation at any time, without penalty and without
owing compensation, so there is no cancellation policy to warn about and
nothing to forfeit. The 24-hour cutoff that applies to guest stays does not
apply here: a volunteer can end a season that starts tomorrow.

The UI still only offers the volunteer their own cancel **up until the season
starts** — after that it is a conversation with the coordinator rather than a
button (`canVolunteerCancelResidency`). That is a UI choice about who presses
the button, not a penalty, and a space-host can always end one.

The related stay is cancelled through the guest-cancellation path, releasing
the room, and the agreement moves to `cancelled` with `cancelledBy`,
`cancelledAt` and `cancelReason`. `cancelled` records that it happened — it is
not a state machine and nothing is clawed back. Response
`{ results: { agreement, stay, refund } }`; `refund` is a no-op shape for a
booking with nothing paid on it, and needs no rendering.

## Emails

The API sends them; the client sends none. `residency_applied_volunteer` /
`residency_applied_spaceHost` on apply, `residency_approved_volunteer` on
approve, `residency_cancelled_volunteer` / `residency_cancelled_spaceHost` on
cancel — all editable at `/config/emails`. Approve and cancel also fire the
ordinary stay emails, because a real booking is being confirmed or released.
That is two emails per action by design; if it reads as noisy, turn the stay
copy off per-template rather than working around it in the client. Delivery
failures never fail the request.

## Checklist

- [x] Client points at `/residencies/*`; no reference to `/residency-agreements` remains.
- [x] The stay is not created client-side. One `POST /residencies/apply` does both.
- [x] The rendered program comes from the response, not from browser-side arithmetic.
- [x] `seasonFiatOwed` line is hidden when 0.
- [x] No euro figure appears for accommodation, meals, utilities, or the token allocation.
- [x] The token allocation reads as a quantity plus "fair market value: 0", never as pay.
- [x] `needsAccommodation: false` sends `"stay": null` and shows no presence figure.
- [x] After approve, the UI branches on `stay.status`: `paid` is done; `confirmed` means stake and/or pay.
- [x] The apply response's stay is `pending`; nothing in the client treats it as confirmed.
- [x] Per-night stake is `tokensTarget / nights`; nothing reads `dailyRentalToken` to size a stake.
- [x] Extend / upgrade / guests / shorten are hidden on a stay with `residencyAgreementId`.
- [x] Nothing renders a minimum term, a notice penalty, or an exit charge.
- [x] An unset `providesInsurance` renders as no policy, never as cover.
- [x] The tool refuses to draw a season when the residency config is incomplete.
