---
date: 2026-05-14
topic: reviews-that-dont-suck
focus: Product and UX ideation for trustworthy, useful reviews (UI branch feat-reviews)
mode: repo-grounded
---

# Ideation: Reviews that don’t suck

## Context (feat-reviews branch)

The in-progress surface (see branch **`feat-reviews`**) adds booking-linked reviews: `ReviewForm`, `pages/bookings/[slug]/review.tsx`, `POST /review`, and a structured payload (`rating`, `title`, `content`, `photos`, `aspect` sub-scores, `recommend`, tied to `booking` + `listing`).

The current form **initializes overall rating and every aspect at 5** and **`recommend` at true**. That is convenient for happy-path testing but is exactly the pattern that produces **inflated, low-variance, low-signal** review corpora unless deliberately countered elsewhere in the journey, copy, and display logic.

This document is **ideation only**—no implementation commitment.

---

## What “sucks” means (working definition)

Reviews read as useless or harmful when they are:

1. **Interchangeable** — Same adjectives for every place; no specifics a future guest could act on.
2. **Inflated** — Clustered at 4.8–5.0 because defaults, social pressure, or fear of hurting hosts.
3. **Mistimed** — Asked too early (before experience landed) or so late that only the annoyed remain.
4. **Coercive** — Nag loops, dark patterns, or “rate us five stars” energy.
5. **Unanchored** — Reader cannot tell what *kind* of stay or guest wrote it (length, purpose, season).
6. **Performative for the platform** — Written for the algorithm or the host’s feelings, not for the next person choosing a place.

“Good” reviews for Closer are closer to **field notes for peers** than to generic marketplace stars: specific, kind when critical, and **verifiably tied to a real stay** (which you already have via `booking`).

---

## Principles (non-negotiables)

1. **Default neutral, not default praise** — Initial UI state should not imply “everything is already perfect.” Neutral or “unset” aspect and overall scores until the guest touches them, or an explicit “skip aspect detail” path that does not silently save as all-fives.
2. **Specificity over volume** — One paragraph that names real things beats five sliders left at default.
3. **Timing beats reminders** — Single well-placed ask after the experience has settled (e.g. day after checkout or first quiet morning), not a drip campaign.
4. **Asymmetry of pain** — Low scores should take **no more** friction than high scores (no extra modals only for critics); optionally **one** optional follow-up prompt for *any* extreme score (“what would have changed one star?”) to reduce drive-by trashing and drive-by five-stars.
5. **Reader-first display** — Surfacing rules should down-rank empty praise and boost reviews with concrete nouns (spaces, food, noise, governance touchpoints if relevant).
6. **Community alignment** — Fits `STRATEGY.md`: non-addictive, low-click; reviews serve **stewardship and clarity**, not engagement hacking.

---

## Collection UX (relative to current feat-reviews shape)

### A. Kill the “all fives” silent submit

- **Problem:** Submitting without touching sliders still sends top scores everywhere.
- **Directions:** Start aspects and overall as `null` / “not rated” with validation that either overall or aspects are explicitly set, or require a minimum **text** length when overall is high so “5 + empty” is rare. Another variant: show “You haven’t adjusted scores—still submit as written-only feedback?” with no numeric row stored unless confirmed.

### B. Replace generic Airbnb dimensions where they misfit

Cleanliness / communication / check-in / accuracy / value are fine for anonymous short lets; **regenerative land stays** may care more about **expectations vs reality** (rules, silence, shared labor, kids, animals, connectivity, governance meetings). Ideation: **one configurable aspect set per listing type** (or per `listing` metadata) so the same `ReviewForm` component swaps labels and help text without forcing ecovillage guests to score “check-in” like a hotel desk.

### C. Prompts that elicit nouns

Instead of only “title” + “content”, optional **chips or short prompts**: “Best surprise”, “One thing to know before booking”, “Would you return—and why yes/no”. These become searchable later and reduce copy-paste praise.

### D. Photos with purpose

Photos default empty—good. Add light copy: “Optional: one photo that shows what words can’t.” Discourage bathroom selfies and ten sunsets unless tied to a claim (“common area at dusk—quieter than we expected”).

### E. “Recommend” checkbox

Binary recommend is useful but correlates with overall star. Consider **decoupling** or labeling clearly: “Recommend to a friend *with similar expectations*” to reduce guilt-five-stars from people who liked it but wouldn’t universalize.

---

## Journey and eligibility

- **Who may review:** Already gated to booking owner on feat-reviews—keep that. For future token-sale reviews, mirror the same **hard link to a completed, non-disputed event** (sale id / stay id).
- **When to show the ask:** After checkout completion + cooldown (e.g. 24–48h), **one** primary channel (email with deep link *or* in-app banner on next visit), aligned with engagement loops without stacking nag modals.
- **Who must not be nagged:** Users who already submitted; users with open support tickets on the same booking (review could be conflated with dispute—defer ask).

---

## Display and trust (where many products stop thinking)

1. **Show stay context next to every review** — Dates (season), length of stay, party size band, maybe “first visit / return.” Reduces “it was perfect” with no frame.
2. **Diversity in the first screen** — If the API returns ten five-star one-liners, the UI should **not** show ten identical cards; mix in longer text, one critical-but-fair review, or “most detailed this quarter.”
3. **Host response** — Optional short response from listing operators (time-boxed, tone guidelines) increases usefulness without hiding criticism.
4. **Report + mediation** — Lightweight flag for policy violations; prevents reviews becoming a weapon without a path.

---

## Metrics (how you know reviews don’t suck)

- **Distribution:** Overall star variance by listing (not chasing a target curve, but detecting “all fives + empty text”).
- **Completion quality:** Median content length, % with at least one concrete noun phrase (even rough heuristics), % with photos when claim is visual.
- **Downstream:** Do readers who expand reviews convert differently? Do low-rated dimensions correlate with refunds or support tickets? (Sanity check that scores mean something.)

---

## Anti-patterns to explicitly reject

- Gamification (“You’re on a 3-week review streak!”).
- Punishing hosts in search for **honest** sub-four scores (creates rating inflation).
- Showing only top-line averages without exposing **count** and recency.
- Asking for a review **before** checkout or before the guest has slept one full night on site.

---

## Handoff

- **Implementation** lives primarily on **`feat-reviews`** for booking reviews; extend patterns for token-sale or citizenship when those flows have a comparable “completed event” anchor.
- **Next step** if you want requirements: `/ce-brainstorm` seeded from one slice (e.g. “neutral defaults + listing-type aspects” or “reader-first listing UI”).
