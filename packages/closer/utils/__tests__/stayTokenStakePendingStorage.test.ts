import {
  clearPendingStayTokenStake,
  readPendingStayTokenStake,
  readPendingStayTokenVerification,
  writePendingStayTokenStake,
  writePendingStayTokenVerification,
} from '../stayTokenStakePendingStorage';

describe('stay token stake pending storage', () => {
  const stayId = 'stay-1';
  const nightsKey = '[[2026,250],[2026,251]]';

  beforeEach(() => window.sessionStorage.clear());

  it('stores the latest hash and completed-night cursor', () => {
    writePendingStayTokenStake(stayId, '0xabc', nightsKey, 12);

    expect(readPendingStayTokenStake(stayId, nightsKey)).toEqual({
      transactionId: '0xabc',
      nightsKey,
      completedNightCount: 12,
    });
  });

  it('defaults legacy records to zero completed nights', () => {
    window.sessionStorage.setItem(
      `closer:stay-token-stake-pending:${stayId}`,
      JSON.stringify({ transactionId: '0xlegacy', nightsKey }),
    );

    expect(readPendingStayTokenStake(stayId, nightsKey)).toEqual({
      transactionId: '0xlegacy',
      nightsKey,
      completedNightCount: 0,
    });
  });

  it('ignores progress for a different night selection', () => {
    writePendingStayTokenStake(stayId, '0xabc', nightsKey, 1);
    expect(readPendingStayTokenStake(stayId, 'different')).toBeNull();
  });

  it('clears saved progress', () => {
    writePendingStayTokenStake(stayId, '0xabc', nightsKey, 1);
    clearPendingStayTokenStake(stayId);
    expect(readPendingStayTokenStake(stayId, nightsKey)).toBeNull();
  });

  it('restores verification only for the complete matching plan, including rates', () => {
    const plan = {
      bookingNights: [
        [2027, 83],
        [2027, 84],
      ],
      segments: [
        { bookingNights: [[2027, 83]], pricePerNightWei: '7' },
        { bookingNights: [[2027, 84]], pricePerNightWei: '5' },
      ],
      totalWei: '12',
      tokenAmount: 12,
      decimals: 0,
      displayDecimals: 0,
    };
    writePendingStayTokenVerification(stayId, '0xlastBatch', plan);
    expect(readPendingStayTokenVerification(stayId, plan)).toMatchObject({
      transactionId: '0xlastBatch',
      phase: 'verifying',
      completedNightCount: 2,
    });
    expect(readPendingStayTokenVerification('different-stay', plan)).toBeNull();
    expect(
      readPendingStayTokenVerification(stayId, {
        ...plan,
        segments: [
          plan.segments[0],
          { ...plan.segments[1], pricePerNightWei: '6' },
        ],
      }),
    ).toBeNull();
    writePendingStayTokenStake(
      stayId,
      '0xpartial',
      JSON.stringify(plan.bookingNights),
      1,
    );
    expect(readPendingStayTokenVerification(stayId, plan)).toBeNull();
  });
});

test('keeps valid hashes across batches, segment changes and reloads without reusing progress', () => {
  const a = `0x${'a'.repeat(64)}`;
  const b = `0x${'b'.repeat(64)}`;
  writePendingStayTokenStake('batch', a, 'first-segment', 0);
  writePendingStayTokenStake('batch', a, 'first-segment', 2);
  writePendingStayTokenStake('batch', b, 'second-segment', 0);
  expect(readPendingStayTokenStake('batch', 'first-segment')).toBeNull();
  expect(readPendingStayTokenStake('batch', 'second-segment')).toMatchObject({
    completedNightCount: 0,
    transactionIds: [a, b],
  });
  // Even an existing-on-chain sentinel must not discard submitted references.
  writePendingStayTokenStake('batch', 'existing', 'second-segment', 2);
  expect(
    readPendingStayTokenStake('batch', 'second-segment')?.transactionIds,
  ).toEqual([a, b]);
});
