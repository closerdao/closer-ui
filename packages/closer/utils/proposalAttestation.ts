import { ethers } from 'ethers';

import {
  ProposalLockState,
  ProposalOnChainAttestation,
  ProposalVote,
} from '../types';

export type { ProposalOnChainAttestation };

/**
 * Reading a published proposal attestation, in the browser, without the API.
 *
 * The point of the whole feature is that a citizen can check what this page is
 * telling them against what the DAO signer wrote to Celo. So everything here
 * works from two inputs only - the transaction calldata fetched straight from a
 * public RPC, and the vote list the proposal already ships - and never from a
 * field the API computed for us.
 */

// keccak256("CloserProposalResult(v1)").slice(0, 10). Bumped by the API if the
// payload layout ever changes, so a reader can tell an old attestation from a
// new shape rather than decoding one against the other.
export const PROPOSAL_RESULT_SELECTOR = '0xcf7756b2';

// Weights are floats summed off chain balances. Both the proof leaves and the
// on-chain encoding pin them to six decimals so a re-derivation on any machine
// lands on the digest that was stored - mirrors WEIGHT_PRECISION in the API's
// utils/proposalStatus.js.
export const WEIGHT_PRECISION = 6;

// The argument list the API encodes after the selector, in order. Mirrors
// RESULT_TYPES in the API's utils/proposalOnChain.js.
const RESULT_TYPES = [
  'bytes32', // proposal id, the 12-byte ObjectId right-aligned
  'string', // slug, so the record is readable without the database
  'uint8', // outcome: 1 passed, 0 rejected
  'uint256', // yes weight, 18 decimals
  'uint256', // no weight
  'uint256', // abstain weight
  'uint256', // the quorum stamped when voting opened
  'uint256', // distinct voters
  'bool', // finalized before the window closed
  'uint256', // finalizedAt, unix seconds
  'bytes32', // the digest over the proof leaves
];

export type DecodedProposalResult = {
  /** The bare 24-hex ObjectId, as `proposal._id` reads. */
  proposalId: string;
  slug: string;
  outcome: 'passed' | 'rejected';
  results: { yes: number; no: number; abstain: number };
  quorum: number;
  voterCount: number;
  finalizedEarly: boolean;
  finalizedAt: Date;
  /** 64 hex characters, no `0x` - the same shape `lockState.proofsHash` has. */
  proofsHash: string;
};

const stripHexPrefix = (value: string): string =>
  value.startsWith('0x') || value.startsWith('0X') ? value.slice(2) : value;

/** A weight the chain carries at 18 decimals, back as the number it was. */
const fromWeight = (value: ethers.BigNumber): number =>
  Number(ethers.utils.formatUnits(value, 18));

/**
 * The result an attestation carries, decoded from its raw calldata.
 *
 * Returns null for anything that is not one of our attestations: a transaction
 * with no calldata, a different selector, or a payload that does not decode
 * against the layout above. The caller is expected to also check that the
 * decoded `proposalId` is the proposal being looked at - a well-formed
 * attestation for some *other* proposal proves nothing about this one.
 */
export const decodeProposalResult = (
  input: string | null | undefined,
): DecodedProposalResult | null => {
  if (typeof input !== 'string') {
    return null;
  }

  const data = `0x${stripHexPrefix(input)}`;

  if (data.slice(0, 10).toLowerCase() !== PROPOSAL_RESULT_SELECTOR) {
    return null;
  }

  let decoded: ethers.utils.Result;

  try {
    decoded = ethers.utils.defaultAbiCoder.decode(
      RESULT_TYPES,
      `0x${data.slice(10)}`,
    );
  } catch {
    return null;
  }

  const [
    proposalId,
    slug,
    outcome,
    yes,
    no,
    abstain,
    quorum,
    voterCount,
    finalizedEarly,
    finalizedAt,
    proofsHash,
  ] = decoded;

  return {
    // The ObjectId is right-aligned in the word: the last 24 hex characters.
    proposalId: stripHexPrefix(proposalId).slice(-24),
    slug,
    outcome: Number(outcome) === 1 ? 'passed' : 'rejected',
    results: {
      yes: fromWeight(yes),
      no: fromWeight(no),
      abstain: fromWeight(abstain),
    },
    quorum: fromWeight(quorum),
    voterCount: Number(voterCount.toString()),
    finalizedEarly: Boolean(finalizedEarly),
    finalizedAt: new Date(Number(finalizedAt.toString()) * 1000),
    proofsHash: stripHexPrefix(proofsHash).toLowerCase(),
  };
};

/** Whether a decoded attestation is the one belonging to this proposal. */
export const isAttestationForProposal = (
  decoded: DecodedProposalResult | null,
  proposalId: string | undefined,
): boolean =>
  Boolean(
    decoded &&
      proposalId &&
      decoded.proposalId.toLowerCase() === String(proposalId).toLowerCase(),
  );

/**
 * Where each chain can be read and browsed.
 *
 * The API sends `onChain.chainId` but, today, no explorer URL - so the mapping
 * lives here. It should not: the API already knows which Blockscout it talks to
 * and every client would otherwise keep its own copy of this table. If
 * `onChain.explorerUrl` ever starts arriving, `getExplorerTxUrl` prefers it and
 * this table becomes the fallback for older records.
 *
 * The RPC is deliberately a public endpoint rather than anything of ours:
 * reading the attestation back through our own infrastructure would defeat the
 * point of publishing it.
 */
const CHAINS: Record<
  number,
  { name: string; rpcUrl: string; explorerUrl: string }
> = {
  42220: {
    name: 'Celo',
    rpcUrl: 'https://forno.celo.org',
    explorerUrl: 'https://explorer.celo.org/mainnet',
  },
  44787: {
    name: 'Celo Alfajores',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    explorerUrl: 'https://celo-alfajores.blockscout.com',
  },
  11142220: {
    name: 'Celo Sepolia',
    rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
    explorerUrl: 'https://celo-sepolia.blockscout.com',
  },
};

export const getChainName = (chainId: number | undefined): string =>
  (chainId && CHAINS[chainId]?.name) || `chain ${chainId ?? '?'}`;

export const getChainRpcUrl = (chainId: number | undefined): string | null =>
  (chainId && CHAINS[chainId]?.rpcUrl) || null;

/**
 * The human explorer page for an attestation, or null when we cannot name one.
 * Null is a real answer: linking somewhere that does not exist is worse than
 * showing the hash on its own.
 */
export const getExplorerTxUrl = (
  onChain: Pick<ProposalOnChainAttestation, 'chainId' | 'txHash'> &
    Partial<Pick<ProposalOnChainAttestation, 'explorerUrl'>>,
): string | null => {
  if (!onChain?.txHash) {
    return null;
  }

  const base = onChain.explorerUrl || CHAINS[onChain.chainId]?.explorerUrl;

  return base ? `${base.replace(/\/+$/, '')}/tx/${onChain.txHash}` : null;
};

/** A hash the eye can compare without a horizontal scrollbar. */
export const truncateMiddle = (
  value: string | undefined | null,
  lead = 10,
  tail = 8,
): string => {
  const text = String(value ?? '');

  return text.length <= lead + tail + 1
    ? text
    : `${text.slice(0, lead)}…${text.slice(-tail)}`;
};

/**
 * The citizen's own leaf in the frozen record, paired with the signature they
 * signed it with. An abstract digest matching convinces nobody; seeing their
 * own vote sitting in the record that was hashed does.
 */
export type OwnVoteProof = {
  index: number;
  vote: 'yes' | 'no' | 'abstain';
  weight: number;
  votedAt: Date | string;
  hash: string;
  signature: string | null;
};

export const findOwnVoteProofs = (
  lockState: ProposalLockState | null | undefined,
  votes:
    | { yes?: ProposalVote[]; no?: ProposalVote[]; abstain?: ProposalVote[] }
    | undefined,
  userId: string | undefined,
): OwnVoteProof[] => {
  if (!lockState?.proofs || !userId) {
    return [];
  }

  return lockState.proofs
    .filter((proof) => String(proof.userId) === String(userId))
    .map((proof) => {
      const votedAt = proof.votedAt ? new Date(proof.votedAt).getTime() : 0;
      const match = (votes?.[proof.vote] || []).find(
        (vote) =>
          String(vote.userId) === String(userId) &&
          (vote.votedAt ? new Date(vote.votedAt).getTime() : 0) === votedAt,
      );

      return {
        index: proof.index,
        vote: proof.vote,
        weight: proof.weight,
        votedAt: proof.votedAt,
        hash: proof.hash,
        signature: match?.signature ?? null,
      };
    });
};
