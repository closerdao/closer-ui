import type { Stay } from '../../types/stay';
import api from '../api';
import {
  checkCreditsAvailability,
  getCreditsBalance,
  getStayAccommodationTokenTotal,
  getStayTokenPricePerNight,
} from '../stays.api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const baseStay = (overrides: Partial<Stay> = {}): Stay =>
  ({
    _id: 'stay_1',
    status: 'draft',
    listing: 'listing_1',
    start: '2026-09-12',
    end: '2026-09-18',
    duration: 6,
    adults: 1,
    children: 0,
    rentalToken: { val: 6, cur: 'TDF' },
    priceLock: {
      dailyRentalToken: { val: 1, cur: 'TDF' },
    },
    createdBy: 'user_1',
    created: '2026-05-01',
    updated: '2026-05-01',
    ...overrides,
  } as Stay);

describe('stays credits helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getStayTokenPricePerNight prefers dailyRentalToken', () => {
    expect(getStayTokenPricePerNight(baseStay())).toBe(1);
  });

  it('getStayTokenPricePerNight derives from accommodation total and nights', () => {
    const stay = baseStay({
      priceLock: undefined,
      rentalToken: { val: 6, cur: 'TDF' },
    });
    expect(getStayTokenPricePerNight(stay)).toBe(1);
  });

  it('checkCreditsAvailability posts stay start and token amounts', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { results: true } });
    const stay = baseStay();

    await expect(
      checkCreditsAvailability({
        startDate: stay.start,
        creditsAmount: getStayAccommodationTokenTotal(stay),
        minCreditsAmount: getStayTokenPricePerNight(stay),
      }),
    ).resolves.toBe(true);

    expect(api.post).toHaveBeenCalledWith('/credits/availability', {
      startDate: stay.start,
      creditsAmount: 6,
      minCreditsAmount: 1,
    });
  });

  it('checkCreditsAvailability returns false on error', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('network'));
    await expect(
      checkCreditsAvailability({
        startDate: '2026-09-12',
        creditsAmount: 6,
        minCreditsAmount: 1,
      }),
    ).resolves.toBe(false);
  });

  it('getCreditsBalance parses numeric results', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { results: 4.34 } });
    await expect(getCreditsBalance()).resolves.toBe(4.34);
  });
});
