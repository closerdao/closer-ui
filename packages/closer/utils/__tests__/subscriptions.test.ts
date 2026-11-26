import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
  cancelSubscription,
  changeSubscriptionPlan,
  resumeSubscription,
} from '../subscriptionActions';
import {
  fetchCustomerPortalUrl,
  fetchIntroEligibility,
  postCancelSubscription,
  postSubscription,
  postSubscriptionValidation,
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
      create: { mutate: jest.fn() },
      validate: { mutate: jest.fn() },
      change: { mutate: jest.fn() },
      resume: { mutate: jest.fn() },
      customerPortal: { query: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<'get' | 'post', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const subscription = trpc.subscription as unknown as {
  introEligibility: { query: jest.Mock };
  customerPortal: { query: jest.Mock };
} & Record<
  'cancel' | 'create' | 'validate' | 'change' | 'resume',
  { mutate: jest.Mock }
>;

const checkout = {
  email: 'm@x.io',
  paymentMethod: 'pm_1',
  priceId: 'price_1',
  monthlyCredits: 2,
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

  it('posts the checkout routes and resolves to their results', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { results: { status: 'active', subscription: 'sub_1' } },
    });
    mockedApi.post.mockResolvedValueOnce({
      data: { results: { status: 'succeeded' } },
    });
    await expect(postSubscription(checkout)).resolves.toEqual({
      status: 'active',
      subscription: 'sub_1',
    });
    await expect(
      postSubscriptionValidation({
        subscriptionId: 'sub_1',
        paymentMethod: 'pm_1',
      }),
    ).resolves.toEqual({ status: 'succeeded' });
    expect(mockedApi.post.mock.calls).toEqual([
      ['/subscription', checkout],
      [
        '/subscription/validation',
        { subscriptionId: 'sub_1', paymentMethod: 'pm_1' },
      ],
    ]);
    expect(mockedEnabled).toHaveBeenCalledWith('12.8a');
    expect(subscription.create.mutate).not.toHaveBeenCalled();
    expect(subscription.validate.mutate).not.toHaveBeenCalled();
  });

  it('posts change and resume and resolves to the legacy body', async () => {
    const body = { results: { subscription: { plan: 'p' } } };
    mockedApi.post.mockResolvedValue({ data: body });
    await expect(changeSubscriptionPlan('price_2')).resolves.toBe(body);
    await expect(resumeSubscription()).resolves.toBe(body);
    expect(mockedApi.post.mock.calls).toEqual([
      ['/stripe/change-subscription', { priceId: 'price_2' }],
      ['/stripe/resume-subscription'],
    ]);
    expect(subscription.change.mutate).not.toHaveBeenCalled();
    expect(subscription.resume.mutate).not.toHaveBeenCalled();
  });

  it('reads the portal url with the email in the query', async () => {
    mockedApi.get.mockResolvedValue({ data: { sessionUrl: 'https://portal' } });
    await expect(fetchCustomerPortalUrl('m+1@x.io')).resolves.toBe(
      'https://portal',
    );
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/stripe/create-customer-portal?email=m%2B1%40x.io',
    );
    expect(subscription.customerPortal.query).not.toHaveBeenCalled();
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

  it('runs the checkout through the procedures', async () => {
    subscription.create.mutate.mockResolvedValue({
      status: 'requires_action',
      subscription: 'sub_1',
      clientSecret: 'cs_1',
    });
    subscription.validate.mutate.mockResolvedValue({ status: 'succeeded' });
    await expect(postSubscription(checkout)).resolves.toEqual({
      status: 'requires_action',
      subscription: 'sub_1',
      clientSecret: 'cs_1',
    });
    await expect(
      postSubscriptionValidation({ subscriptionId: 'sub_1' }),
    ).resolves.toEqual({ status: 'succeeded' });
    expect(subscription.create.mutate).toHaveBeenCalledWith(checkout);
    expect(subscription.validate.mutate).toHaveBeenCalledWith({
      subscriptionId: 'sub_1',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rethrows a checkout failure with the legacy error text', async () => {
    subscription.create.mutate.mockRejectedValue(
      badRequest('Your card was declined.'),
    );
    const error = await postSubscription(checkout).catch((e) => e);
    expect(parseMessageFromError(error)).toBe('Your card was declined.');
    expect(error.response.status).toBe(400);
  });

  it('changes and resumes with the legacy body shape', async () => {
    subscription.change.mutate.mockResolvedValue({
      subscriptionId: 'sub_1',
      subscription: { plan: 'p' },
    });
    subscription.resume.mutate.mockResolvedValue({
      subscription: { plan: 'p' },
    });
    await expect(changeSubscriptionPlan('price_2')).resolves.toEqual({
      results: { subscriptionId: 'sub_1', subscription: { plan: 'p' } },
    });
    await expect(resumeSubscription()).resolves.toEqual({
      results: { subscription: { plan: 'p' } },
    });
    expect(subscription.change.mutate).toHaveBeenCalledWith({
      priceId: 'price_2',
    });
    expect(subscription.resume.mutate).toHaveBeenCalledWith({});
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('reads the portal url from the procedure', async () => {
    subscription.customerPortal.query.mockResolvedValue({
      sessionUrl: 'https://portal',
    });
    await expect(fetchCustomerPortalUrl('m@x.io')).resolves.toBe(
      'https://portal',
    );
    expect(subscription.customerPortal.query).toHaveBeenCalledWith();
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
