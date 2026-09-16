# Legitimate interest assessment: PostHog analytics and session replay

Records the balancing test under GDPR Article 6(1)(f) for the product
analytics and session replay described in
[`posthog-dpa-clause.md`](./posthog-dpa-clause.md). Each community operating a
Closer-powered platform is the controller for its members' data; Closer
processes on the community's instructions. Review with counsel; this is a
working document, not legal advice.

| Field         | Value                                              |
| ------------- | -------------------------------------------------- |
| Controller    | The community operating the platform               |
| Processor     | Closer (platform operator)                         |
| Sub-processor | PostHog, Inc., PostHog Cloud EU (`eu.posthog.com`) |
| Last reviewed | 2026-09-16                                         |

## 1. Purpose test

**Interest pursued.** Keeping the platform working and usable: finding broken
flows, reproducing reported bugs, measuring whether features are used, and
detecting abuse. Communities depend on the platform for bookings, payments and
governance, so failures have direct operational cost.

**Is it legitimate?** Yes. Running and improving a service the community
offers to its members is a recognised legitimate interest (Recital 47, EDPB
guidance on legitimate interest). The data is not used for advertising,
marketing profiling or sale.

## 2. Necessity test

**Could the purpose be achieved with less data?**

- Aggregate page-view counts alone do not show _why_ a flow fails. Session
  replays are the tool that lets support reproduce a member's problem without
  asking them to re-enact it.
- Replays are limited: all form inputs are masked, and elements showing
  contact details, identity or tax documents, bank details, wallet addresses
  and health data are masked in the browser and never transmitted.
- Click events have email addresses and phone numbers stripped before
  transmission.
- No persistent identifier is written before the visitor accepts cookies.
  Pre-consent analytics is memory-only and is not linked across visits.
- Person profiles are only created for signed-in users, not anonymous
  visitors.
- Surveys, product tours and cross-origin iframe capture are disabled.

The processing is limited to what the diagnostic purpose needs.

## 3. Balancing test

**Nature of the data.** Mostly behavioural (pages, clicks, timings) and
technical (browser, device, approximate location from IP). Special-category
data and financial identifiers are excluded by masking. Residual risk: text
that a member types into a free-text field is masked, but text rendered on
screen from the member's own profile could appear in a replay unless the
element is tagged. The platform tags known personal-data elements; new pages
must follow the same convention.

**Reasonable expectations.** Members of a community platform reasonably expect
the operator to monitor how the platform works. They would be less likely to
expect screen replays, which is why replays are explicitly disclosed in the
privacy policy (section 7.1) and mentioned in the cookie notice.

**Impact on the data subject.** Low. Data is hosted in the EU, access is
limited to the Closer team, replays expire after 30 days, and nothing is
shared with third parties or used for decisions about the member.

**Safeguards.**

- Masking by default for inputs, plus explicit tagging of personal-data
  elements (`data-ph-mask` and `ph-no-capture`).
- Contact details scrubbed from events before they leave the browser.
- EU hosting, memory-only persistence pre-consent, identified profiles only.
- Retention limits (30 days for replays, 12 months for events).
- Right to object honoured via the team contact address in the privacy
  policy; account deletion removes the analytics identity.

**Outcome.** The community's interest in operating and improving its platform
is not overridden by members' interests, given the masking, EU hosting, short
retention and disclosure. Legitimate interest is an appropriate basis.

## 4. Open actions

- Confirm the PostHog project retention settings match the stated 30 days /
  12 months and record the date checked.
- Re-run this assessment if replays are shared with community operators, if
  hosting leaves the EU, or if masking defaults are relaxed.
- Replace any community cookie policy PDF that still references Google
  Analytics (for example `apps/moos/public/pdf/cookie-policy.pdf`).
