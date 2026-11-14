/**
 * Publishing a signed vote to IPFS, independent of the closer-api backend.
 *
 * A vote already carries a real wallet signature (`signMessage` in
 * handleVote) - verifying it is public-key math anyone can do themselves
 * with `ethers.utils.verifyMessage`. The only real gap is data availability:
 * making the signed record reachable somewhere Closer doesn't solely
 * control. This module builds that record and publishes it, kept separate
 * from handleVote's own logic so a pinning-provider outage is easy to
 * isolate and never blocks a vote - see closer-ui#1178.
 */

export type VoteChoice = 'yes' | 'no' | 'abstain';

export type VotePayload = {
  proposalId: string;
  vote: VoteChoice;
  weight: number;
  votedAt: string; // ISO-8601
};

export const buildVotePayload = (
  proposalId: string,
  vote: VoteChoice,
  weight: number,
): VotePayload => ({
  proposalId,
  vote,
  weight,
  votedAt: new Date().toISOString(),
});

export type PublishResult =
  | { published: true; cid: string; gatewayUrl: string }
  | { published: false; reason: string };

const gatewayUrlFor = (cid: string) => `https://ipfs.io/ipfs/${cid}`;

/**
 * Publishes { payload, signature, signerAddress } to IPFS via a pinning
 * provider's HTTP API. Never throws - the caller can always continue
 * submitting the vote itself regardless of the outcome here.
 *
 * IPFS_PINNING_ENDPOINT / NEXT_PUBLIC_IPFS_PINNING_TOKEN are unset by
 * default (see .env.sample); until a provider is configured this always
 * returns `{ published: false, reason: 'ipfs_not_configured' }`.
 */
export const publishVoteToIPFS = async (
  payload: VotePayload,
  signature: string,
  signerAddress: string,
): Promise<PublishResult> => {
  const endpoint = process.env.IPFS_PINNING_ENDPOINT;
  const token = process.env.NEXT_PUBLIC_IPFS_PINNING_TOKEN;

  if (!endpoint || !token) {
    return { published: false, reason: 'ipfs_not_configured' };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload, signature, signerAddress }),
    });

    if (!response.ok) {
      return { published: false, reason: `ipfs_http_${response.status}` };
    }

    const data = await response.json();

    if (!data?.cid || typeof data.cid !== 'string') {
      return { published: false, reason: 'ipfs_missing_cid' };
    }

    return {
      published: true,
      cid: data.cid,
      gatewayUrl: gatewayUrlFor(data.cid),
    };
  } catch (err) {
    return {
      published: false,
      reason: err instanceof Error ? err.message : 'ipfs_unknown_error',
    };
  }
};
