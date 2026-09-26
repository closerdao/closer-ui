import api from './api';
import { CHARGE_PAGE_SIZE, fetchAllCharges } from './chargePages';

jest.mock('./api', () => ({ __esModule: true, default: { get: jest.fn() } }));

const mockedGet = api.get as jest.Mock;
const rows = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => ({ _id: `c${from + i}` }));

describe('fetchAllCharges', () => {
  beforeEach(() => mockedGet.mockReset());

  it('reads page after page until one comes back short', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: { results: rows(CHARGE_PAGE_SIZE) } })
      .mockResolvedValueOnce({
        data: { results: rows(CHARGE_PAGE_SIZE, CHARGE_PAGE_SIZE) },
      })
      .mockResolvedValueOnce({ data: { results: rows(5, 600) } });

    const all = await fetchAllCharges({ method: 'cash' });

    expect(all).toHaveLength(2 * CHARGE_PAGE_SIZE + 5);
    expect(mockedGet).toHaveBeenCalledTimes(3);
    expect(mockedGet.mock.calls[2][1].params).toMatchObject({
      where: { method: 'cash' },
      limit: CHARGE_PAGE_SIZE,
      page: 3,
    });
  });

  it('stops after one request when the first page is short', async () => {
    mockedGet.mockResolvedValueOnce({ data: { results: rows(2) } });

    expect(await fetchAllCharges({})).toHaveLength(2);
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });
});
