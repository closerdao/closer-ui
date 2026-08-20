# Backend: incremental voting on a proposal

**Status:** ready for backend
**Blocks:** the "Cast more votes" flow already shipped in the UI — it is visible
to users but fails against the current endpoint
**Frontend:** `packages/closer/pages/governance/[slug].tsx`,
`packages/closer/components/Governance/VoteAmountSelector.tsx`

## Why

The vote widget no longer spends a member's whole voting weight in one shot.
The slider starts at `0` and the member drags it to choose how much of their
weight to commit, so partial votes are now the normal case rather than an edge
case. A member with `12.50` weight can cast `4.00` on Monday and decide to add
the remaining `8.50` on Thursday, after the discussion has moved.

`POST /proposals/:id/vote` currently rejects the second call with
`user_already_voted`. Until this ticket lands, the "Cast more votes" link in the
proposal page renders, the member drags the slider, presses submit, and gets
"You have already voted on this proposal." The feature is inert without the
backend change.

The frontend also now reads the member's committed weight back out of
`proposal.votes`, summing every entry whose `userId` matches, so it can show
"3.50 votes already cast" and compute what is left. That summing assumes the
backend appends rather than replaces — see *Storage* below.

## What changes

### `POST /proposals/:id/vote`

Request body is unchanged:

```json
{
  "votingWeight": 8.5,
  "signature": "0x…",
  "vote": "yes"
}
```

Accept the call when the member has already voted, **provided the new weight
fits inside their unspent balance**:

```
alreadyCast = sum of weights of this user's entries across votes.yes / no / abstain
remaining   = eligibleWeight(userId, proposal) - alreadyCast
```

- `votingWeight <= 0` → `400 invalid_vote_weight`
- `votingWeight > remaining` (allow a small epsilon, `0.01`, for float noise) →
  `400 vote_weight_exceeds_available` with the remaining amount in the body so
  the UI can correct the slider:
  ```json
  { "error": "vote_weight_exceeds_available", "remaining": 2.25 }
  ```
- `remaining <= 0` → keep returning `user_already_voted`. The UI hides the
  "Cast more votes" link in that state, so this is a race guard, not a normal
  path.

Everything else that already guards the endpoint stays as it is:
`proposal_not_active_for_voting`, `voting_period_not_active`, the signature
check, and the `member` role check.

### Eligible weight is fixed at proposal start

`remaining` must be computed against the weight the member had when voting
opened, not their live balance. Otherwise someone can vote, buy more tokens,
and vote again on the same proposal — the increments would compound into more
influence than a single-shot voter with the same holdings. Snapshot the
eligible weight on the member's first vote for a given proposal and reuse it for
every later increment on that proposal.

If eligible weight is already derived from a block height or a start-date
snapshot, reuse that; this ticket just needs it to be stable per (user,
proposal).

### Storage

Append a new `ProposalVote` entry rather than mutating the existing one:

```ts
type ProposalVote = {
  userId: string;
  signature: string;
  weight: number;
  votedAt: Date | string;
};
```

Appending keeps an audit trail of when influence was committed, which matters
for a governance record, and it is what the frontend's summing already expects.
Each increment carries its own signature, so each one stays independently
verifiable.

### Changing your mind

A member may cast `yes` first and `no` later — the slider does not force the
same option, and the UI pre-selects their previous choice only as a default.
Treat those as two independent commitments of weight: `4.00` to `yes` and
`8.50` to `no`. Do not move the earlier weight. The tallies in
`results.yes` / `results.no` / `results.abstain` are weight sums, so this falls
out of the append behaviour with no extra work.

If governance decides split votes should not be allowed, reject the mismatch
with `400 vote_option_mismatch` and say so here — the frontend can lock the
radio group instead. Confirm which way before implementing.

### Quorum and tallies

Quorum counts weight, not voters. A member who votes twice must count once
toward any voter-count metric and twice toward weight. Check
`getVoteCounts` / the quorum calculation for anywhere `votes.yes.length` is
used as a headcount.

## Response

**Return the updated proposal — with the vote just cast already in `votes`.**
This is a requirement, not a convenience.

```json
{
  "results": { "…the updated proposal, including the new vote…" },
  "userVote": {
    "castWeight": 12.5,
    "remainingWeight": 0,
    "lastVote": "yes"
  }
}
```

The frontend used to re-read the proposal with `GET /proposal/:slug` right after
voting and recompute the totals from `votes`. That read came back without the
vote that had just been written, so the panel showed "You cast 0.00 votes" and
offered the member their full weight again; a manual reload then showed the
correct 15.00. Whether that is replication lag or a cache in front of the read,
the vote response is the one place the write is certainly visible.

The frontend now prefers this response and falls back to appending the vote
locally, then only adopts the follow-up re-fetch if it has caught up. So the
display is correct either way — but returning a proposal that omits the vote
just written keeps every other reader of that endpoint wrong.

The `userVote` block is still optional; `results` is not.

## Test cases

| case | expectation |
| --- | --- |
| first vote, `4.0` of `12.5` | `200`, one entry, remaining `8.5` |
| second vote, `8.5` | `200`, two entries, remaining `0` |
| third vote, any amount | `400 user_already_voted` |
| second vote, `20.0` | `400 vote_weight_exceeds_available`, `remaining: 8.5` |
| second vote, `0` | `400 invalid_vote_weight` |
| second vote after buying tokens | remaining still computed from the snapshot |
| `yes` then `no` | both entries kept, tallies split by weight |
| two increments, quorum by headcount | member counted once |
| any successful vote | response `results.votes` already contains the new entry |
