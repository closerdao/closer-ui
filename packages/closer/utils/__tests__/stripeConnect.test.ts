import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
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
});

describe('on tRPC', () => {
  beforeEach(() => {
    mockedEnabled.mockReturnValue(true);
    connect.status.query.mockResolvedValue(result);
    connect.setDefault.mutate.mockResolvedValue(result);
    connect.update.mutate.mockResolvedValue(result);
    connect.remove.mutate.mockResolvedValue(result);
  });

  it('calls the four procedures and returns the results', async () => {
    await expect(fetchStripeConnectStatus()).resolves.toBe(result);
    await setDefaultStripeAccount('acct_1');
    await renameStripeAccount('acct_1', 'Main');
    await disconnectStripeAccount('acct_1');

    expect(connect.setDefault.mutate).toHaveBeenCalledWith({ id: 'acct_1' });
    expect(connect.update.mutate).toHaveBeenCalledWith({
      id: 'acct_1',
      label: 'Main',
    });
    expect(connect.remove.mutate).toHaveBeenCalledWith({ id: 'acct_1' });
    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
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
});
