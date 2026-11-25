import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
  confirmStayTokenPayment,
  quoteStayTokenPayment,
  stakeStayTokens,
} from '../stays.api';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(() => false),
  trpc: {
    stay: {
      payWithTokens: { mutate: jest.fn() },
      stakeTokens: { mutate: jest.fn() },
    },
  },
}));

const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };
const stay = (
  trpc as unknown as { stay: Record<string, { mutate: jest.Mock }> }
).stay;
const payMutate = stay.payWithTokens.mutate;
const stakeMutate = stay.stakeTokens.mutate;

const booking = { _id: 'stay_1' };

describe('token checkout on legacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEnabled.mockReturnValue(false);
  });

  it('posts to /token-payment and /token-stake', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { booking, verified: true } },
    });

    await quoteStayTokenPayment('stay_1');
    await confirmStayTokenPayment('stay_1', '0xabc');
    await stakeStayTokens('stay_1', '0xdef');
    await stakeStayTokens('stay_1', '', { syncBookingAlreadyOnChain: true });

    expect(mockedApi.post.mock.calls).toEqual([
      ['/stays/stay_1/token-payment', {}],
      ['/stays/stay_1/token-payment', { txHash: '0xabc' }],
      ['/stays/stay_1/token-stake', { transactionId: '0xdef' }],
      ['/stays/stay_1/token-stake', { syncBookingAlreadyOnChain: true }],
    ]);
    expect(payMutate).not.toHaveBeenCalled();
    expect(stakeMutate).not.toHaveBeenCalled();
  });
});

describe('token checkout over tRPC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEnabled.mockImplementation((group?: string) => group === '11.5a');
  });

  it('quotes without a txHash', async () => {
    const quote = { fiatAmount: 80, currency: 'EUR' };
    payMutate.mockResolvedValue(quote);

    await expect(quoteStayTokenPayment('stay_1')).resolves.toBe(quote);
    expect(payMutate).toHaveBeenCalledWith({ id: 'stay_1' });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('confirms with the txHash', async () => {
    const result = { booking, verified: true };
    payMutate.mockResolvedValue(result);

    await expect(confirmStayTokenPayment('stay_1', '0xabc')).resolves.toBe(
      result,
    );
    expect(payMutate).toHaveBeenCalledWith({ id: 'stay_1', txHash: '0xabc' });
  });

  it('surfaces the unverified message for the page retry', async () => {
    const message = 'Transaction could not be verified for this stay.';
    payMutate.mockRejectedValue(
      new TRPCClientError(message, {
        result: {
          error: {
            message,
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
          },
        },
      }),
    );

    const error = await confirmStayTokenPayment('stay_1', '0xabc').catch(
      (e: unknown) => e,
    );
    expect(parseMessageFromError(error)).toBe(message);
  });

  it('stakes with the transaction id', async () => {
    const result = { booking, verified: true };
    stakeMutate.mockResolvedValue(result);

    await expect(stakeStayTokens('stay_1', '0xdef')).resolves.toBe(result);
    expect(stakeMutate).toHaveBeenCalledWith({
      id: 'stay_1',
      transactionId: '0xdef',
    });
  });

  it('stakes without a transaction id when syncing an on-chain booking', async () => {
    stakeMutate.mockResolvedValue({ booking, verified: true });

    await stakeStayTokens('stay_1', '', { syncBookingAlreadyOnChain: true });
    expect(stakeMutate).toHaveBeenCalledWith({ id: 'stay_1' });
  });
});
