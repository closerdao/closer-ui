import { jest as timerJest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import type { StayTokenStakePlan } from '../../types/stay';
import {
  readPendingStayTokenVerification,
  writePendingStayTokenVerification,
} from '../../utils/stayTokenStakePendingStorage';
import { getStay, stakeStayTokens } from '../../utils/stays.api';
import { useStayTokenStakeVerification } from '../useStayTokenStakeVerification';

jest.mock('../../utils/stays.api', () => ({
  ...jest.requireActual('../../utils/stays.api'),
  getStay: jest.fn(),
  stakeStayTokens: jest.fn(),
}));

const plan: StayTokenStakePlan = {
  bookingNights: [[2027, 83]],
  segments: [
    { bookingNights: [[2027, 83]], pricePerNightWei: '7000000000000000000' },
  ],
  totalWei: '7000000000000000000',
  decimals: 18,
  displayDecimals: 6,
  tokenAmount: 7,
};
const transactionId = `0x${'1'.repeat(64)}`;
const pending = {
  response: {
    status: 409,
    data: { details: { code: 'TOKEN_STAKE_VERIFICATION_PENDING' } },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  sessionStorage.clear();
  (stakeStayTokens as jest.Mock).mockRejectedValue(pending);
});
afterEach(() => jest.useRealTimers());

test('wallet approval finishing after unmount stores its hash without starting verification', async () => {
  const { result, unmount } = renderHook(() =>
    useStayTokenStakeVerification('stay', plan),
  );
  const verifyAfterApproval = result.current.verifyStake;
  unmount();
  await expect(verifyAfterApproval(plan, transactionId)).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(stakeStayTokens).not.toHaveBeenCalled();
  expect(readPendingStayTokenVerification('stay', plan)?.transactionId).toBe(
    transactionId,
  );
});

test.each(['stay', 'plan'])(
  'changing the %s aborts verification and ignores a late success',
  async (change) => {
    let resolveRequest!: (value: any) => void;
    (stakeStayTokens as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { result, rerender } = renderHook(
      ({ stayId, stakePlan }) =>
        useStayTokenStakeVerification(stayId, stakePlan),
      {
        initialProps: { stayId: 'stay', stakePlan: plan },
      },
    );
    let outcome!: Promise<any>;
    act(() => {
      outcome = result.current
        .verifyStake(plan, transactionId)
        .catch((error) => error);
    });
    const signal = (stakeStayTokens as jest.Mock).mock.calls[0][2].signal;
    rerender({
      stayId: change === 'stay' ? 'other' : 'stay',
      stakePlan:
        change === 'plan'
          ? {
              ...plan,
              segments: [
                {
                  ...plan.segments[0],
                  pricePerNightWei: '8000000000000000000',
                },
              ],
            }
          : plan,
    });
    expect(signal.aborted).toBe(true);
    expect(result.current.pendingVerification).toBeNull();
    await act(async () => {
      resolveRequest({ booking: {}, verified: true });
      await outcome;
    });
    expect(await outcome).toMatchObject({ name: 'AbortError' });
    expect(readPendingStayTokenVerification('stay', plan)?.transactionId).toBe(
      transactionId,
    );
    expect(result.current.isVerifying).toBe(false);
  },
);

test('an offline recovery refresh keeps the transaction and offers delayed verification', async () => {
  writePendingStayTokenVerification('stay', transactionId, plan);
  (getStay as jest.Mock).mockRejectedValue({
    isAxiosError: true,
    message: 'Network Error',
  });
  const { result } = renderHook(() =>
    useStayTokenStakeVerification('stay', plan),
  );
  await act(async () => {
    await expect(
      result.current.verifyStake(plan, transactionId),
    ).rejects.toMatchObject({ code: 'TOKEN_STAKE_VERIFICATION_DELAYED' });
  });
  expect(stakeStayTokens).not.toHaveBeenCalled();
  expect(result.current.pendingVerification?.transactionId).toBe(transactionId);
  expect(result.current.isVerifying).toBe(false);
});

test('equivalent plan rerenders do not cancel an active attempt or start a second one', async () => {
  const { result, rerender } = renderHook(
    ({ stakePlan }) => useStayTokenStakeVerification('stay', stakePlan),
    {
      initialProps: { stakePlan: plan },
    },
  );
  let first!: Promise<any>;
  act(() => {
    first = result.current.verifyStake(plan, transactionId);
  });
  rerender({ stakePlan: JSON.parse(JSON.stringify(plan)) });
  expect(result.current.verifyStake(plan, transactionId)).toBe(first);
  (stakeStayTokens as jest.Mock).mockResolvedValue({
    booking: {},
    verified: true,
  });
  await act(async () => {
    await timerJest.advanceTimersByTimeAsync(2000);
    await first;
  });
  expect(stakeStayTokens).toHaveBeenCalledTimes(2);
  expect(result.current.pendingVerification).toBeNull();
});

test('a paid retry still delivers stored references before clearing them', async () => {
  writePendingStayTokenVerification('stay', transactionId, plan);
  const booking = {
    _id: 'stay',
    status: 'paid',
    tokensTarget: { val: 7 },
    tokensStaked: { val: 7 },
  };
  (getStay as jest.Mock).mockResolvedValue(booking);
  (stakeStayTokens as jest.Mock).mockResolvedValue({
    booking,
    verified: true,
    stakingStatus: { status: 'complete' },
  });
  const { result } = renderHook(() =>
    useStayTokenStakeVerification('stay', plan),
  );
  await act(async () => {
    await result.current.verifyStake(plan, transactionId);
  });
  expect(stakeStayTokens).toHaveBeenCalledWith(
    'stay',
    transactionId,
    expect.objectContaining({
      transactionIds: [transactionId],
      syncBookingAlreadyOnChain: true,
    }),
  );
  expect(readPendingStayTokenVerification('stay', plan)).toBeNull();
});
