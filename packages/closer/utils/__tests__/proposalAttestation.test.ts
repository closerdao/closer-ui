import {
  PROPOSAL_RESULT_SELECTOR,
  decodeProposalResult,
  findOwnVoteProofs,
  getChainName,
  getExplorerTxUrl,
  isAttestationForProposal,
  truncateMiddle,
} from '../proposalAttestation';
import {
  API_PROOFS_FIXTURE,
  MAINNET_ATTESTATION_CALLDATA,
} from '../__fixtures__/proposalAttestation.fixture';

describe('decodeProposalResult', () => {
  it('decodes a real mainnet attestation', () => {
    const decoded = decodeProposalResult(MAINNET_ATTESTATION_CALLDATA);

    expect(decoded).toEqual({
      proposalId: '6a78c77a0dab8e84237a917f',
      // 50 characters because slugify caps there - the stored value, not a
      // truncation the decoder should be repairing.
      slug: 'adding-a-deeper-borehole-above-the-garden-to-maint',
      outcome: 'rejected',
      results: { yes: 330, no: 504, abstain: 0 },
      quorum: 130.068181,
      voterCount: 1,
      finalizedEarly: false,
      finalizedAt: new Date('2026-08-20T21:50:00.000Z'),
      proofsHash:
        'c50a87db244ac8be0b10aebddc79a969243d127442407126b9e93447042d5385',
    });
  });

  it('keeps the six meaningful decimals a weight carries', () => {
    const decoded = decodeProposalResult(MAINNET_ATTESTATION_CALLDATA);

    expect(decoded?.quorum).toBeCloseTo(130.068181, 6);
  });

  it('is the selector the API derives from the signature string', () => {
    expect(MAINNET_ATTESTATION_CALLDATA.slice(0, 10)).toBe(
      PROPOSAL_RESULT_SELECTOR,
    );
  });

  it('refuses calldata carrying a different selector', () => {
    const foreign = `0xdeadbeef${MAINNET_ATTESTATION_CALLDATA.slice(10)}`;

    expect(decodeProposalResult(foreign)).toBeNull();
  });

  it('refuses a payload that does not decode against the layout', () => {
    expect(decodeProposalResult(`${PROPOSAL_RESULT_SELECTOR}0011`)).toBeNull();
  });

  it('refuses a transaction with no calldata', () => {
    expect(decodeProposalResult('0x')).toBeNull();
    expect(decodeProposalResult(null)).toBeNull();
    expect(decodeProposalResult(undefined)).toBeNull();
  });
});

describe('isAttestationForProposal', () => {
  const decoded = decodeProposalResult(MAINNET_ATTESTATION_CALLDATA);

  it('accepts the proposal the attestation names', () => {
    expect(isAttestationForProposal(decoded, '6a78c77a0dab8e84237a917f')).toBe(
      true,
    );
  });

  it('rejects a well-formed attestation for some other proposal', () => {
    expect(isAttestationForProposal(decoded, '6a78c77a0dab8e84237a9180')).toBe(
      false,
    );
  });

  it('rejects when there is nothing to compare', () => {
    expect(isAttestationForProposal(null, '6a78c77a0dab8e84237a917f')).toBe(
      false,
    );
    expect(isAttestationForProposal(decoded, undefined)).toBe(false);
  });
});

describe('getExplorerTxUrl', () => {
  const txHash = `0x${'ab'.repeat(32)}`;

  it('prefers an explorer the API named over the built-in mapping', () => {
    expect(
      getExplorerTxUrl({
        chainId: 42220,
        txHash,
        explorerUrl: 'https://celo.blockscout.com/',
      }),
    ).toBe(`https://celo.blockscout.com/tx/${txHash}`);
  });

  it('maps the chains we publish to', () => {
    expect(getExplorerTxUrl({ chainId: 42220, txHash })).toBe(
      `https://explorer.celo.org/mainnet/tx/${txHash}`,
    );
    expect(getExplorerTxUrl({ chainId: 44787, txHash })).toBe(
      `https://celo-alfajores.blockscout.com/tx/${txHash}`,
    );
    expect(getExplorerTxUrl({ chainId: 11142220, txHash })).toBe(
      `https://celo-sepolia.blockscout.com/tx/${txHash}`,
    );
  });

  it('links nowhere for a chain it cannot name', () => {
    expect(getExplorerTxUrl({ chainId: 1234, txHash })).toBeNull();
    expect(getExplorerTxUrl({ chainId: 42220, txHash: '' })).toBeNull();
  });
});

describe('getChainName', () => {
  it('names the chains we publish to', () => {
    expect(getChainName(42220)).toBe('Celo');
    expect(getChainName(11142220)).toBe('Celo Sepolia');
  });

  it('still says something for a chain it does not know', () => {
    expect(getChainName(999)).toBe('chain 999');
  });
});

describe('truncateMiddle', () => {
  it('keeps both ends of a hash so the eye can compare them', () => {
    expect(truncateMiddle(`0x${'ab'.repeat(32)}`)).toBe('0xabababab…abababab');
  });

  it('leaves anything already short alone', () => {
    expect(truncateMiddle('0xabc')).toBe('0xabc');
  });
});

describe('findOwnVoteProofs', () => {
  const lockState = {
    proofs: API_PROOFS_FIXTURE.proofs,
  } as any;

  it("pairs a member's leaf with the signature they signed it with", () => {
    const own = findOwnVoteProofs(
      lockState,
      API_PROOFS_FIXTURE.votes as any,
      '65f1a2b3c4d5e6f701234568',
    );

    expect(own).toHaveLength(1);
    expect(own[0]).toMatchObject({
      index: 1,
      vote: 'no',
      weight: 504.123456,
      signature: API_PROOFS_FIXTURE.votes.no[0].signature,
    });
  });

  it('finds nothing for a member who did not vote', () => {
    expect(
      findOwnVoteProofs(lockState, API_PROOFS_FIXTURE.votes as any, 'nobody'),
    ).toEqual([]);
  });

  it('finds nothing for a signed-out visitor', () => {
    expect(
      findOwnVoteProofs(lockState, API_PROOFS_FIXTURE.votes as any, undefined),
    ).toEqual([]);
  });
});
