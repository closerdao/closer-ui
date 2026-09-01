# Volunteer residencies — how closer-ui talks to the API

Everything lives under `/residencies`. `POST /residency-agreements` and
`GET /residency-agreements` no longer exist and return 404; nothing in this
repo should reference them.

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
  price on any of them. The API returns no figure, so there is nothing to
  render even by accident.
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

Response: `{ results: { agreement, stay } }`, the stay a `draft` Booking, or
null.

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
quantity with a fair market value of zero, never as a euro amount and never as
pay.

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

### Rejections

All 400s with human-readable messages: role missing or not `isResidency`;
`residency.enabled` false; residency config incomplete; an acknowledgement left
unticked; dates outside the named season; listing not open to residents;
`stay.listingId` ≠ `selection.accommodationId`; an overlapping live agreement.

Config completeness is worth handling before the tool draws anything. The
endpoint requires `associationName`, `legalFramework`, `agreementVersion`,
`noticeWeeks`, `expenseReimbursementDays`, `presenceScaleMax`, `sweatRate`,
`sweatMaxBonus`, `presenceTiers` and `seasons` — the same set the tool needs to
lay a season out. `useResidencyParams` reports what is missing and the page
names them one by one instead of rendering the tool.

`providesInsurance`, `legalFrameworkUrl`, `jurisdiction`, `acknowledgements`
and `agreementTemplate` are optional. **An unset `providesInsurance` means no
policy** — never render "the association insures you" off an unset box.

## `GET /residencies`

The caller's own agreements; a space-host gets everyone's. Query: `roleId`,
`stayId`, `status` (comma-separated), `limit` (1–100, default 50), and
`mine=true` so a host can ask for just their own. Newest first, so there is no
sort to send. Agreements are private and carry a confidentiality clause — only
the volunteer who signed and a space-host can read one, and there is no public
view to build.

## `POST /residencies/:id/approve`

Space-host only; body ignored. The stay moves to `confirmed` then reconciles to
`paid` without a checkout step — a season is a team booking with nothing owed,
so **never send the volunteer to a payment screen**. The agreement moves to
`countersigned`. Idempotent: re-running after a partial failure is safe and
keeps the original `countersignedBy`.

Countersigning **moves no tokens.** Whatever the association uses to actually
transfer them is a separate, discretionary act, and that discretion is part of
why the allocation is not remuneration (agreement clause 7.5). Do not render
"tokens sent" off the back of this call.

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
the room. Response `{ results: { agreement, stay, refund } }`; `refund` is a
no-op shape for a booking with nothing paid on it, and needs no rendering.

## Emails

The API sends them; the client sends none. `residency_applied_volunteer` /
`residency_applied_spaceHost` on apply, `residency_approved_volunteer` on
approve, `residency_cancelled_volunteer` / `residency_cancelled_spaceHost` on
cancel — all editable at `/config/emails`. Approve and cancel also fire the
ordinary stay emails, because a real booking is being confirmed or released.
Delivery failures never fail the request.
