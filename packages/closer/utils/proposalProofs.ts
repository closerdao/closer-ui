import { ProposalLockState, ProposalVote } from '../types';

import { WEIGHT_PRECISION } from './proposalAttestation';

/**
 * Rebuilding a finalized proposal's proof digest in the browser.
 *
 * This is a mirror of `buildProofs` / `hashProofs` in the API's
 * utils/proposalStatus.js and has to stay byte-exact with it: six decimals on
 * the weight, ISO-8601 with milliseconds on the timestamp, the raw signature
 * string, fields joined on `:` and leaves folded on `\n`. Anything off by a
 * character turns honest data into a red mismatch, which is worse than showing
 * nothing - so the format lives in exactly one function, `buildProofLeafInput`,
 * and is pinned by a fixture taken from the API's own output.
 */

export type ProofLeafSource = {
  index: number;
  userId: string;
  vote: 'yes' | 'no' | 'abstain';
  weight: number;
  votedAt: Date | string | null | undefined;
  signature: string;
};

/**
 * The exact string one proof leaf is the sha256 of.
 *
 * Mirrors the API:
 *   sha256(`${index}:${userId}:${vote}:${weight}:${votedAt}:${signature}`)
 */
export const buildProofLeafInput = ({
  index,
  userId,
  vote,
  weight,
  votedAt,
  signature,
}: ProofLeafSource): string => {
  const votedAtDate = votedAt ? new Date(votedAt) : null;
  const isoVotedAt =
    votedAtDate && !Number.isNaN(votedAtDate.getTime())
      ? votedAtDate.toISOString()
      : '';

  return [
    index,
    String(userId ?? ''),
    vote,
    (Number(weight) || 0).toFixed(WEIGHT_PRECISION),
    isoVotedAt,
    signature ?? '',
  ].join(':');
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const subtle = (): SubtleCrypto | null =>
  typeof crypto !== 'undefined' ? (crypto.subtle ?? null) : null;

/** sha256 of a string, hex, using the browser's own crypto. */
export const sha256Hex = async (value: string): Promise<string> => {
  const crypto = subtle();

  if (!crypto) {
    throw new Error('WebCrypto is not available in this browser.');
  }

  const digest = await crypto.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );

  return toHex(digest);
};

// Hashing is fast, but a proposal with a few thousand votes still adds up to
// enough work to drop frames. Yielding between chunks keeps the panel
// responsive while it folds.
const CHUNK_SIZE = 200;

const yieldToEventLoop = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

/** Every leaf hash, in the order given, computed a chunk at a time. */
export const hashProofLeaves = async (
  leaves: ProofLeafSource[],
): Promise<string[]> => {
  const hashes: string[] = [];

  for (let start = 0; start < leaves.length; start += CHUNK_SIZE) {
    const chunk = leaves.slice(start, start + CHUNK_SIZE);

    hashes.push(
      ...(await Promise.all(
        chunk.map((leaf) => sha256Hex(buildProofLeafInput(leaf))),
      )),
    );

    if (start + CHUNK_SIZE < leaves.length) {
      await yieldToEventLoop();
    }
  }

  return hashes;
};

/** The single digest over the ordered leaves. */
export const hashProofs = (leafHashes: string[]): Promise<string> =>
  sha256Hex(leafHashes.join('\n'));

export type ProposalVoteBuckets = {
  yes?: ProposalVote[];
  no?: ProposalVote[];
  abstain?: ProposalVote[];
};

/**
 * The signature a proof leaf commits to.
 *
 * `lockState.proofs` deliberately does not carry signatures - they stay in
 * `proposal.votes` where they already were - so every leaf has to be paired
 * back up with the vote it was built from. Same member, same option, same
 * instant is the identity the API sorted on, and a vote already claimed by an
 * earlier leaf is not offered again: a member who voted twice for the same
 * option at the same millisecond would otherwise collapse into one signature.
 */
const buildSignatureLookup = (votes: ProposalVoteBuckets | undefined) => {
  const byKey = new Map<string, string[]>();

  (['yes', 'no', 'abstain'] as const).forEach((option) => {
    (votes?.[option] || []).forEach((vote) => {
      const votedAt = vote?.votedAt ? new Date(vote.votedAt).getTime() : 0;
      const key = `${String(vote?.userId ?? '')}:${option}:${votedAt}`;

      byKey.set(key, (byKey.get(key) || []).concat(vote?.signature || ''));
    });
  });

  return (leaf: ProposalLockState['proofs'][number]): string | null => {
    const votedAt = leaf.votedAt ? new Date(leaf.votedAt).getTime() : 0;
    const key = `${String(leaf.userId ?? '')}:${leaf.vote}:${votedAt}`;
    const queued = byKey.get(key);

    if (!queued || queued.length === 0) {
      return null;
    }

    return queued.shift() ?? null;
  };
};

export type ProofRecomputation =
  | { state: 'computed'; proofsHash: string; leafHashes: string[] }
  /**
   * The proofs cannot be re-derived from what this page holds - a proof with no
   * matching vote, or a browser with no WebCrypto. Deliberately not a mismatch:
   * "we could not check" and "it does not match" mean opposite things to a
   * citizen and must never render the same.
   */
  | { state: 'unavailable'; reason: 'missing-signatures' | 'no-crypto' };

/**
 * Recompute `lockState.proofsHash` from the vote list, in the browser.
 *
 * The proofs are walked in the order the API stored them, which is the order
 * their indices already encode - re-sorting here would be re-deciding something
 * the record has already fixed.
 */
export const recomputeProofsHash = async (
  lockState: Pick<ProposalLockState, 'proofs'> | null | undefined,
  votes: ProposalVoteBuckets | undefined,
): Promise<ProofRecomputation> => {
  const proofs = lockState?.proofs || [];
  const findSignature = buildSignatureLookup(votes);
  const leaves: ProofLeafSource[] = [];

  for (const proof of proofs) {
    const signature = findSignature(proof);

    if (signature === null) {
      return { state: 'unavailable', reason: 'missing-signatures' };
    }

    leaves.push({
      index: proof.index,
      userId: String(proof.userId),
      vote: proof.vote,
      weight: proof.weight,
      votedAt: proof.votedAt,
      signature,
    });
  }

  try {
    const leafHashes = await hashProofLeaves(leaves);

    return {
      state: 'computed',
      proofsHash: await hashProofs(leafHashes),
      leafHashes,
    };
  } catch {
    return { state: 'unavailable', reason: 'no-crypto' };
  }
};
