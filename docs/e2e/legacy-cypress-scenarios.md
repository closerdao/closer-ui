# Legacy Cypress scenarios (captured before removal)

Cypress is being removed from this repo (closing [#921 📋](https://github.com/closerdao/closer-ui/issues/921)).
This document is a faithful capture of the scenarios that lived in
`apps/tdf/cypress/e2e/` before deletion, so they can serve as the spec for
the Playwright suite being built under the closer-procurement epic
[#627 📋](https://github.com/closerdao/closer-procurement/issues/627).

The scenarios below were never wired into CI — there is no GitHub Actions
job that ran `cypress run`. They were run manually (`pnpm run cypress open`
from `apps/tdf`), so treat the "passing" state as unverified/aspirational
for the newest flows.

## What the config assumed

From `apps/tdf/cypress.config.ts`:

- `baseUrl`: `http://localhost:3000` — tests assumed a locally running `tdf`
  dev server, not a deployed environment.
- `env`: the entire local `process.env` (via `dotenv`) was forwarded into
  `Cypress.env(...)`, so scenarios depend on whatever env vars are present
  in the shell/`.env` at run time. The env vars actually referenced by the
  specs are `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, and `TEST_ADMIN_EMAIL`
  (the admin flows reuse `TEST_USER_PASSWORD` for the password).
- `supportFile: false` — no `cypress/support/e2e.js` or custom commands.
  Every helper (`login`, `selectDates`, `fillStripeForm`, etc.) was declared
  inline at the top of each spec file, so there is no shared support/fixture
  layer to port.
- `chromeWebSecurity: false` — needed to interact with the cross-origin
  Stripe iframe.
- No `viewport` override in the config, so Cypress's default
  (1000x660) applied. No `retries` configuration either — specs ran once,
  no automatic retry-on-fail.
- No fixtures directory existed (`apps/tdf/cypress/fixtures` was never
  created) and no `cypress/support` directory existed either — confirmed by
  `find apps/tdf/cypress -type d`, which only turned up `apps/tdf/cypress/e2e`.

### Preconditions common to (almost) every scenario

- A `tdf` app running locally at `http://localhost:3000`.
- Env vars `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` for a non-admin seeded
  user account, and `TEST_ADMIN_EMAIL` (same password) for a seeded admin
  account that can instant-book.
- Seeded listings in the target environment's DB:
  - `glamping-private` ("Glamping (private)") — a nightly-rate listing.
  - `meeting-room` ("Meeting room") — an hourly-rate listing.
- For the two event-booking scenarios at the bottom of `booking.cy.js`, a
  seeded event with slug `cypress-test-event` that has both an "overnight
  ticket" option and a plain ticket option.
- For the paid-checkout scenarios, a live Stripe test-mode integration
  (Stripe Elements iframe rendered on `/checkout`), and Stripe's published
  test card `4242 4242 4242 4242`.

### Flows NOT covered by these specs

- Signup (only the signup redirect is asserted, never actually filling the
  signup form).
- Password reset / forgot-password.
- Any admin-only management UI (booking management, listing CRUD, event
  CRUD) beyond using the admin account to instant-book.
- Non-Stripe payment methods other than the "credits" discount partially
  covered by "paid with credits" (which never completes payment, see below).
- Cancellation flows other than the happy-path "yes" click after a
  successful booking.
- Mobile/responsive viewports (no `viewport` override was configured).
- Any negative/error-path testing (failed payments, invalid coupon codes,
  unavailable dates, double-booking conflicts).

## `apps/tdf/cypress.config.ts`

```ts
import { defineConfig } from 'cypress';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
    env: {
      ...process.env,
    },
    baseUrl: 'http://localhost:3000',
    supportFile: false,
  },
  chromeWebSecurity: false,
});
```

---

## `login.cy.js` (21 lines)

### Scenario 1 — should log in and redirect to home page

- **Intent:** a user with valid credentials can log in from `/login` and
  lands back on the home page.
- **Preconditions:** `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` env vars set
  to a valid, seeded, non-admin account.
- **Steps:**
  1. Visit `{baseUrl}/login`.
  2. Assert an `h1` containing "Log in" is present.
  3. Type `TEST_USER_EMAIL` into `input[aria-label*="Email"]`.
  4. Type `TEST_USER_PASSWORD` into `input[aria-label*="Password"]`.
  5. Click the button labeled "Log in" (`cy.contains('button', 'Log in')`).
  6. **Hard wait: `cy.wait(2000)` — do not port.** Used to let the redirect
     settle instead of waiting on a URL/network condition.
- **Selectors/labels relied on:**
  - `input[aria-label*="Email"]`
  - `input[aria-label*="Password"]`
  - `button` containing text "Log in"
  - `h1` containing text "Log in" (on the `/login` page itself)
- **Route:** `/login`.
- **Assertions:**
  - `h1` on `/login` contains "Log in".
  - After login, `cy.url()` equals exactly `{baseUrl}/` (the bare root,
    not just "includes").
- **Timing hacks:** `cy.wait(2000)` after submit — flagged do not port;
  a Playwright port should wait on the actual post-login navigation/
  network response instead.
- **Suggested closer-procurement mapping:** this `login()` helper is the
  basis for the fixture-layer `loginAs` helper tracked in
  [closerdao/closer-procurement#629](https://github.com/closerdao/closer-procurement/issues/629).
  The scenario itself doesn't have an obvious 1:1 open ticket under the
  epic beyond that shared fixture.

---

## `booking.cy.js` (445 lines)

### Shared helpers (declared inline, no support file)

- `login({ isAdmin })` — same shape as the `login.cy.js` helper, but
  branches between `TEST_ADMIN_EMAIL` (admin path) and `TEST_USER_EMAIL`
  (non-admin path), both using `TEST_USER_PASSWORD`. Also contains the same
  **`cy.wait(2000)` after submit — do not port.**
- `getDateInTwoDays()` — returns `today + 2 days`; every date-picking
  scenario books exactly 2 days out with a 1-night stay
  (`endDate = startDate + 1 day`).
- `getIframeBody()` — reaches into the cross-origin Stripe Elements iframe
  via `iframe[role="presentation"]` → `contentDocument.body`, asserted
  not empty, then wrapped for further `cy` chaining. This cross-origin
  iframe reach-in is the trickiest part to port to Playwright (Playwright
  has native `frameLocator()` support, which should replace this pattern
  entirely rather than being ported literally).
- `selectDates()` — for nightly listings: clicks
  `[data-testid="select-dates-button"]`, navigates month if needed via
  `[aria-label="Go to next month"]`, clicks the day cells
  (`.rdp-day` containing the day-of-month number) for both start and end
  date, then clicks `[data-testid="select-dates-button"]` again to close
  the picker.
- `selectDateAndTime()` — for hourly listings: clicks
  `[data-testid="select-dates-button"]`, clicks the day cell
  (`.rdp-day` containing the day-of-month), clicks a time-slot button
  matched by the regex `/12:00.*13:00/s` (hardcoded noon-to-1pm slot),
  then closes the picker.
- `fillStripeForm()` — inside the Stripe iframe body: types
  `4242424242424242` into `input[name="cardnumber"]`, `1035` into
  `input[name="exp-date"]`, `111` into `input[name="cvc"]`. Note a
  commented-out line for `input[name="postal"]` — postal code entry was
  disabled/unused, left as a comment in the source (not ported as active
  code, but worth a decision in the new suite about whether postal is
  required in the current Stripe Elements config).

### Constants

- `LISTING = { slug: 'glamping-private', name: 'Glamping (private)' }`
- `LISTING_HOURLY = { slug: 'meeting-room', name: 'Meeting room' }`
- `TEST_EVENT_SLUG = 'cypress-test-event'`

### Scenario 2 — unauthenticated user booking flow (nightly listing)

- **Intent:** an unauthenticated visitor who tries to book a nightly
  listing is routed through signup/login and returned to the listing page.
- **Preconditions:** none beyond the shared ones; explicitly unauthenticated
  (no prior login).
- **Steps:**
  1. Visit `{baseUrl}/stay/glamping-private`.
  2. `selectDates()`.
  3. Click button matching `/book now/i`.
  4. Assert URL includes `signup?back=stay/glamping-private`.
  5. Click `[data-testid="login-link"]`.
  6. Assert URL includes `/login?back=stay/glamping-private`.
  7. `login({ isAdmin: false })`.
  8. Assert URL includes `/stay/glamping-private`.
- **Selectors/labels:** `[data-testid="select-dates-button"]`,
  `.rdp-day`, `[aria-label="Go to next month"]`, button `/book now/i`,
  `[data-testid="login-link"]`.
- **Routes:** `/stay/glamping-private` → `signup?back=...` →
  `/login?back=...` → back to `/stay/glamping-private`.
- **Timing hacks:** inherits `login()`'s `cy.wait(2000)` — do not port.
- **Mapping:** login/signup redirect flow — related to the fixture work in
  [closerdao/closer-procurement#629](https://github.com/closerdao/closer-procurement/issues/629);
  no dedicated ticket for the redirect-preservation behavior itself.

### Scenario 3 — authenticated user (cannot instant book) booking flow

- **Intent:** a logged-in, non-instant-book user goes from listing page
  through date selection to the request-a-stay confirmation button
  (request flow, not instant pay).
- **Preconditions:** `TEST_USER_EMAIL` account exists and is **not** flagged
  for instant booking.
- **Steps:**
  1. Visit `/login`, `login({ isAdmin: false })`.
  2. **Hard wait: `cy.wait(2000)` — do not port** (separate from the one
     inside `login()`; stacked after it).
  3. Visit `/stay/glamping-private`.
  4. `selectDates()`.
  5. Click `/book now/i`.
  6. Assert `h1` matching `/food/i` is visible (the food/diet preferences
     step of the booking wizard).
  7. Click `/continue/i` (asserted visible + enabled first).
  8. Assert a `/submit request/i` button is visible and enabled (flow stops
     here — never actually submits).
- **Selectors:** `h1` matching `/food/i`, buttons matching `/continue/i`
  and `/submit request/i`.
- **Assertions:** visibility + enabled-state checks rather than URL
  changes for the last two steps.
- **Mapping:** the "cannot instant book" / request-to-book path isn't
  explicitly named among the open epic tickets; closest is the general
  booking-flow scaffolding in
  [closerdao/closer-procurement#628](https://github.com/closerdao/closer-procurement/issues/628).

### Scenario 4 — authenticated user (can instant book) booking flow — full paid checkout

- **Intent:** the canonical end-to-end paid booking: admin/instant-book
  user books a nightly listing, pays via Stripe, reaches confirmation,
  views the booking, and cancels it.
- **Preconditions:** `TEST_ADMIN_EMAIL` account is instant-book-eligible;
  Stripe test mode active.
- **Steps:**
  1. Visit `/login`, `login({ isAdmin: true })`.
  2. Visit `/stay/glamping-private`.
  3. `selectDates()`, click `/book now/i`.
  4. Assert `h1` `/food/i` visible.
  5. Click `/continue/i` (visible + enabled).
  6. Click `/checkout/i` button.
  7. Assert URL includes `/checkout`.
  8. Assert `/pay/i` button is **disabled** (before card details filled).
  9. `fillStripeForm()`.
  10. Click every `input[type="checkbox"]` (`{ multiple: true }` — accepts
      all terms/checkboxes on the page, plural, not one specific box).
  11. Click `/pay/i` button.
  12. **Hard wait: `cy.wait(16000)` — do not port**, this is the biggest
      timing hack in the suite: a 16-second blind wait for Stripe payment
      processing + webhook + redirect. A Playwright port must wait on the
      actual `/confirmation` navigation or a network/API signal instead.
  13. Assert URL includes `/confirmation`.
  14. Click `/view booking/i` button.
  15. Assert URL includes `/bookings`.
  16. Click `/cancel booking/i` button.
  17. Assert URL includes `/cancel`.
  18. Click `/yes/i` button (confirms cancellation).
- **Selectors:** `/checkout/i`, `/pay/i`, `input[type="checkbox"]`,
  `/view booking/i`, `/cancel booking/i`, `/yes/i`.
- **Mapping:** this is the direct predecessor of
  [closerdao/closer-procurement#630 📋](https://github.com/closerdao/closer-procurement/issues/630)
  ("Green: tdf stays checkout paid end to end") — the ticket explicitly
  references `booking.cy.js`. Also touches
  [closerdao/closer-procurement#632](https://github.com/closerdao/closer-procurement/issues/632)
  (dedicated Stripe test-mode account) for the payment step, and
  [closerdao/closer-procurement#631](https://github.com/closerdao/closer-procurement/issues/631)
  (repro of a charge.refunded issue) is adjacent territory for the
  cancel/refund tail end of this scenario.

### Scenario 5 — authenticated user (can instant book) booking flow paid with credits

- **Intent:** applying a "credits" discount at checkout shows a redemption
  confirmation message. **Note: this scenario never completes payment** —
  it stops after asserting the discount message, so it does not actually
  verify a credits-paid booking end to end.
- **Preconditions:** `TEST_ADMIN_EMAIL` account has enough credits/discount
  eligibility for `glamping-private`.
- **Steps:**
  1. Visit `/login`, `login({ isAdmin: true })`.
  2. Visit `/stay/glamping-private`, `selectDates()`, click `/book now/i`.
  3. Assert `h1` `/food/i` visible, click `/continue/i`.
  4. Click `/checkout/i`, assert URL includes `/checkout`, assert `/pay/i`
     disabled.
  5. Click `/apply discount/i` button.
  6. Assert a `div` containing text matching `/will be redeemed/i` is
     visible.
- **Selectors:** `/apply discount/i`, `div` matching `/will be redeemed/i`.
- **Gap flagged:** this scenario is incomplete as a "paid with credits"
  test — a faithful port should either extend it to actually complete a
  $0/credits-covered payment, or the epic should scope a proper
  credits-checkout ticket; nothing under #627 currently owns "pay with
  credits" explicitly.

### Scenario 6 — authenticated user booking flow with listing search

- **Intent:** admin user finds a listing via the `/stay` search page
  (rather than a direct URL) and proceeds to the summary step.
- **Preconditions:** `TEST_ADMIN_EMAIL`.
- **Steps:**
  1. Visit `/login`, `login({ isAdmin: true })`.
  2. Visit `/stay`.
  3. Click `a` matching `/apply to stay/i`.
  4. `selectDates()`.
  5. Click `/search/i` button.
  6. Within the `div` containing "Glamping (private)", find the `h4`
     containing that name, walk up to `parents('div')`, then click the
     "Select" button inside that parent (`contains('button', 'Select')`).
  7. Assert `h1` `/food/i` visible.
  8. Click `/continue/i` (visible + enabled).
  9. **Hard wait: `cy.wait(2000)` — do not port.**
  10. Assert URL includes `/summary`.
- **Selectors:** `a` `/apply to stay/i`, `/search/i` button, `div`
  containing listing name + nested `h4` + `parents('div')` + `button`
  "Select" — a fragile DOM-traversal selector chain that a Playwright port
  should replace with a stable `data-testid` if one doesn't already exist
  on the listing search result card.
- **Mapping:** search/discovery isn't explicitly named under the epic;
  closest is general scaffolding in
  [closerdao/closer-procurement#628](https://github.com/closerdao/closer-procurement/issues/628).

### Scenario 7 — unauthenticated user booking flow with listing search

- **Intent:** same search flow as Scenario 6, but starting unauthenticated,
  triggering a "log in to book" prompt mid-flow instead of at the top.
- **Preconditions:** none (explicitly unauthenticated at start),
  `TEST_ADMIN_EMAIL` used for the login step mid-flow (note: uses the admin
  account even though the scenario is titled "unauthenticated" — that only
  describes the starting state).
- **Steps:**
  1. Visit `/stay`, click `/apply to stay/i`.
  2. `selectDates()`, click `/search/i`.
  3. Within the listing's `div`/`h4` block, find and click a button
     matching `/log in to book/i` (note: uses `.get('button')` off the
     parents chain rather than `.contains('button', ...)` like Scenario 6
     — an inconsistency in the original spec worth normalizing in the
     port).
  4. `login({ isAdmin: true })`.
  5. Re-locate the same listing block and click "Select"
     (`contains('button', 'Select')`, matching Scenario 6's pattern).
  6. Assert `h1` `/food/i` visible, click `/continue/i` (visible+enabled).
  7. Assert URL includes `/summary`.
- **Selectors:** same fragile listing-card traversal as Scenario 6, plus
  `/log in to book/i`.
- **Mapping:** same as Scenario 6 —
  [closerdao/closer-procurement#628](https://github.com/closerdao/closer-procurement/issues/628).

### Scenario 8 — authenticated user (can instant book) hourly booking flow — full paid checkout

- **Intent:** same as Scenario 4 but for the hourly listing (`meeting-room`)
  using `selectDateAndTime()` instead of `selectDates()`.
- **Preconditions:** same as Scenario 4, but for `meeting-room`.
- **Steps:** identical shape to Scenario 4 (login → visit listing → select
  date+time → book now → food step → continue → checkout → fill Stripe →
  check all checkboxes → pay → confirmation → view booking → cancel →
  confirm cancel), substituting `selectDateAndTime()` and the
  `/12:00.*13:00/s` time-slot click.
- **Timing hacks:** same `cy.wait(16000)` after pay — do not port.
- **Mapping:** same as Scenario 4 —
  [closerdao/closer-procurement#630 📋](https://github.com/closerdao/closer-procurement/issues/630),
  extended to hourly listings (not explicitly called out in the ticket;
  worth confirming hourly is in scope for #630 or needs its own follow-up).

### Scenario 9 — unauthenticated user (can instant book) hourly booking flow

- **Intent:** unauthenticated visitor hitting the hourly listing gets
  routed through signup/login the same way as Scenario 2, but for
  `meeting-room`. Marked with a source comment
  `// TODO: add more realistic test for hourly booking` — the original
  author flagged this scenario as thin/unrealistic.
- **Steps:** visit `/stay/meeting-room`, `selectDateAndTime()`, click
  `/book now/i`, assert redirect to `signup?back=stay/meeting-room` then
  `/login?back=stay/meeting-room`, `login({ isAdmin: true })` (uses admin
  account despite testing the unauthenticated entry point), assert URL
  includes `/stay/meeting-room`.
- **Flagged as-is by original author:** "TODO: add more realistic test" —
  a Playwright port should treat this as a stub to actually improve rather
  than port verbatim.
- **Mapping:** same login/signup-redirect territory as Scenario 2; no
  dedicated ticket.

### Scenario 10 — authenticated overnight event booking flow (top-level `it`, not inside a `describe`)

- **Intent:** admin buys an "overnight ticket" for a seeded event, which
  routes through the same listing-search + food + checkout + pay flow as
  the stay bookings, then views and cancels the resulting booking.
- **Note:** this `it` and Scenario 11 are declared **outside** the
  `describe('Booking flow', ...)` block (after its closing `});`), at the
  top level of the file — a structural quirk of the original spec, not
  something to replicate; a Playwright port should put these inside a
  proper describe/group.
- **Preconditions:** event `cypress-test-event` exists with an "overnight
  ticket" option; `TEST_ADMIN_EMAIL`; Stripe test mode.
- **Steps:**
  1. Visit `/login`, `login({ isAdmin: true })`.
  2. Visit `/events/cypress-test-event`.
  3. Click `a` matching `/buy ticket/i`.
  4. Click button containing "overnight ticket" (case-insensitive via
     `{ matchCase: false }`), asserted to exist first.
  5. Click `/clear selection/i` button.
  6. `selectDates()`.
  7. Click `/search/i`.
  8. Same listing-card traversal as Scenario 6/7 to click "Select" for
     `glamping-private`.
  9. Assert `h1` `/food/i` visible, click `/continue/i` (visible+enabled).
  10. Click `/submit/i` button.
  11. Click `/checkout/i` button, assert URL includes `/checkout`, assert
      `/pay/i` disabled.
  12. `fillStripeForm()`, check all checkboxes, click `/pay/i`.
  13. **Hard wait: `cy.wait(16000)` — do not port.**
  14. Assert URL includes `/confirmation`.
  15. Click `/view ticket/i` (note: different label than the stay flow's
      "view booking").
  16. Assert URL includes `/bookings`.
  17. Click `/cancel booking/i`, assert URL includes `/cancel`, click
      `/yes/i`.
- **Selectors:** `/buy ticket/i`, "overnight ticket" (case-insensitive),
  `/clear selection/i`, `/submit/i`, `/view ticket/i`, plus everything
  reused from the stay-booking flow.
- **Mapping:** event ticketing + payment overlaps
  [closerdao/closer-procurement#630 📋](https://github.com/closerdao/closer-procurement/issues/630)'s
  payment path but is a distinct product surface (events, not stays) —
  no dedicated event-ticketing ticket exists under the epic yet; flagged
  as a gap for the epic's backlog.

### Scenario 11 — authenticated day ticket event booking flow (top-level `it`)

- **Intent:** admin buys the default (day) ticket for the same seeded
  event, skipping the listing/food selection since a day ticket doesn't
  require a stay.
- **Preconditions:** same event, `TEST_ADMIN_EMAIL`, Stripe test mode.
- **Steps:**
  1. Visit `/login`, `login({ isAdmin: true })`.
  2. Visit `/events/cypress-test-event`, click `/buy ticket/i`.
  3. Click `/continue/i` (no ticket-type selection step here, unlike
     Scenario 10 — implies day ticket is the default selection).
  4. Click `/submit/i`.
  5. Click `/checkout/i`, assert `/checkout` URL, assert `/pay/i` disabled.
  6. `fillStripeForm()`, check all checkboxes, click `/pay/i`.
  7. **Hard wait: `cy.wait(16000)` — do not port.**
  8. Assert `/confirmation` URL.
  9. Click `/view ticket/i`, assert `/bookings` URL.
  10. Click `/cancel booking/i`, assert `/cancel` URL, click `/yes/i`.
- **Mapping:** same gap as Scenario 10 — event ticketing has no dedicated
  ticket under [closerdao/closer-procurement#627 📋](https://github.com/closerdao/closer-procurement/issues/627)
  yet.

---

## Summary: scenario → epic ticket mapping

| # | Scenario | closer-procurement mapping |
|---|----------|------------------------------|
| 1 | Login redirects to home | Fixture basis for [#629](https://github.com/closerdao/closer-procurement/issues/629) (`loginAs`) |
| 2 | Unauth nightly booking → signup/login redirect | No dedicated ticket; related to #629 |
| 3 | Authed, non-instant-book request flow | No dedicated ticket; general scaffolding [#628](https://github.com/closerdao/closer-procurement/issues/628) |
| 4 | Authed instant-book nightly, full paid checkout | [#630 📋](https://github.com/closerdao/closer-procurement/issues/630) — explicitly references `booking.cy.js`; payment infra [#632](https://github.com/closerdao/closer-procurement/issues/632); refund adjacency [#631](https://github.com/closerdao/closer-procurement/issues/631) |
| 5 | Paid with credits (incomplete — stops at discount message) | No dedicated ticket; gap flagged |
| 6 | Listing search → summary | No dedicated ticket; general scaffolding [#628](https://github.com/closerdao/closer-procurement/issues/628) |
| 7 | Unauth listing search → login mid-flow → summary | Same as #6 |
| 8 | Hourly listing, full paid checkout | Same as #4, hourly scope unconfirmed |
| 9 | Unauth hourly booking redirect (author-flagged as thin) | Related to #629; needs real rewrite, not a straight port |
| 10 | Event overnight ticket, full paid checkout | No dedicated ticket; gap flagged for the epic |
| 11 | Event day ticket, full paid checkout | No dedicated ticket; gap flagged for the epic |

## Timing hacks to NOT port

Every occurrence of `cy.wait(<ms>)` in the original suite was a blind
sleep, not a wait on a real condition. A faithful Playwright port should
replace each with an explicit wait on the thing the sleep was standing in
for (navigation, response, element state):

- `login()` (both spec files): `cy.wait(2000)` after clicking "Log in" —
  replace with waiting for the post-login navigation.
- `booking.cy.js` Scenario 3: an extra `cy.wait(2000)` stacked after
  `login()` returns.
- `booking.cy.js` Scenario 6: `cy.wait(2000)` before asserting the
  `/summary` URL.
- Every full-payment scenario (4, 8, 10, 11): `cy.wait(16000)` after
  clicking "pay" — replace with waiting for the `/confirmation` navigation
  or a webhook/API-driven signal, not a fixed 16-second sleep.

No `cy.retries()` or custom retry logic was configured anywhere in the
suite or the config.
