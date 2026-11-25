import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import { cancelSubscription } from '../subscriptionActions';
import {
  fetchIntroEligibility,
  postCancelSubscription,
} from '../subscriptions';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    subscription: {
      introEligibility: { query: jest.fn() },
      cancel: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<'get' | 'post', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const subscription = trpc.subscription as unknown as {
  introEligibility: { query: jest.Mock };
  cancel: { mutate: jest.Mock };
};

const badRequest = (message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
      },
    },
  });

beforeEach(() => jest.clearAllMocks());

describe('with tRPC off', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('reads intro eligibility past the GET cache', async () => {
    mockedApi.get.mockResolvedValue({
      data: { results: { eligibleForIntro: true } },
    });
    await expect(fetchIntroEligibility()).resolves.toBe(true);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/subscription/intro-eligibility',
      { cache: false },
    );
    expect(mockedEnabled).toHaveBeenCalledWith('12.6a');
    mockedApi.get.mockResolvedValue({ data: {} });
    await expect(fetchIntroEligibility()).resolves.toBe(false);
    expect(subscription.introEligibility.query).not.toHaveBeenCalled();
  });

  it('posts the cancel and resolves to the legacy body', async () => {
    const body = { results: { subscription: { plan: 'p' } } };
    mockedApi.post.mockResolvedValue({ data: body });
    await expect(cancelSubscription()).resolves.toBe(body);
    expect(mockedApi.post).toHaveBeenCalledWith('/stripe/cancel-subscription', {
      atPeriodEnd: true,
    });
    expect(subscription.cancel.mutate).not.toHaveBeenCalled();
  });
});

describe('with tRPC on', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('reads intro eligibility from the procedure', async () => {
    subscription.introEligibility.query.mockResolvedValue({
      eligibleForIntro: true,
    });
    await expect(fetchIntroEligibility()).resolves.toBe(true);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('cancels through the procedure with the legacy body shape', async () => {
    subscription.cancel.mutate.mockResolvedValue({
      subscription: { plan: 'p' },
    });
    await expect(postCancelSubscription(true)).resolves.toEqual({
      results: { subscription: { plan: 'p' } },
    });
    expect(subscription.cancel.mutate).toHaveBeenCalledWith({
      atPeriodEnd: true,
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rethrows a cancel failure with the legacy error text', async () => {
    const message =
      'Only cancelling at the end of the billing period is supported.';
    subscription.cancel.mutate.mockRejectedValue(badRequest(message));
    const error = await cancelSubscription(false).catch((e) => e);
    expect(parseMessageFromError(error)).toBe(message);
    expect(error.response.status).toBe(400);
  });
});
