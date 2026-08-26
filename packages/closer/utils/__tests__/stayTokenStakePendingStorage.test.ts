import {
  clearPendingStayTokenStake,
  readPendingStayTokenStake,
  writePendingStayTokenStake,
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
});
