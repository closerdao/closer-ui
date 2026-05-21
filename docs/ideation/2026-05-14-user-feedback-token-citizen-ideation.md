---
date: 2026-05-14
topic: user-feedback-token-citizen-conversion
focus: Harvest qualitative feedback on experience; diagnose barriers to buying tokens and completing citizenship
mode: repo-grounded
---

# Ideation: Feedback and token / citizenship conversion barriers

## Grounding context

**Codebase / product**

- Next.js app in `packages/closer` with multi-step **token** flows (`pages/token/index.tsx` → `before-you-begin` → fiat `nationality` / crypto `checklist-crypto` → `checkout`, plus `finance` for financed citizenship). **Citizenship** is gated by `NEXT_PUBLIC_FEATURE_CITIZENSHIP`, with an application path under `pages/subscriptions/citizen/*` and a marketing/entry surface at `pages/citizenship/index.tsx`.
- **Instrumentation today:** `utils/metrics.ts` posts to `POST /metric`. Token funnel emits events such as `buy-tokens`, `use-calculator`, `continue-before-you-begin-fiat` / `crypto`, `continue-before-you-begin-finance`, `sale-init-error`, crypto `approve`, `purchase-complete-crypto`, `purchase-error`, `purchase-validation-error`, and nationality / bank-transfer events. Subscriptions page logs `become-citizen-button-click` and related clicks. Citizen application completion posts `citizen-applied`.
- **Gaps:** no first-class in-product **qualitative** capture tied to funnel steps; many drops leave **no “why”** signal. `SurveyForm` + `/surveys` API exists for **operator-authored** surveys but is not wired as a default feedback layer on token/citizenship exits. Token/crypto errors already log metrics—rich for **where** people fail, weak for **reason in their words**.
- **Support-shaped signal:** `CheckoutPayment` and related flows call `reportIssue` with structured context on token payment failures—useful for mining **recurring barrier hypotheses** if aggregated.

**Strategy (`STRATEGY.md`)**

- Non-addictive, minimal-click product; **engagement depth and learning loops** track explicitly calls for learning what works and structured feedback without attention extraction. Ideas below are filtered for that fit.

**External (light)**

- Checkout and crypto-onboarding literature stresses **exit interviews and “why” capture** at failure points—not only aggregate funnel metrics—because doubt often accumulates *before* the final step.

**Past learnings**

- `docs/solutions/` empty in this workspace; no institutional doc hits.

## Ranked ideas

### 1. Funnel truth table from existing `/metric` events

**Description:** Define a canonical sequence (token landing → `buy-tokens` → `before-you-begin` branch → sale init → checkout / nationality / finance → success or error events). Join counts by `user` where available and compute step-to-step conversion and **error-coded exits** (`sale-init-error`, `purchase-error`, `purchase-validation-error`). Use this as the backbone before adding new UX.

**Warrant:** `direct:` Token pages already emit granular events (e.g. `packages/closer/pages/token/before-you-begin.tsx` `continue-before-you-begin-*`, `sale-init-error`; `packages/closer/pages/token/checkout.tsx` `purchase-error` / `purchase-complete-crypto`).

**Rationale:** You already pay the cost of instrumentation; most “we don’t know what’s blocking them” gaps are **analytics ownership**, not absence of signals.

**Downsides:** Still no spoken “why”; needs backend or warehouse discipline so events are queryable with identity and timestamps.

**Confidence:** 88%

**Complexity:** Medium

**Status:** Unexplored

---

### 2. One-tap “what stopped you?” on hard errors and sale-init failure

**Description:** On surfaces that already set user-visible errors (`createSaleError` on sale init, `purchase-error` / validation failures on token checkout), add an **optional** single-select + optional free text (collapsed by default, one expand). Log choice to `/metric` with a new event namespace (e.g. `token-exit-reason`) without blocking retry.

**Warrant:** `direct:` Error paths exist without qualitative follow-up (`before-you-begin.tsx` sale init catch; `checkout.tsx` failed `buyTokens` / confirm paths).

**Rationale:** Captures **high-signal moments** with minimal UI surface—aligned with minimal-click strategy if kept optional and non-modal.

**Downsides:** Response bias toward people who already engage with UI; needs careful copy so it does not feel blamey.

**Confidence:** 82%

**Complexity:** Low–Medium

**Status:** Unexplored

---

### 3. Cohort interviews from metric-defined buckets

**Description:** Weekly or monthly pull: e.g. users who hit `purchase-error` or `sale-init-error` vs users who reached `purchase-complete-crypto` / completed citizen application—sample **5–8** for a 15-minute interview. Script: replay their path, ask what they believed they were buying, trust, wallet, price, legal/KYC fears.

**Warrant:** `external:` Research pattern that abandonment causes are often upstream of the last click; complements existing metrics. `direct:` Metric events give cohort definitions.

**Rationale:** Only way to get honest “holding back” reasons (trust, comprehension, partner approval) that metrics cannot see.

**Downsides:** Labor-intensive; selection bias if only power users opt in to calls.

**Confidence:** 79%

**Complexity:** Medium (process, not only code)

**Status:** Unexplored

---

### 4. Post-success micro-feedback (token paid, citizen milestone)

**Description:** After `purchase-complete-crypto`, financed contract signed, or citizen validation approved, show a **one-question** CSAT or “what almost stopped you?” **retro** for completed journeys. Different copy than error capture; optional skip.

**Warrant:** `reasoned:` Success cohorts reveal friction they overcame; cheap relative to intercepting cold traffic. Fits STRATEGY “learning loops” without nagging incomplete users.

**Downsides:** Survivorship bias; lower response rate than error prompts.

**Confidence:** 74%

**Complexity:** Low

**Status:** Unexplored

---

### 5. Mine `reportIssue` + support channels for barrier themes

**Description:** Token payment failures already bundle context in `CheckoutPayment` `reportIssue` payloads (balances, network, wallet flags). Periodically tag and theme these strings; correlate with `purchase-error` metrics.

**Warrant:** `direct:` `packages/closer/components/CheckoutPayment.js` constructs detailed `TOKEN PAYMENT ERROR` reports.

**Rationale:** Uses **existing** voluntary signal from confused users—no new UI.

**Downsides:** Only covers users who reach payment; manual or semi-automated triage needed.

**Confidence:** 77%

**Complexity:** Low–Medium

**Status:** Unexplored

---

### 6. Operator-deployed surveys on the existing `/surveys` stack

**Description:** Use `SurveyForm` / `/surveys` to let each land project run **post-stay** or **post-event** experience surveys and, where appropriate, a “interest in tokens / citizenship” question. Central team aggregates templates.

**Warrant:** `direct:` `packages/closer/components/SurveyForm.tsx` and API routes referenced there.

**Rationale:** Matches federated product: feedback **per community** with optional rollup; avoids a single heavy-handed global popup.

**Downsides:** Heterogeneous data quality; depends on operators prioritizing setup.

**Confidence:** 71%

**Complexity:** Medium (product + playbook, not only engineering)

**Status:** Unexplored

---

## Rejection summary

| # | Idea | Reason rejected |
|---|------|-----------------|
| 1 | Add Intercom / generic chat widget sitewide | Too expensive in attention; conflicts with non-addictive stance unless tightly scoped |
| 2 | Session replay for all pages | High privacy/compliance cost; vague ROI vs targeted funnel replay |
| 3 | A/B test every headline on `/token` | Interesting but better as brainstorm variant; weak warrant without hypothesis |
| 4 | Email drip for all abandons | Needs consent + infra; “interesting” but not grounded in existing capture points |
| 5 | Pay users in tokens for feedback | Policy/legal complexity; subject drifts to incentive design |
| 6 | NPS modal on every login | Violates minimal-friction / non-addictive product bar |
| 7 | Blockchain-only analytics | On-chain shows txs not intent; duplicates stronger metric-funnel idea |
| 8 | “Add a feedback page in footer” | Too vague; low response without distribution strategy |
| 9 | Duplicate of #1 with only “use Google Analytics” | Not actionable; already have custom events |

## Cost note

Full `ce-ideate` harness would dispatch ~9 parallel agents (codebase + learnings + web + 6 ideation frames). This run used a **single orchestrator pass** with repo search + light web grounding, then local merge/critique, to fit the Cursor session while preserving the skill’s structure (grounding → candidates → adversarial filter → survivors).
