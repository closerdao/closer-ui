import api from '../api';
import { getDistributionBatches, getRecipients } from '../onchainAdmin';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    safe: { distributionBatches: { query: jest.fn() } },
    onchainAdmin: { recipients: { query: jest.fn() } },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const batches = trpc.safe.distributionBatches as unknown as {
  query: jest.Mock;
};
const recipients = trpc.onchainAdmin.recipients as unknown as {
  query: jest.Mock;
};

beforeEach(() => jest.clearAllMocks());

describe('getDistributionBatches', () => {
  it('uses the legacy route when tRPC is off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [{ saleId: 's1' }] } });
    expect(await getDistributionBatches(42, 's1')).toEqual([{ saleId: 's1' }]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/safe/token-distribution-batches',
      { params: { chainId: 42, saleIds: 's1' }, cache: false },
    );
  });

  it('uses the procedure when tRPC is on', async () => {
    mockedEnabled.mockReturnValue(true);
    batches.query.mockResolvedValue([{ saleId: 's1' }]);
    expect(await getDistributionBatches(42, 's1')).toEqual([{ saleId: 's1' }]);
    expect(batches.query).toHaveBeenCalledWith({ chainId: 42, saleIds: 's1' });
  });
});

describe('getRecipients', () => {
  it('uses the legacy route when tRPC is off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [{ _id: 'u1' }] } });
    expect(await getRecipients({ q: 'ab', limit: 10 })).toEqual([
      { _id: 'u1' },
    ]);
    expect(mockedApi.get).toHaveBeenCalledWith('/onchain-admin/recipients', {
      params: { q: 'ab', limit: 10 },
    });
  });

  it('uses the procedure when tRPC is on', async () => {
    mockedEnabled.mockReturnValue(true);
    recipients.query.mockResolvedValue([{ _id: 'u1' }]);
    expect(await getRecipients({ ids: 'u1' })).toEqual([{ _id: 'u1' }]);
    expect(recipients.query).toHaveBeenCalledWith({ ids: 'u1' });
  });
});
