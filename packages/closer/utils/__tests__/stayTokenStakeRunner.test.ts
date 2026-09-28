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

// Day 152 of 2026 is June 1 (UTC).
const BEFORE_PLAN = Date.UTC(2026, 0, 1);

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
      now: BEFORE_PLAN,
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
      now: BEFORE_PLAN,
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
      now: BEFORE_PLAN,
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
      now: BEFORE_PLAN,
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
      now: BEFORE_PLAN,
    });

    expect(stakeTokens).not.toHaveBeenCalled();
    expect(run.result).toEqual({
      error: null,
      success: { transactionId: 'existing' },
    });
    expect(run.nightsKey).toBe(JSON.stringify(plan.bookingNights));
  });

  it('never submits a night that has already started, and names it', async () => {
    const stakeTokens = jest.fn(async () => ({
      error: null,
      success: { transactionId: '0xabc' },
    }));

    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 0,
      stakeTokens,
      now: Date.UTC(2026, 5, 1, 12),
    });

    expect(callArgs(stakeTokens).map((call) => [call[0], call[1]])).toEqual([
      ['3710000000000000000', [[2026, 153]]],
      [
        '3000000000000000000',
        [
          [2026, 154],
          [2026, 155],
        ],
      ],
    ]);
    expect(run.skippedNights).toEqual([[2026, 152]]);
    expect(run.stakedNightCount).toBe(3);
    expect(run.totalNightCount).toBe(3);
    expect(run.result?.success?.transactionId).toBe('0xabc');
  });

  it('skips a whole segment that is already past', async () => {
    const stakeTokens = jest.fn(async () => ({
      error: null,
      success: { transactionId: '0xabc' },
    }));

    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 0,
      stakeTokens,
      now: Date.UTC(2026, 5, 2, 12),
    });

    expect(stakeTokens).toHaveBeenCalledTimes(1);
    expect(callArgs(stakeTokens)[0][1]).toEqual([
      [2026, 154],
      [2026, 155],
    ]);
    expect(run.skippedNights).toEqual([
      [2026, 152],
      [2026, 153],
    ]);
  });

  it('does not count staked past nights as skipped', async () => {
    const stakeTokens = jest.fn(async () => ({
      error: null,
      success: { transactionId: '0xabc' },
    }));

    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 2,
      stakeTokens,
      now: Date.UTC(2026, 5, 2, 12),
    });

    expect(run.skippedNights).toEqual([]);
    expect(run.stakedNightCount).toBe(4);
    expect(run.totalNightCount).toBe(4);
  });

  it('signs nothing and does not claim an on-chain stake when every unstaked night is past', async () => {
    const stakeTokens = jest.fn();

    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 1,
      stakeTokens,
      now: Date.UTC(2026, 5, 10),
    });

    expect(stakeTokens).not.toHaveBeenCalled();
    expect(run.onlyPastNightsLeft).toBe(true);
    expect(run.result).toBeNull();
    expect(run.skippedNights).toEqual([
      [2026, 153],
      [2026, 154],
      [2026, 155],
    ]);
  });

  it('still reports a fully staked plan as existing, not as past nights', async () => {
    const run = await stakeStayTokenPlan({
      stayId: 'stay-1',
      plan,
      stakedNightCount: 4,
      stakeTokens: jest.fn(),
      now: Date.UTC(2026, 5, 10),
    });

    expect(run.onlyPastNightsLeft).toBe(false);
    expect(run.result?.success?.transactionId).toBe('existing');
  });
});
