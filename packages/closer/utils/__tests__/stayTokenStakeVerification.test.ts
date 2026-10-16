import { jest as timerJest } from '@jest/globals';

import { verifyStayTokenStake } from '../stayTokenStakeVerification';
import { stakeStayTokens } from '../stays.api';

jest.mock('../stays.api', () => ({
  ...jest.requireActual('../stays.api'),
  stakeStayTokens: jest.fn(),
}));
const submit = stakeStayTokens as jest.MockedFunction<typeof stakeStayTokens>;
const pending = {
  response: {
    status: 409,
    data: { details: { code: 'TOKEN_STAKE_VERIFICATION_PENDING' } },
  },
};
const success = { verified: true, booking: { _id: 'stay' } } as any;

beforeEach(() => {
  jest.useFakeTimers();
  submit.mockReset();
});
afterEach(() => {
  jest.useRealTimers();
});

test('keeps waiting beyond 30 seconds and succeeds near 120 seconds', async () => {
  const start = Date.now();
  submit.mockImplementation(async () => {
    if (Date.now() - start < 118_000) throw pending;
    return success;
  });
  const result = verifyStayTokenStake('stay', '0xconfirmed');
  await timerJest.advanceTimersByTimeAsync(118_000);
  expect(await result).toEqual(success);
  expect(submit).toHaveBeenCalledTimes(60);
  expect(submit.mock.calls.every((call) => call[1] === '0xconfirmed')).toBe(
    true,
  );
});

test('stops at 120 seconds and leaves verification retryable', async () => {
  submit.mockRejectedValue(pending);
  const result = verifyStayTokenStake('stay', '0xconfirmed').catch(
    (error) => error,
  );
  await timerJest.advanceTimersByTimeAsync(120_000);
  expect(await result).toMatchObject({
    code: 'TOKEN_STAKE_VERIFICATION_DELAYED',
  });
  expect(submit).toHaveBeenCalledTimes(60);
  expect(jest.getTimerCount()).toBe(0);
});

test('does not overlap slow requests or start another request after the deadline', async () => {
  let rejectRequest!: (error: unknown) => void;
  submit.mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
  );
  const result = verifyStayTokenStake('stay', '0xconfirmed').catch(
    (error) => error,
  );
  await timerJest.advanceTimersByTimeAsync(120_000);
  expect(submit).toHaveBeenCalledTimes(1);
  rejectRequest(pending);
  expect(await result).toMatchObject({
    code: 'TOKEN_STAKE_VERIFICATION_DELAYED',
  });
  expect(submit).toHaveBeenCalledTimes(1);
});

test.each([400, 401, 403, 500])(
  'does not retry a terminal HTTP %s error',
  async (status) => {
    const error = {
      response: { status, data: { error: 'Missing payments for 24/3-30/3' } },
    };
    submit.mockRejectedValue(error);
    await expect(verifyStayTokenStake('stay', '0xconfirmed')).rejects.toBe(
      error,
    );
    expect(submit).toHaveBeenCalledTimes(1);
  },
);

test('a transport failure is retryable manually but is not automatically resubmitted', async () => {
  submit.mockRejectedValue({ isAxiosError: true, code: 'ERR_NETWORK' });
  await expect(
    verifyStayTokenStake('stay', '0xconfirmed'),
  ).rejects.toMatchObject({ code: 'TOKEN_STAKE_VERIFICATION_DELAYED' });
  expect(submit).toHaveBeenCalledTimes(1);
});

test('cancels the retry timer on abort', async () => {
  const controller = new AbortController();
  submit.mockRejectedValue(pending);
  const result = verifyStayTokenStake(
    'stay',
    '0xconfirmed',
    controller.signal,
  ).catch((error) => error);
  await timerJest.advanceTimersByTimeAsync(1000);
  controller.abort();
  expect(await result).toMatchObject({ name: 'AbortError' });
  await timerJest.advanceTimersByTimeAsync(120_000);
  expect(submit).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('never treats verified:false as success', async () => {
  submit.mockResolvedValue({ ...success, verified: false });
  await expect(
    verifyStayTokenStake('stay', '0xconfirmed'),
  ).rejects.toMatchObject({ code: 'TOKEN_STAKE_VERIFICATION_DELAYED' });
  expect(submit).toHaveBeenCalledTimes(1);
});

test('uses the existing on-chain sync option when there is no saved hash', async () => {
  submit.mockResolvedValue(success);
  await verifyStayTokenStake('stay', '');
  expect(submit).toHaveBeenCalledWith(
    'stay',
    '',
    expect.objectContaining({
      syncBookingAlreadyOnChain: true,
      timeout: 15000,
    }),
  );
});

test('hashless recovery can finish the current obligation when an original night was converted', async () => {
  const transactionIds = [`0x${'a'.repeat(64)}`];
  const booking = {
    _id: 'stay',
    tokensTarget: { val: 8.669192 },
    tokensStaked: { val: 8.669192 },
  };
  submit.mockResolvedValue({
    verified: false,
    booking,
    stakingStatus: { status: 'partial' },
  } as any);
  const result = await verifyStayTokenStake('stay', '', undefined, {
    transactionIds,
  });
  expect(result.booking).toBe(booking);
  expect(submit).toHaveBeenCalledWith(
    'stay',
    '',
    expect.objectContaining({
      transactionIds,
      syncBookingAlreadyOnChain: true,
    }),
  );
  submit.mockResolvedValue({
    verified: false,
    booking,
    stakingStatus: { status: 'needs-review' },
  } as any);
  await expect(
    verifyStayTokenStake('stay', '', undefined, { transactionIds }),
  ).rejects.toMatchObject({ code: 'TOKEN_STAKE_VERIFICATION_DELAYED' });
});
