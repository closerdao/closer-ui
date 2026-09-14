# Backend: free tickets and single-day events

**Status:** ready for backend
**Blocks:** the free-ticket flow already shipped in the UI — the button renders
and the modal opens, but `/tickets/quote` and `/tickets/init` reject the
request, so nobody can claim a ticket for a free event
**Frontend:** `packages/closer/components/EventTicketModal/*`,
`packages/closer/pages/events/[slug]/index.tsx`,
`packages/closer/utils/events.helpers.ts`

## Why

Two kinds of event had no way to be attended:

**A single-day event.** Attending it means holding a ticket, nothing more —
there is no night to sleep through. The event page used to hand these to
`/stay/create` whenever the event carried no ticket options, which asked the
guest to book a bed for a stay of zero nights. It no longer does: an event that
spans no nights, and any virtual event however long it runs, is now sold
entirely inside the ticket modal and never reaches the booking flow.

**A free event.** These were an RSVP — `POST /attend/event/:id` — which appends
a user id to `event.attendees` and produces no ticket. So a free attendee has no
ticket to show at the door, nothing under `/tickets/mine`, no row in the event
report, and no confirmation email. The event page now opens the same ticket
modal for a free event that it opens for a paid one; the difference is only that
the ticket comes back marked free.

Both cases converge on the same rule, which is worth stating once because the
backend should enforce it too:

> **A ticket is the record of attendance. A booking is the record of a bed.**
> An event that spans no nights must never produce a booking.

## What the UI now sends

### Plain admission — an event with no ticket options

A free event that defines no `ticketOptions` is sold under *plain admission*.
There is no option behind it, so **`ticketOption` is omitted from the request
entirely** rather than sent as an empty string:

```http
POST /tickets/quote
{ "eventId": "665f…", "quantity": 1 }
```

```http
POST /tickets/init
{ "eventId": "665f…", "quantity": 1, "email": "guest@example.com", "name": "Ana" }
```

`paymentMethod` is omitted too — there is nothing to pay, so there is no rail to
choose. This is the same shape the existing free path already uses when a
discount code takes a priced ticket down to zero, so it is not a new branch on
the client, only a newly reachable one.

`ticketOption` is likewise omitted (never empty) on the free claim for an event
that *does* define options.

### Everything else is unchanged

A paid event with ticket options quotes, inits and confirms exactly as it does
today. The `quantity`, `discountCode`, `email` and `name` fields keep their
current meanings.

## What needs to change

### 1. `POST /tickets/quote` — accept a request with no `ticketOption`

Today this presumably requires the option to price against. When `ticketOption`
is absent:

- If the event is free — `paid` is falsy, **or** every entry in `ticketOptions`
  is priced at `0`, **or** `ticketOptions` is empty — return a zero quote:

  ```json
  {
    "results": {
      "eventId": "665f…",
      "quantity": 1,
      "currency": "EUR",
      "listUnitPrice": { "val": 0, "cur": "EUR" },
      "unitPrice":     { "val": 0, "cur": "EUR" },
      "total":         { "val": 0, "cur": "EUR" },
      "option": null,
      "discountApplied": false,
      "discountRejected": false,
      "availability": { "available": 34, "sold": 66, "capacity": 100 }
    }
  }
  ```

- If the event is **not** free and does define priced options, keep rejecting —
  `400 ticket_option_required`. The client only omits the field where it has
  established there is nothing to pick.

A `discountCode` sent alongside plain admission should come back
`discountApplied: false` rather than as an error. Nothing can be taken off zero.

### 2. `POST /tickets/init` — issue the free ticket, approved, with no payment

With no `ticketOption` and no `paymentMethod`, and a total of zero:

- Create the ticket with `status: "approved"` and `paymentMethod: "free"`.
- Do **not** create a Stripe PaymentIntent, and return no `clientSecret`,
  `paymentIntentId`, `treasuryAddress` or `stablecoin`.
- Return `total: { "val": 0, "cur": <event currency> }`.

```json
{
  "results": {
    "ticketId": "6a01…",
    "status": "approved",
    "paymentMethod": "free",
    "total": { "val": 0, "cur": "EUR" }
  }
}
```

The client treats `status: "approved"` as done and goes straight to the
celebration — it never calls `confirm-card` or `confirm-crypto` for a free
ticket.

Guard the obvious hole: **the server, not the client, decides a ticket is
free.** An init with no `paymentMethod` against an event whose quote is greater
than zero must be rejected (`400 payment_method_required`), never quietly issued
free.

### 3. Never create a booking for an event that spans no nights

Wherever the ticket or stay flow currently creates a `Booking` alongside an
event ticket, skip it when the event spans no nights. The rule the frontend uses
is in `packages/closer/utils/events.helpers.ts` and should be mirrored:

```
nights = calendarDay(event.end) - calendarDay(event.start)
needsAccommodation = nights > 0 && !event.virtual
```

Note it is a **calendar-day** difference, not a timestamp difference: an event
running 09:00–22:00 on one day is zero nights, and one running 14:00 Friday to
11:00 Saturday is one night. A ticket with `isDayTicket` is likewise always
zero-night regardless of the event's own span.

If `/stay/create` can still be reached for a zero-night event by an old link or
a stale client, reject it with a clear error rather than writing a booking with
`start === end`.

### 4. A ticket holder is an attendee

The event page still renders `event.attendees` — the avatars, the count, and
the "Email attendees" tool (`POST /events/:id/email-attendees`) all read it.
Switching free events from RSVP to tickets empties that list unless the backend
keeps it in step:

- Issuing a ticket (any payment method, free included) adds the buyer's user id
  to `event.attendees` if it is not already there.
- Cancelling or refunding a ticket removes it, **unless** the user still holds
  another live ticket for the same event.
- `POST /attend/event/:id` stays as it is for backwards compatibility — a user
  who RSVP'd before this lands keeps their place in the list. Do not
  retroactively mint tickets for them.

A guest who both RSVP'd and holds a ticket must appear once, not twice.

### 5. Capacity applies to free tickets too

Plain admission has no per-option limit to count against, so it counts against
the event's own `capacity`. `GET /tickets/event/:id/availability` should keep
returning the event-level `capacity` / `sold` / `available` for a free event
even when `ticketOptions` is empty, so the modal can say when a free event is
full. `available: null` means unlimited — an event with no `capacity` set.

An init that would take `sold` past `capacity` fails with the same sold-out
error a paid ticket gets.

### 6. Confirmation email

A free ticket should send the same confirmation email a paid one does, minus the
receipt — the guest needs the ticket link and the event details, and the success
screen promises them an email is on its way.

## Open questions

- **Quantity on plain admission.** The client sends `quantity: 1` for plain
  admission today (there is nothing to choose, so the selection step is skipped).
  If free events should let a guest claim seats for a party, say so and the UI
  will show the quantity picker for them as well.
- **Cancelling a free ticket.** `POST /tickets/:id/cancel` should return the
  seat with `refund: { status: "noop" }` — worth confirming that path does not
  trip over a ticket with no payment intent behind it.
- **`event.paid` with no ticket options.** The frontend reads this as free,
  since there is no price to charge. If the backend would rather treat it as
  misconfigured and refuse to sell, say so and the UI will show "no tickets
  available" instead.
