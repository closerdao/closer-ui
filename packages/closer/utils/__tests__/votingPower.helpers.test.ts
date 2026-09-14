import {
  EMPTY_VOTING_POWER_SUPPLY,
  VOTING_TOKENS,
  WALLET_SUMS_PATH,
  buildVotingPower,
  parseWalletSums,
} from '../votingPower.helpers';

describe('VOTING_TOKENS', () => {
  it('reads the snapshotted wallet totals the quorum is cut from', () => {
    expect(WALLET_SUMS_PATH).toBe('/sum/user/wallet');
    expect(VOTING_TOKENS.map((token) => token.key)).toEqual([
      'tdf',
      'presence',
      'sweat',
    ]);
  });

  it('labels every token with the $ prefix governance uses', () => {
    // The network config names them 'TDF', '$Presence' and 'Sweat'.
    expect(VOTING_TOKENS.map((token) => token.label)).toEqual([
      '$TDF',
      '$Presence',
      '$Sweat',
    ]);
  });
});

describe('buildVotingPower', () => {
  it('weights $Sweat five times when totalling the platform voting power', () => {
    const { breakdown, total } = buildVotingPower({
      tdf: 1000,
      presence: 500,
      sweat: 100,
    });

    // 1000 $TDF + 500 $Presence + (100 $Sweat * 5)
    expect(total).toBe(2000);
    expect(breakdown.map((entry) => entry.votes)).toEqual([1000, 500, 500]);
    expect(breakdown.find((entry) => entry.key === 'sweat')?.multiplier).toBe(5);
  });

  it('leaves tokens with no supply out of the breakdown', () => {
    const { breakdown, total } = buildVotingPower({
      tdf: 1000,
      presence: 0,
      sweat: null,
    });

    expect(breakdown.map((entry) => entry.key)).toEqual(['tdf']);
    expect(total).toBe(1000);
  });

  it('reports no voting power at all when nothing could be read', () => {
    const { breakdown, total } = buildVotingPower(EMPTY_VOTING_POWER_SUPPLY);

    expect(breakdown).toEqual([]);
    // Null, not zero: a total of zero would make the derived quorum zero too.
    expect(total).toBeNull();
  });
});

describe('parseWalletSums', () => {
  it('reads the sums the endpoint answers with', () => {
    expect(
      parseWalletSums({ results: { sweat: 1234, presence: 5678, tdf: 91011 } }),
    ).toEqual({ tdf: 91011, presence: 5678, sweat: 1234 });
  });

  it('leaves a token the response omits null rather than zero', () => {
    // Zero would quietly shrink the platform total, and with it the quorum
    // derived from it.
    expect(parseWalletSums({ results: { tdf: 30 } })).toEqual({
      tdf: 30,
      presence: null,
      sweat: null,
    });
  });

  it('survives a response that carries no sums at all', () => {
    expect(parseWalletSums(undefined)).toEqual(EMPTY_VOTING_POWER_SUPPLY);
    expect(parseWalletSums({})).toEqual(EMPTY_VOTING_POWER_SUPPLY);
    expect(parseWalletSums({ results: 'nope' })).toEqual(
      EMPTY_VOTING_POWER_SUPPLY,
    );
    expect(parseWalletSums({ results: { tdf: 'lots' } })).toEqual(
      EMPTY_VOTING_POWER_SUPPLY,
    );
  });
});
