import {
  buildProofLeafInput,
  hashProofs,
  hashProofLeaves,
  recomputeProofsHash,
  sha256Hex,
} from '../proposalProofs';
import { API_PROOFS_FIXTURE } from '../__fixtures__/proposalAttestation.fixture';

const { votes, proofs, proofsHash } = API_PROOFS_FIXTURE;

const index0 = (value: number) => String(value).padStart(4, '0');

// The signature each leaf was built from, in leaf order.
const signatureFor = (index: number) =>
  ({
    0: votes.yes[0].signature,
    1: votes.no[0].signature,
    2: votes.yes[1].signature,
    3: votes.abstain[0].signature,
  })[index] as string;

const leafSources = proofs.map((proof) => ({
  index: proof.index,
  userId: proof.userId,
  vote: proof.vote,
  weight: proof.weight,
  votedAt: proof.votedAt,
  signature: signatureFor(proof.index),
}));

describe('buildProofLeafInput', () => {
  it('joins the fields on : in the order the API hashes them', () => {
    expect(buildProofLeafInput(leafSources[0])).toBe(
      [
        0,
        '65f1a2b3c4d5e6f701234567',
        'yes',
        '4.000000',
        '2026-08-18T09:14:02.512Z',
        votes.yes[0].signature,
      ].join(':'),
    );
  });

  it('pins the weight to six decimals, padding and truncating alike', () => {
    expect(buildProofLeafInput({ ...leafSources[0], weight: 0.5 })).toContain(
      ':0.500000:',
    );
    expect(
      buildProofLeafInput({ ...leafSources[0], weight: 504.1234564999 }),
    ).toContain(':504.123456:');
  });

  it('writes the timestamp as ISO-8601 with milliseconds', () => {
    expect(
      buildProofLeafInput({
        ...leafSources[0],
        votedAt: new Date('2026-08-20T06:00:00.000Z'),
      }),
    ).toContain(':2026-08-20T06:00:00.000Z:');
  });

  it('leaves an unreadable timestamp empty rather than guessing', () => {
    expect(
      buildProofLeafInput({ ...leafSources[0], votedAt: 'not a date' }),
    ).toContain(':yes:4.000000::');
  });
});

describe('leaf hashes', () => {
  it("reproduces every hash the API's buildProofs stored", async () => {
    const hashes = await hashProofLeaves(leafSources);

    expect(hashes).toEqual(proofs.map((proof) => proof.hash));
  });

  it("reproduces the digest the API's hashProofs stored", async () => {
    expect(await hashProofs(proofs.map((proof) => proof.hash))).toBe(
      proofsHash,
    );
  });

  it('folds the leaves on newlines', async () => {
    expect(await hashProofs(['a', 'b'])).toBe(await sha256Hex('a\nb'));
  });
});

describe('recomputeProofsHash', () => {
  it('rebuilds the stored digest from the proposal vote list', async () => {
    const result = await recomputeProofsHash({ proofs } as any, votes as any);

    expect(result).toEqual({
      state: 'computed',
      proofsHash,
      leafHashes: proofs.map((proof) => proof.hash),
    });
  });

  it('walks the proofs in the order the record fixed, not a re-sort', async () => {
    const shuffled = [proofs[2], proofs[0], proofs[3], proofs[1]];
    const result = await recomputeProofsHash(
      { proofs: shuffled } as any,
      votes as any,
    );

    // Same leaves, different fold order: the digest is not the stored one.
    expect(result.state).toBe('computed');
    expect((result as any).proofsHash).not.toBe(proofsHash);
    expect((result as any).leafHashes).toEqual(
      shuffled.map((proof) => proof.hash),
    );
  });

  it('fails only the digest when a weight has been tampered with', async () => {
    const tampered = proofs.map((proof, index) =>
      index === 1 ? { ...proof, weight: proof.weight + 100 } : proof,
    );

    const result = await recomputeProofsHash(
      { proofs: tampered } as any,
      votes as any,
    );

    expect(result.state).toBe('computed');
    expect((result as any).proofsHash).not.toBe(proofsHash);
    // Every untouched leaf still hashes to exactly what it did.
    expect((result as any).leafHashes[0]).toBe(proofs[0].hash);
    expect((result as any).leafHashes[1]).not.toBe(proofs[1].hash);
    expect((result as any).leafHashes[2]).toBe(proofs[2].hash);
    expect((result as any).leafHashes[3]).toBe(proofs[3].hash);
  });

  it('says it cannot check rather than reporting a mismatch when a signature is missing', async () => {
    const result = await recomputeProofsHash({ proofs } as any, {
      ...votes,
      no: [],
    } as any);

    expect(result).toEqual({
      state: 'unavailable',
      reason: 'missing-signatures',
    });
  });

  it('does not hand the same signature to two leaves', async () => {
    const doubled = {
      yes: [votes.yes[0], { ...votes.yes[0], signature: '0xsecond' }],
      no: [],
      abstain: [],
    };
    const leaves = [
      { ...proofs[0], index: 0 },
      { ...proofs[0], index: 1 },
    ];

    const result = await recomputeProofsHash({ proofs: leaves } as any, doubled as any);

    expect(result.state).toBe('computed');
    expect((result as any).leafHashes[0]).toBe(
      await sha256Hex(buildProofLeafInput(leafSources[0])),
    );
    expect((result as any).leafHashes[1]).toBe(
      await sha256Hex(
        buildProofLeafInput({ ...leafSources[0], index: 1, signature: '0xsecond' }),
      ),
    );
  });

  it('handles a proposal nobody voted on', async () => {
    const result = await recomputeProofsHash({ proofs: [] } as any, {} as any);

    expect(result).toEqual({
      state: 'computed',
      proofsHash: await sha256Hex(''),
      leafHashes: [],
    });
  });

  it('stays responsive on a proposal with thousands of votes', async () => {
    const many = Array.from({ length: 2500 }, (_, index) => ({
      index,
      userId: `65f1a2b3c4d5e6f7012345${String(index).padStart(2, '0')}`,
      vote: 'yes' as const,
      weight: 1,
      votedAt: new Date(1_700_000_000_000 + index).toISOString(),
      hash: '',
    }));

    const result = await recomputeProofsHash({ proofs: many } as any, {
      yes: many.map((proof) => ({
        userId: proof.userId,
        weight: proof.weight,
        votedAt: proof.votedAt,
        signature: `0x${index0(proof.index)}`,
      })),
    } as any);

    expect(result.state).toBe('computed');
    expect((result as any).leafHashes).toHaveLength(2500);
  });
});
