# Backend prompt — `POST /residency-agreements`

Paste this into a session on **closer-api**. It is self-contained: it does not
assume the reader has seen the closer-ui work.

---

Add a `POST /residency-agreements` endpoint to closer-api.

## Context

closer-ui has a seasonal team & residency planner at `/roles/[id]`. A member
picks a role, a season, arrival and departure dates, an accommodation listing,
how much of their allocation to take as cash, and how many DAO tokens to lock
against their stay. The page prices all of that client-side, generates a team
member agreement from a template, and the member ticks a set of acknowledgement
boxes plus a final "I agree".

Pressing **Reserve** sends everything below in one request. The endpoint must
**create the stay and store the agreed conditions atomically** — if either half
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
  "stay": {
    "listingId": "6a16bff839fad05906276ec1",
    "start": "2026-09-01T00:00:00.000Z",
    "end": "2026-11-30T00:00:00.000Z",
    "adults": 1,
    "isTeamBooking": true,
    // Nights in this window the member had already booked on other stays.
    // Informational — the server must recompute it (see Validation).
    "nightsAlreadyBooked": 0
  },

  // The rendered markdown the member actually read, already interpolated.
  "agreementBody": "# Team member agreement\n…",
  "acceptedAt": "2026-08-29T20:00:00.000Z",
  "acknowledgedIds": ["responsibilities", "compensation", "nda", "liability", "notice"],

  // Exactly what the member chose in the form.
  "selection": {
    "seasonId": "fall",
    "arrivalDayOffset": 0,
    "departureDayOffset": 90,
    "accommodationId": "6a16bff839fad05906276ec1",
    "tokensLocked": 30.6,
    "cashRequested": 700,
    "daysPerWeek": 5,
    "stayPct": 100
  },

  // Balances the quote was priced against, at signing time.
  "standing": { "presence": 500, "tokensHeld": 78, "sweat": 120, "lockableTokens": 78 },

  // Frozen copy of every number shown on the settlement slip. Store verbatim:
  // a later change to config, listing prices or the token price must never
  // rewrite what someone already signed.
  "quote": {
    "seasonId": "fall",
    "seasonLabel": "Fall",
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2026-11-30T00:00:00.000Z",
    "months": 3,
    "accommodationId": "6a16bff839fad05906276ec1",
    "gross": 1800,
    "living": 486,
    "accommodationFiatMonthly": 306,
    "net": 1008,
    "cashReceivedMonthly": 490,
    "tokensEarnedMonthly": 3.88,
    "tokensLocked": 30.6,
    "seasonCash": 1470,
    "seasonTokens": 11.65,
    "boundaryPenalty": 0,
    "tokenValue": 259.44,
    "nightsAlreadyBooked": 0,
    "billableRatio": 1
  }
}
```

## Behaviour

1. **Authenticate.** Members only. The agreement belongs to `req.user`; ignore
   any user id in the body.
2. **Validate** (see below). Reject the whole request on any failure.
3. **Create the stay** using the existing stay-creation path — the same
   validation, availability check and pricing `POST /stays` runs, with
   `isTeamBooking: true`. Do not reimplement it. A residency runs past the
   28-night threshold, so the monthly duration discount applies as it would to
   any long stay.
4. **Persist the agreement** with `stayId` set to the new stay, plus everything
   in the request body stored verbatim.
5. **Roll back** the stay if step 4 fails.
6. **Respond** `{ results: { agreement, stay } }`.

## Validation

Reject with a clear message when:

- The role does not exist, or `isResidency` is not true on it.
- `residency.enabled` is false in config.
- `acknowledgedIds` does not cover every id in the `residency` config's
  `acknowledgements` list.
- `stay.start` / `stay.end` fall outside the named season's window, as derived
  from the `residency` config's `seasons` entry for `selection.seasonId`.
- `stay.listingId` is not a listing the member may book (not hourly, and
  `availableFor` covering `team` or `resident`, or unset).
- The member already has a **non-terminal** residency agreement overlapping
  this window. One season plan at a time.

**Recompute, never trust:**

- `nightsAlreadyBooked` — sum the overlap between the requested window and the
  member's own non-cancelled, non-rejected stays. If it differs from what the
  client sent, reject with `409` and return the server's figure so the UI can
  re-price. The client uses this to discount accommodation, so a stale number
  is a member paying the wrong amount.
- Every money figure in `quote`. Store the client's copy for the audit trail,
  but compute your own from the role, the `residency` config, the listing and
  the live token price. Reject on a mismatch beyond a small tolerance — the
  quote is generated in a browser and must not be authoritative for payment.

## Model

Collection `residencyagreements`, following the closer-api base model
(`visibility`, `visibleBy`, `createdBy`, `attributes`, `managedBy`, `created`,
`updated`) plus:

| field | type | notes |
| --- | --- | --- |
| `roleId` | ObjectId → Role | indexed |
| `stayId` | ObjectId → Stay | indexed, unique |
| `status` | String | `pending` \| `countersigned` \| `cancelled`; starts `pending` |
| `agreementVersion` | String | |
| `agreementBody` | String | the rendered markdown, verbatim |
| `acceptedAt` | Date | |
| `acknowledgedIds` | [String] | |
| `selection` | Mixed | |
| `standing` | Mixed | |
| `quote` | Mixed | the frozen snapshot |
| `countersignedBy` | ObjectId → User | set when a space host approves |
| `countersignedAt` | Date | |

Visibility: readable by the member who signed it and by `space-host`; only a
`space-host` may countersign or cancel. Compensation terms are confidential
under the agreement's own NDA clause, so it must never be public.

## Also needed

`GET /residency-agreements` — the member's own agreements by default, all of
them for a `space-host`, filterable by `roleId`, `stayId` and `status`. The UI
needs it to show someone their existing plan instead of offering a fresh one.

## Already done

`models/role.js` in this repo has the fields the planner reads:
`isResidency`, `baseCompensation`, `minPresence`, `minTermMonths`,
`daysPerWeek`, `hoursPerDay`, `team`, `communityDuties`, `agreementTemplate`.
That change is uncommitted on this branch — verify it is still there.
