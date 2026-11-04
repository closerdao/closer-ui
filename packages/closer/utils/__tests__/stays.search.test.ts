import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  checkStayListingAvailability,
  fetchEventAvailability,
  fetchGuestNights,
  searchStays,
  validateDiscountCode,
} from '../stays.api';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    stay: {
      search: { query: jest.fn() },
      listingAvailability: { query: jest.fn() },
      eventAvailability: { query: jest.fn() },
      nightsByUser: { query: jest.fn() },
      validateDiscount: { query: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const stay = trpc.stay as unknown as Record<string, { query: jest.Mock }>;

const searchPayload = {
  start: '2026-11-01',
  end: '2026-11-05',
  adults: 2,
  children: 1,
  bookingType: 'volunteer' as const,
};
const searchBody = {
  results: [],
  availability: [],
  duration: 4,
  bookingRate: 'daily',
  discount: 0,
  discounts: { daily: 0, weekly: 0.1, monthly: 0.2 },
};
const availabilityBody = {
  results: true,
  availability: [],
  availabilityReason: '',
  numberOfUnitsRequired: 1,
  maxUnits: 2,
};
const eventBody = {
  availability: 40,
  ticketOptions: [{ name: 'Full', available: 10 }],
};
const nights = {
  userId: 'u1',
  totalNights: 21,
  bookings: 2,
  firstStay: '2026-01-01',
  lastStay: '2026-03-01',
};
const probe = {
  status: 'success',
  reason: '',
  applicableTicketName: '',
  discount: { code: 'FRIEND', percent: 10 },
  discountType: 'percent',
  discountVal: 0,
  discountPercent: 10,
};

const forbidden = () =>
  new TRPCClientError('Not authorized to read this guest stay history.', {
    result: {
      error: {
        message: 'Not authorized to read this guest stay history.',
        code: -32003,
        data: { code: 'FORBIDDEN', httpStatus: 403, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('posts the search and returns its whole body', async () => {
    mockedApi.post.mockResolvedValue({ data: searchBody });

    await expect(searchStays(searchPayload)).resolves.toBe(searchBody);
    expect(mockedApi.post).toHaveBeenCalledWith('/stays/search', searchPayload);
    expect(stay.search.query).not.toHaveBeenCalled();
  });

  it('posts a listing availability check and returns its whole body', async () => {
    mockedApi.post.mockResolvedValue({ data: availabilityBody });
    const payload = { start: '2026-11-01', end: '2026-11-05', adults: 2 };

    await expect(checkStayListingAvailability('l1', payload)).resolves.toBe(
      availabilityBody,
    );
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/stays/listing/l1/availability',
      payload,
    );
    expect(stay.listingAvailability.query).not.toHaveBeenCalled();
  });

  it('gets an event availability body', async () => {
    mockedApi.get.mockResolvedValue({ data: eventBody });

    await expect(fetchEventAvailability('e1')).resolves.toBe(eventBody);
    expect(mockedApi.get).toHaveBeenCalledWith('/stays/event/e1/availability');
    expect(stay.eventAvailability.query).not.toHaveBeenCalled();
  });

  it('gets a guest night count, cached or not', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: nights } });

    await expect(fetchGuestNights('u1')).resolves.toBe(nights);
    await fetchGuestNights('u1', { cache: false });

    expect(mockedApi.get.mock.calls).toEqual([
      ['/stays/nights/u1'],
      ['/stays/nights/u1', { cache: false }],
    ]);
    expect(stay.nightsByUser.query).not.toHaveBeenCalled();
  });

  it('rejects a guest night count the caller may not read', async () => {
    mockedApi.get.mockRejectedValue({ response: { status: 401 } });

    await expect(fetchGuestNights('u2')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('posts a discount probe and unwraps its results', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: probe } });
    const payload = { discountCode: 'FRIEND', eventId: 'e1' };

    await expect(validateDiscountCode(payload)).resolves.toBe(probe);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/stays/validate-discount-code',
      payload,
    );
    expect(stay.validateDiscount.query).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('searches with the same payload and returns the same body', async () => {
    stay.search.query.mockResolvedValue(searchBody);

    await expect(searchStays(searchPayload)).resolves.toBe(searchBody);
    expect(stay.search.query).toHaveBeenCalledWith(searchPayload);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('checks a listing with its id beside the payload', async () => {
    stay.listingAvailability.query.mockResolvedValue(availabilityBody);
    const payload = {
      start: '2026-11-01',
      end: '2026-11-05',
      adults: 2,
      isTeamBooking: true,
    };

    await expect(checkStayListingAvailability('l1', payload)).resolves.toBe(
      availabilityBody,
    );
    expect(stay.listingAvailability.query).toHaveBeenCalledWith({
      listingId: 'l1',
      ...payload,
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('reads an event availability', async () => {
    stay.eventAvailability.query.mockResolvedValue(eventBody);

    await expect(fetchEventAvailability('e1')).resolves.toBe(eventBody);
    expect(stay.eventAvailability.query).toHaveBeenCalledWith({
      eventId: 'e1',
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads a guest night count', async () => {
    stay.nightsByUser.query.mockResolvedValue(nights);

    await expect(fetchGuestNights('u1', { cache: false })).resolves.toBe(
      nights,
    );
    expect(stay.nightsByUser.query).toHaveBeenCalledWith({ userId: 'u1' });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('rejects a guest night count the caller may not read', async () => {
    stay.nightsByUser.query.mockRejectedValue(forbidden());

    await expect(fetchGuestNights('u2')).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it('probes a discount code', async () => {
    stay.validateDiscount.query.mockResolvedValue(probe);
    const payload = { discountCode: 'FRIEND', stayId: 's1' };

    await expect(validateDiscountCode(payload)).resolves.toBe(probe);
    expect(stay.validateDiscount.query).toHaveBeenCalledWith(payload);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
