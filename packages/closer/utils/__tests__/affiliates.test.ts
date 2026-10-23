import { TRPCClientError } from '@trpc/client';

import {
  approveAffiliate,
  removeAffiliate,
  submitAffiliateApplication,
} from '../affiliates';
import api from '../api';
import { parseMessageFromError } from '../common';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    affiliate: {
      submitApplication: { mutate: jest.fn() },
      approve: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const affiliate = trpc.affiliate as unknown as Record<
  'submitApplication' | 'approve' | 'remove',
  { mutate: jest.Mock }
>;

const result = { userId: 'u1', affiliate: null, affiliateApplication: {} };
const answers = { reason: 'I host retreats', program: 'affiliate' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { results: result } });
  });

  it('posts the three /affiliates routes', async () => {
    await expect(submitAffiliateApplication(answers)).resolves.toBe(result);
    await expect(approveAffiliate('u1')).resolves.toBe(result);
    await expect(removeAffiliate('u1')).resolves.toBe(result);

    expect(mockedApi.post.mock.calls).toEqual([
      ['/affiliates/apply', answers],
      ['/affiliates/approve', { userId: 'u1' }],
      ['/affiliates/remove', { userId: 'u1' }],
    ]);
    expect(affiliate.submitApplication.mutate).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('calls the three procedures', async () => {
    affiliate.submitApplication.mutate.mockResolvedValue(result);
    affiliate.approve.mutate.mockResolvedValue(result);
    affiliate.remove.mutate.mockResolvedValue(result);

    await expect(submitAffiliateApplication(answers)).resolves.toBe(result);
    await expect(approveAffiliate('u1')).resolves.toBe(result);
    await expect(removeAffiliate('u1')).resolves.toBe(result);

    expect(affiliate.submitApplication.mutate).toHaveBeenCalledWith(answers);
    expect(affiliate.approve.mutate).toHaveBeenCalledWith({ userId: 'u1' });
    expect(affiliate.remove.mutate).toHaveBeenCalledWith({ userId: 'u1' });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a refusal with its text', async () => {
    const message = 'You are already part of the affiliate program';
    affiliate.submitApplication.mutate.mockRejectedValue(
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

    const error = await submitAffiliateApplication(answers).catch((e) => e);

    expect(parseMessageFromError(error)).toBe(message);
  });
});
