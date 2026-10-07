import api from '../api';
import { waitForTokenSalePaidStatus } from '../tokenSale.helpers';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  formatSearch: JSON.stringify,
}));

beforeEach(() => jest.clearAllMocks());

it.each(['paid', 'completed'])(
  'stops polling immediately when a purchase is %s',
  async (status) => {
    const sale = { _id: 'sale-1', status };
    (api.get as jest.Mock).mockResolvedValue({ data: { results: [sale] } });
    expect(
      await waitForTokenSalePaidStatus('sale-1', {
        maxAttempts: 3,
        intervalMs: 0,
      }),
    ).toEqual(sale);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith(
      '/sale',
      expect.objectContaining({ cache: false }),
    );
  },
);

it('continues polling an unconfirmed payment until it is completed', async () => {
  (api.get as jest.Mock)
    .mockResolvedValueOnce({
      data: { results: [{ _id: 'sale-2', status: 'pending-payment' }] },
    })
    .mockResolvedValue({
      data: { results: [{ _id: 'sale-2', status: 'completed' }] },
    });
  expect(
    await waitForTokenSalePaidStatus('sale-2', {
      maxAttempts: 3,
      intervalMs: 0,
    }),
  ).toMatchObject({ status: 'completed' });
  expect(api.get).toHaveBeenCalledTimes(2);
});
