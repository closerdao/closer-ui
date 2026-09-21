import type { StayTokenStakePlan } from '../../types/stay';
import { clearPendingStayTokenStake } from '../stayTokenStakePendingStorage';
import { stakeStayTokenPlan } from '../stayTokenStakeRunner';

const plan: StayTokenStakePlan = {
  segments: [
    {
      bookingNights: [
        [2026, 152],
        [2026, 153],
      ],
      pricePerNightWei: '3710000000000000000',
    },
    {
      bookingNights: [
        [2026, 154],
        [2026, 155],
      ],
      pricePerNightWei: '3000000000000000000',
    },
  ],
  bookingNights: [
    [2026, 152],
    [2026, 153],
    [2026, 154],
    [2026, 155],
  ],
  totalWei: '13420000000000000000',
  decimals: 18,
  displayDecimals: 6,
  tokenAmount: 13.42,
};

const callArgs = (mock: jest.Mock): any[][] =>
  mock.mock.calls as unknown as any[][];

describe('stakeStayTokenPlan', () => {
  beforeEach(() => {
    clearPendingStayTokenStake('stay-1');
  });

  it('signs every unstaked segment at its own rate before reporting success', async () => {
    const stakeTokens = jest.fn(async () => ({
      error: null,
      success: { transactionId: '0xabc' },
    }));

    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 0,
      stakeTokens,
    });

    expect(stakeTokens).toHaveBeenCalledTimes(2);
    expect(callArgs(stakeTokens).map((call) => [call[0], call[1]])).toEqual([
      [
        '3710000000000000000',
        [
          [2026, 152],
          [2026, 153],
        ],
      ],
      [
        '3000000000000000000',
        [
          [2026, 154],
          [2026, 155],
        ],
      ],
    ]);
    expect(run.stakedNightCount).toBe(4);
    expect(run.result?.success?.transactionId).toBe('0xabc');
  });

  it('starts at the staked prefix', async () => {
    const stakeTokens = jest.fn(async () => ({
      error: null,
      success: { transactionId: '0xabc' },
    }));

    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 3,
      stakeTokens,
    });

    expect(stakeTokens).toHaveBeenCalledTimes(1);
    expect(callArgs(stakeTokens)[0][1]).toEqual([[2026, 155]]);
    expect(run.stakedNightCount).toBe(4);
  });

  it('stops at the segment that failed and reports how far it got', async () => {
    const failure = new Error('user rejected');
    const stakeTokens = jest
      .fn()
      .mockResolvedValueOnce({
        error: null,
        success: { transactionId: '0xabc' },
      })
      .mockResolvedValueOnce({ error: failure, success: null });

    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 0,
      stakeTokens,
    });

    expect(stakeTokens).toHaveBeenCalledTimes(2);
    expect(run.result?.error).toBe(failure);
    expect(run.stakedNightCount).toBe(2);
    expect(run.totalNightCount).toBe(4);
  });

  it('carries on past a segment the chain already holds', async () => {
    const stakeTokens = jest
      .fn()
      .mockResolvedValueOnce({
        error: null,
        success: { transactionId: 'existing' },
      })
      .mockResolvedValueOnce({
        error: null,
        success: { transactionId: '0xabc' },
      });

    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 0,
      stakeTokens,
    });

    expect(stakeTokens).toHaveBeenCalledTimes(2);
    expect(run.result?.success?.transactionId).toBe('0xabc');
    expect(run.stakedNightCount).toBe(4);
  });

  it('signs nothing and reports the stake as existing when every night is staked', async () => {
    const stakeTokens = jest.fn();

    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 4,
      stakeTokens,
    });

    expect(stakeTokens).not.toHaveBeenCalled();
    expect(run.result).toEqual({
      error: null,
      success: { transactionId: 'existing' },
    });
    expect(run.nightsKey).toBe(JSON.stringify(plan.bookingNights));
  });
});
