import api from '../api';
import { isTrpcEnabled, trpc } from '../trpc';
import {
  VillageBillingError,
  fetchVillageBilling,
  rotateVillageBilling,
  setVillageBillingStatus,
} from '../villageBilling.utils';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('../trpc', () => {
  const proc = () => ({ query: jest.fn(), mutate: jest.fn() });
  return {
    ...jest.requireActual('../trpc'),
    isTrpcEnabled: jest.fn(),
    trpc: {
      villageBilling: Object.fromEntries(
        ['get', 'rotateKey', 'setStatus'].map((name) => [name, proc()]),
      ),
    },
  };
});

const mockedApi = api as unknown as Record<'get' | 'post', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const procs = trpc.villageBilling as unknown as Record<
  string,
  { query: jest.Mock; mutate: jest.Mock }
>;
const summary = { villageId: 'v1', status: 'active' };

beforeEach(() => {
  jest.clearAllMocks();
  mockedEnabled.mockReturnValue(false);
});

it('flag off: uses the legacy routes', async () => {
  mockedApi.get.mockResolvedValue({ data: { results: summary } });
  mockedApi.post.mockResolvedValue({ data: { results: summary } });
  expect(await fetchVillageBilling('v1')).toEqual(summary);
  expect(await rotateVillageBilling('v1')).toEqual(summary);
  expect(await setVillageBillingStatus('v1', 'suspended')).toEqual(summary);
  expect(mockedApi.post).toHaveBeenLastCalledWith(
    '/village/v1/billing/status',
    {
      status: 'suspended',
    },
  );
  expect(procs.get.query).not.toHaveBeenCalled();
});

describe('flag on', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('uses the procedures', async () => {
    procs.get.query.mockResolvedValue({ results: summary });
    procs.rotateKey.mutate.mockResolvedValue({ results: summary });
    procs.setStatus.mutate.mockResolvedValue({ results: summary });
    expect(await fetchVillageBilling('v1')).toEqual(summary);
    expect(await rotateVillageBilling('v1')).toEqual(summary);
    expect(await setVillageBillingStatus('v1', 'revoked')).toEqual(summary);
    expect(procs.get.query).toHaveBeenCalledWith({ villageId: 'v1' });
    expect(procs.setStatus.mutate).toHaveBeenCalledWith({
      villageId: 'v1',
      status: 'revoked',
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('wraps a failure as VillageBillingError with the API text', async () => {
    const { TRPCClientError } = jest.requireActual('@trpc/client');
    const err = new TRPCClientError('Only admins can manage village billing.', {
      result: { error: { message: 'x', code: -1, data: {} } },
    } as any);
    (err as any).data = { httpStatus: 403 };
    procs.get.query.mockRejectedValue(err);
    const caught = await fetchVillageBilling('v1').catch((e) => e);
    expect(caught).toBeInstanceOf(VillageBillingError);
    expect(caught).toMatchObject({
      message: 'Only admins can manage village billing.',
      status: 403,
    });
  });
});
