import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
  completeStripeConnect,
  disconnectStripeAccount,
  fetchStripeConnectStatus,
  renameStripeAccount,
  setDefaultStripeAccount,
} from '../stripeConnect';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    stripeConnect: {
      complete: { mutate: jest.fn() },
      status: { query: jest.fn() },
      setDefault: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<
  'get' | 'post' | 'patch' | 'delete',
  jest.Mock
>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const connect = trpc.stripeConnect as unknown as {
  complete: { mutate: jest.Mock };
  status: { query: jest.Mock };
  setDefault: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
};

const result = { status: 'active' };

const trpcError = (code: string, httpStatus: number, message: string) =>
  Object.assign(new TRPCClientError(message), { data: { code, httpStatus } });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => {
    mockedEnabled.mockReturnValue(false);
    Object.values(mockedApi).forEach((fn) =>
      fn.mockResolvedValue({ data: { results: result } }),
    );
  });

  it('sends the same four requests as before: no body but the label', async () => {
    await expect(fetchStripeConnectStatus()).resolves.toBe(result);
    await setDefaultStripeAccount('acct_1');
    await renameStripeAccount('acct_1', 'Main');
    await disconnectStripeAccount('acct_1');

    expect(mockedApi.get.mock.calls).toEqual([['/stripe/connect/status']]);
    expect(mockedApi.post.mock.calls).toEqual([
      ['/stripe/connect/accounts/acct_1/default'],
    ]);
    expect(mockedApi.patch.mock.calls).toEqual([
      ['/stripe/connect/accounts/acct_1', { label: 'Main' }],
    ]);
    expect(mockedApi.delete.mock.calls).toEqual([
      ['/stripe/connect/accounts/acct_1'],
    ]);
    expect(mockedEnabled).toHaveBeenCalledWith('12.7a');
    expect(connect.status.query).not.toHaveBeenCalled();
  });

  it('completes OAuth over legacy POST /stripe/connect/complete', async () => {
    const completeResult = { connectStatus: 'active' };
    mockedApi.post.mockResolvedValueOnce({ data: { results: completeResult } });

    await expect(
      completeStripeConnect(
        'ac_123',
        'https://tdf.example/stripe-connect/callback',
      ),
    ).resolves.toBe(completeResult);

    expect(mockedApi.post).toHaveBeenCalledWith('/stripe/connect/complete', {
      code: 'ac_123',
      redirectUri: 'https://tdf.example/stripe-connect/callback',
    });
    expect(connect.complete.mutate).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => {
    mockedEnabled.mockReturnValue(true);
    connect.complete.mutate.mockResolvedValue({ connectStatus: 'active' });
    connect.status.query.mockResolvedValue(result);
    connect.setDefault.mutate.mockResolvedValue(result);
    connect.update.mutate.mockResolvedValue(result);
    connect.remove.mutate.mockResolvedValue(result);
  });

  it('calls the procedures and returns the results', async () => {
    await expect(fetchStripeConnectStatus()).resolves.toBe(result);
    await expect(
      completeStripeConnect(
        'ac_123',
        'https://tdf.example/stripe-connect/callback',
      ),
    ).resolves.toEqual({ connectStatus: 'active' });
    await setDefaultStripeAccount('acct_1');
    await renameStripeAccount('acct_1', 'Main');
    await disconnectStripeAccount('acct_1');

    expect(connect.complete.mutate).toHaveBeenCalledWith({
      code: 'ac_123',
      redirectUri: 'https://tdf.example/stripe-connect/callback',
    });
    expect(connect.setDefault.mutate).toHaveBeenCalledWith({ id: 'acct_1' });
    expect(connect.update.mutate).toHaveBeenCalledWith({
      id: 'acct_1',
      label: 'Main',
    });
    expect(connect.remove.mutate).toHaveBeenCalledWith({ id: 'acct_1' });
    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });

  it('rejects a failed complete with the API error message', async () => {
    const text = 'Stripe OAuth failed';
    connect.complete.mutate.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, text),
    );

    const err = (await completeStripeConnect(
      'ac_bad',
      'https://tdf.example/stripe-connect/callback',
    ).catch((e) => e)) as any;
    expect(err.response.status).toBe(400);
    expect(parseMessageFromError(err)).toBe(text);
  });

  it('rejects a 409 with status 409 and the legacy text', async () => {
    const text =
      'Cannot disconnect a Stripe account that is assigned to an accounting entity';
    connect.remove.mutate.mockRejectedValue(trpcError('CONFLICT', 409, text));

    const err = (await disconnectStripeAccount('acct_1').catch(
      (e) => e,
    )) as any;
    expect(err.response.status).toBe(409);
    expect(parseMessageFromError(err)).toBe(text);
  });

  it('rejects a 404 with the not-connected text', async () => {
    const text = 'Stripe account is not connected to this village';
    connect.update.mutate.mockRejectedValue(trpcError('NOT_FOUND', 404, text));

    const err = (await renameStripeAccount('acct_1', 'x').catch(
      (e) => e,
    )) as any;
    expect(err.response.status).toBe(404);
    expect(parseMessageFromError(err)).toBe(text);
  });

  it('rejects a failed status read with the API text', async () => {
    const text = 'Stripe Connect status failed';
    connect.status.query.mockRejectedValue(trpcError('BAD_REQUEST', 400, text));

    const err = (await fetchStripeConnectStatus().catch((e) => e)) as any;
    expect(err.response.status).toBe(400);
    expect(parseMessageFromError(err)).toBe(text);
  });

  it('rejects setDefault on an unknown account with the 404 text', async () => {
    const text = 'Stripe account is not connected to this village';
    connect.setDefault.mutate.mockRejectedValue(
      trpcError('NOT_FOUND', 404, text),
    );

    const err = (await setDefaultStripeAccount('acct_1').catch(
      (e) => e,
    )) as any;
    expect(err.response.status).toBe(404);
    expect(parseMessageFromError(err)).toBe(text);
  });
});
