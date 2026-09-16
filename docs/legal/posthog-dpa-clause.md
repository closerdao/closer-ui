# Analytics and session replay: data processing clause

Draft clause for the data processing agreement (DPA) between a community
operating a Closer-powered platform (the **Community**, controller) and Closer
(the **Processor**). Pair it with the legitimate interest assessment in
[`posthog-legitimate-interest-assessment.md`](./posthog-legitimate-interest-assessment.md).
Review with counsel before signing; this is a starting point, not legal advice.

## Clause: product analytics and session replay

1. **Instruction.** The Community instructs the Processor to collect product
   analytics and session replays from the Community's platform for the sole
   purposes of (a) operating and securing the platform, (b) diagnosing errors
   and (c) improving usability. The Processor shall not use this data for any
   other purpose, including advertising, profiling for marketing, or sale to
   third parties.

2. **Data collected.** Page views, clicks and other interaction events,
   performance and error telemetry, browser and device metadata, approximate
   location derived from IP address, and session replays (a reconstruction of
   on-screen interactions). Form inputs are masked in the browser before
   transmission. Elements displaying contact details, identity or tax
   documents, bank details, wallet addresses and health information are masked
   in the browser and are not transmitted. Email addresses and phone numbers
   are stripped from captured click events.

3. **Special categories.** The Processor shall configure the platform so that
   health data, identity documents and financial account details are never
   included in analytics events or session replays. If such data is
   discovered in analytics data, the Processor shall delete it without undue
   delay and notify the Community.

4. **Consent state.** Before a visitor accepts cookies, analytics runs in
   memory only: no identifier is written to cookies or local storage and
   activity is not linked across visits. A persistent identifier is stored
   only after the visitor accepts cookies via the platform's cookie notice.

5. **Sub-processor.** The Processor uses PostHog, Inc. as a sub-processor for
   this purpose, with data hosted in the European Union (PostHog Cloud EU,
   `eu.posthog.com`). PostHog's DPA and sub-processor list apply. The
   Processor shall notify the Community before replacing this sub-processor or
   moving hosting outside the EEA.

6. **Access.** Access to analytics and session replay data is limited to the
   Processor's staff who need it to perform the services above. Community
   operators do not receive direct access to the analytics project. The
   Processor shall provide the Community with aggregate reports on request.

7. **Retention.** Session replays are retained for no more than 30 days and
   event data for no more than 12 months, after which they are deleted
   automatically. The Community may instruct a shorter retention period.

8. **Data subject requests.** The Processor shall assist the Community with
   access, objection and deletion requests relating to analytics data within
   the timeframes set out in the main DPA. Deletion of a user's account on the
   platform triggers deletion of the analytics identity associated with that
   account.

9. **Transparency.** The Community shall ensure its privacy notice discloses
   the processing described here. The Processor provides default privacy
   policy and cookie notice text on the platform for this purpose.
