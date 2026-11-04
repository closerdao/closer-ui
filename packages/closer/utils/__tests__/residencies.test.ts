import api from '../api';
import { fetchResidencyAgreements } from '../residencies';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: { residency: { list: { query: jest.fn() } } },
}));

const mockedApi = api as unknown as { get: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const list = trpc.residency.list.query as unknown as jest.Mock;

const agreement = { _id: 'r1', status: 'pending' };

beforeEach(() => {
  jest.clearAllMocks();
});

it('reads /residencies uncached on the legacy API', async () => {
  mockedEnabled.mockReturnValue(false);
  mockedApi.get.mockResolvedValue({ data: { results: [agreement] } });

  await expect(
    fetchResidencyAgreements({ limit: 50, status: 'pending', mine: true }),
  ).resolves.toEqual([agreement]);

  expect(mockedApi.get).toHaveBeenCalledWith('/residencies', {
    params: { limit: 50, status: 'pending', mine: true },
    cache: false,
  });
  expect(list).not.toHaveBeenCalled();
});

it('lists through residency.list on tRPC', async () => {
  mockedEnabled.mockReturnValue(true);
  list.mockResolvedValue([agreement]);

  await expect(fetchResidencyAgreements({ limit: 50 })).resolves.toEqual([
    agreement,
  ]);

  expect(list).toHaveBeenCalledWith({ limit: 50 });
  expect(mockedApi.get).not.toHaveBeenCalled();
});
