import { renderHook, waitFor } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';
import { fromJS } from 'immutable';

import api from '../api';
import {
  BookingListQuery,
  bookingListFilter,
  fetchAttendedEventBookings,
  fetchBooking,
  fetchBookingStat,
  fetchBookingsEndingFrom,
  fetchCitizenNights,
  fetchOnSiteUserIds,
  fetchOverlappingOwnStays,
  findBookingListTotal,
  iso,
  loadBooking,
  loadBookingFunnelCounts,
  loadBookingList,
  loadBookingsInRange,
  loadOwnBookings,
  pastBookingsList,
  patchBookingFields,
  toInRangeInput,
  upcomingBookingsList,
  useBookingSearch,
} from '../bookings';
import { parseMessageFromError } from '../common';
import { fetchUsersBySearchQuery } from '../searchUser';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  formatSearch: (where: unknown) => JSON.stringify(where),
}));

jest.mock('../searchUser', () => ({
  fetchUsersBySearchQuery: jest.fn().mockResolvedValue([]),
}));

const mockServerGet = jest.fn();

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpcFor: jest.fn(() => ({ booking: { get: { query: mockServerGet } } })),
  trpc: {
    booking: {
      mine: { query: jest.fn() },
      hostList: { query: jest.fn() },
      inRange: { query: jest.fn() },
      onSiteNow: { query: jest.fn() },
      citizenNights: { query: jest.fn() },
      get: { query: jest.fn() },
      update: { mutate: jest.fn() },
      funnelCounts: { query: jest.fn() },
      stats: { query: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedTrpcFor = trpcFor as jest.Mock;
const booking = trpc.booking as unknown as Record<
  string,
  { query: jest.Mock; mutate: jest.Mock }
>;

const guest = { _id: 'u1', email: 'ada@example.com' };
const stay = { _id: 'b1', start: '2026-05-01', end: '2026-05-05' };

const makePlatform = () => ({
  booking: {
    find: jest.fn(),
    findCount: jest.fn(),
    get: jest.fn().mockResolvedValue(undefined),
    getOne: jest.fn().mockResolvedValue(undefined),
    getCount: jest.fn().mockResolvedValue(undefined),
    patch: jest.fn().mockResolvedValue(undefined),
    setCount: jest.fn(),
  },
});

// The `load` the helper handed the store, which the store runs instead of its own request.
const runLoad = (mock: jest.Mock) => {
  const args = mock.mock.calls[0];
  return args[args.length - 1].load();
};

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32004,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('upcomingBookingsList', () => {
  it('builds the access `where` and the matching mine input', () => {
    const { filter, query } = upcomingBookingsList(guest, 50);

    expect(filter.limit).toBe(50);
    expect(filter.where.$or).toEqual([
      { createdBy: 'u1' },
      { guests: { $in: ['u1'] } },
      expect.objectContaining({ $and: expect.any(Array) }),
    ]);
    expect(filter.where.end.$gt).toBeInstanceOf(Date);
    expect(query).toEqual({
      mine: {
        userId: 'u1',
        statuses: filter.where.status,
        endAfter: expect.any(String),
        limit: 50,
        sortBy: '-created',
      },
    });
  });
});

describe('pastBookingsList', () => {
  it('hides stale cancelled stays in both shapes', () => {
    const { filter, query } = pastBookingsList(guest, 50);

    expect(filter.where.end.$lt).toBeInstanceOf(Date);
    expect(filter.where.$and).toHaveLength(1);
    expect(query).toEqual({
      mine: {
        userId: 'u1',
        endBefore: expect.any(String),
        hideCancelledEndedBefore: expect.any(String),
        limit: 50,
        sortBy: '-created',
      },
    });
    const { mine } = query as { mine: Record<string, string> };
    expect(
      new Date(mine.endBefore).getTime() -
        new Date(mine.hideCancelledEndedBefore).getTime(),
    ).toBeGreaterThanOrEqual(3 * 24 * 60 * 60 * 1000 - 1000);
  });
});

const filter = { where: { status: 'pending' }, limit: 15 };
const query: BookingListQuery = { hostList: { needsHostAction: true } };

describe('bookingListFilter', () => {
  it('keys the store by the legacy filter with the flag off', () => {
    mockedEnabled.mockReturnValue(false);
    expect(bookingListFilter(filter, query)).toBe(filter);
  });

  it('keys the store by the query with the flag on', () => {
    mockedEnabled.mockReturnValue(true);
    expect(bookingListFilter(filter, query)).toEqual({ query });
  });
});

describe('loadBookingList', () => {
  it('reads the page and the capped copy it counts with the flag off', () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    loadBookingList(platform, filter, query);
    expect(platform.booking.get).toHaveBeenNthCalledWith(1, filter);
    expect(platform.booking.get).toHaveBeenNthCalledWith(2, {
      where: filter.where,
      limit: 3000,
    });
  });

  it('reads hostList once and stores its total with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    booking.hostList.query.mockResolvedValue({
      bookings: [{ _id: 'b1' }],
      total: 40,
    });

    loadBookingList(platform, filter, query);
    expect(platform.booking.get).toHaveBeenCalledTimes(1);
    expect(platform.booking.get.mock.calls[0][0]).toEqual({ query });
    await expect(runLoad(platform.booking.get)).resolves.toEqual([
      { _id: 'b1' },
    ]);
    expect(booking.hostList.query).toHaveBeenCalledWith({
      needsHostAction: true,
    });
    expect(platform.booking.setCount).toHaveBeenCalledWith({ query }, 40);
  });

  it('reads mine for a guest list with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    booking.mine.query.mockResolvedValue({ bookings: [], total: 0 });

    loadBookingList(platform, filter, { mine: { limit: 50 } });
    await runLoad(platform.booking.get);
    expect(booking.mine.query).toHaveBeenCalledWith({ limit: 50 });
  });

  it('maps a tRPC error to the legacy error shape', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    booking.hostList.query.mockRejectedValue(
      trpcError('FORBIDDEN', 403, 'Forbidden'),
    );

    loadBookingList(platform, filter, query);
    const error = await runLoad(platform.booking.get).catch((e: unknown) => e);
    expect(parseMessageFromError(error)).toBe('Forbidden');
    expect(platform.booking.setCount).not.toHaveBeenCalled();
  });
});

describe('findBookingListTotal', () => {
  it('counts the capped copy with the flag off', () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();
    platform.booking.find.mockReturnValue(fromJS([{}, {}, {}]));

    expect(findBookingListTotal(platform, filter, query)).toBe(3);
    expect(platform.booking.find).toHaveBeenCalledWith({
      where: filter.where,
      limit: 3000,
    });
  });

  it('reads the stored total with the flag on', () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    platform.booking.findCount.mockReturnValue(40);

    expect(findBookingListTotal(platform, filter, query)).toBe(40);
    expect(platform.booking.findCount).toHaveBeenCalledWith({ query });
  });
});

describe('useBookingSearch', () => {
  it('resolves guests into a `where` with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    (fetchUsersBySearchQuery as jest.Mock).mockResolvedValue([{ _id: 'u9' }]);

    const { result } = renderHook(() => useBookingSearch('Ana'));
    await waitFor(() => expect(result.current.searchWhere).not.toBeNull());
    expect(result.current.searchWhere).toEqual({
      $or: [{ createdBy: { $in: ['u9'] } }, { paidBy: { $in: ['u9'] } }],
    });
    expect(result.current.search).toBeUndefined();
  });

  it('sends the debounced term without a guest lookup with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);

    const { result, rerender } = renderHook(
      ({ term }) => useBookingSearch(term),
      { initialProps: { term: '' } },
    );
    rerender({ term: ' Ana ' });
    expect(result.current.isSearching).toBe(true);
    await waitFor(() => expect(result.current.search).toBe('Ana'));
    expect(result.current.searchWhere).toBeNull();
    expect(result.current.isSearching).toBe(false);
    expect(fetchUsersBySearchQuery).not.toHaveBeenCalled();
  });
});

describe('iso', () => {
  it('sends an invalid date as the epoch, as closer-api cast legacy null', () => {
    expect(iso('2026-05-01')).toBe('2026-05-01T00:00:00.000Z');
    expect(iso('not a date')).toBe('1970-01-01T00:00:00.000Z');
  });
});

describe('toInRangeInput', () => {
  it('reads statuses and both bounds from either `where` shape', () => {
    expect(
      toInRangeInput({
        where: {
          status: { $in: ['paid'] },
          $and: [
            { start: { $lte: new Date('2026-02-01') } },
            { end: { $gte: new Date('2026-01-01') } },
          ],
        },
        sort_by: 'start',
        limit: 3000,
      }),
    ).toEqual({
      statuses: ['paid'],
      startBefore: '2026-02-01T00:00:00.000Z',
      endAfter: '2026-01-01T00:00:00.000Z',
      limit: 3000,
      sortBy: 'start',
    });
    expect(
      toInRangeInput({
        where: {
          start: { $gte: 0 },
          end: { $gt: '2026-01-01T00:00:00.000Z' },
        },
      }),
    ).toEqual({
      startAfter: '1970-01-01T00:00:00.000Z',
      endAfter: '2026-01-01T00:00:00.000Z',
      sortBy: '-created',
    });
  });
});

describe('loadBookingsInRange', () => {
  const rangeFilter = {
    where: {
      status: { $in: ['paid', 'checked-in'] },
      start: { $lte: new Date('2026-02-01') },
      end: { $gte: new Date('2026-01-01') },
    },
    limit: 3000,
  };

  it('calls the store get with the flag off', () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    loadBookingsInRange(platform, rangeFilter);
    expect(platform.booking.get).toHaveBeenCalledWith(rangeFilter);
  });

  it('hands the store an inRange load with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    booking.inRange.query.mockResolvedValue([{ _id: 'b1' }]);

    loadBookingsInRange(platform, rangeFilter);
    expect(platform.booking.get.mock.calls[0][0]).toBe(rangeFilter);
    await expect(runLoad(platform.booking.get)).resolves.toEqual([
      { _id: 'b1' },
    ]);
    expect(booking.inRange.query).toHaveBeenCalledWith({
      statuses: ['paid', 'checked-in'],
      startBefore: '2026-02-01T00:00:00.000Z',
      endAfter: '2026-01-01T00:00:00.000Z',
      limit: 3000,
      sortBy: '-created',
    });
  });
});

describe('loadOwnBookings', () => {
  const ownFilter = { where: { createdBy: 'u1' }, limit: 50 };
  const input = { createdOnly: true, statuses: ['paid'], limit: 50 };

  it('calls the store get with the flag off', () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    loadOwnBookings(platform, ownFilter, input);
    expect(platform.booking.get).toHaveBeenCalledWith(ownFilter);
  });

  it('hands the store the mine bookings with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    booking.mine.query.mockResolvedValue({
      bookings: [{ _id: 'b1' }],
      total: 1,
    });

    loadOwnBookings(platform, ownFilter, input);
    await expect(runLoad(platform.booking.get)).resolves.toEqual([
      { _id: 'b1' },
    ]);
    expect(booking.mine.query).toHaveBeenCalledWith(input);
  });
});

describe('fetchOnSiteUserIds', () => {
  it('collects createdBy and paidBy from the store read with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();
    platform.booking.get.mockResolvedValue({
      results: fromJS([
        { createdBy: 'u1', paidBy: 'u2' },
        { createdBy: 'u2' },
        { createdBy: 'u3' },
      ]),
    });

    await expect(fetchOnSiteUserIds(platform)).resolves.toEqual([
      'u1',
      'u2',
      'u3',
    ]);
    expect(platform.booking.get).toHaveBeenCalledWith({
      where: {
        status: { $in: ['paid', 'checked-in'] },
        start: { $lte: expect.any(Date) },
        end: { $gte: expect.any(Date) },
      },
      limit: 500,
    });
  });

  it('reads onSiteNow with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    booking.onSiteNow.query.mockResolvedValue(['u1', 'u2']);

    await expect(fetchOnSiteUserIds(makePlatform())).resolves.toEqual([
      'u1',
      'u2',
    ]);
  });

  it('answers none when onSiteNow fails, as the store did', async () => {
    mockedEnabled.mockReturnValue(true);
    booking.onSiteNow.query.mockRejectedValue(
      trpcError('UNAUTHORIZED', 401, 'Unauthorized'),
    );

    await expect(fetchOnSiteUserIds(makePlatform())).resolves.toEqual([]);
  });
});

describe('fetchBookingsEndingFrom', () => {
  it('sends the access `where` with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [{ _id: 'b1' }] } });

    await expect(
      fetchBookingsEndingFrom(guest, '2026-05-01T00:00:00.000Z'),
    ).resolves.toEqual([{ _id: 'b1' }]);
    const [path, { params }] = mockedApi.get.mock.calls[0];
    expect(path).toBe('/booking');
    expect(params.limit).toBe(50);
    expect(params.where.end).toEqual({ $gte: '2026-05-01T00:00:00.000Z' });
    expect(params.where.$or[0]).toEqual({ createdBy: 'u1' });
  });

  it('reads mine with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    booking.mine.query.mockResolvedValue({
      bookings: [{ _id: 'b1' }],
      total: 1,
    });

    await expect(
      fetchBookingsEndingFrom(guest, '2026-05-01T00:00:00.000Z'),
    ).resolves.toEqual([{ _id: 'b1' }]);
    expect(booking.mine.query).toHaveBeenCalledWith({
      statuses: expect.arrayContaining(['pending', 'paid']),
      endAfter: '2026-05-01T00:00:00.000Z',
      limit: 50,
    });
  });
});

describe('fetchAttendedEventBookings', () => {
  it('sends the member `where` with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [{ eventId: 'e1' }] } });

    await expect(
      fetchAttendedEventBookings('m1', ['paid'], 200),
    ).resolves.toEqual([{ eventId: 'e1' }]);
    expect(mockedApi.get).toHaveBeenCalledWith('/booking', {
      params: {
        where: {
          createdBy: 'm1',
          eventId: { $exists: true },
          status: { $in: ['paid'] },
        },
        limit: 200,
      },
    });
  });

  it('reads mine for the member with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    booking.mine.query.mockResolvedValue({
      bookings: [{ eventId: 'e1' }],
      total: 1,
    });

    await expect(
      fetchAttendedEventBookings('m1', ['paid'], 200),
    ).resolves.toEqual([{ eventId: 'e1' }]);
    expect(booking.mine.query).toHaveBeenCalledWith({
      userId: 'm1',
      createdOnly: true,
      hasEvent: true,
      statuses: ['paid'],
      limit: 200,
    });
  });
});

describe('fetchOverlappingOwnStays', () => {
  it('sends the overlap `where` with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [{ _id: 'b2' }] } });

    await expect(fetchOverlappingOwnStays(stay, 'u1')).resolves.toEqual([
      { _id: 'b2' },
    ]);
    const [, { params }] = mockedApi.get.mock.calls[0];
    expect(params).toEqual({
      where: expect.objectContaining({
        createdBy: 'u1',
        _id: { $ne: 'b1' },
        start: { $lt: '2026-05-05' },
        end: { $gt: '2026-05-01' },
      }),
      limit: 20,
    });
  });

  it('reads mine with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    booking.mine.query.mockResolvedValue({
      bookings: [{ _id: 'b2' }],
      total: 1,
    });

    await expect(fetchOverlappingOwnStays(stay, 'u1')).resolves.toEqual([
      { _id: 'b2' },
    ]);
    expect(booking.mine.query).toHaveBeenCalledWith({
      createdOnly: true,
      excludeId: 'b1',
      statuses: expect.arrayContaining(['tokens-staked']),
      startBefore: '2026-05-04T23:59:59.999Z',
      endAfter: '2026-05-01T00:00:00.001Z',
      limit: 20,
    });
  });
});

describe('fetchCitizenNights', () => {
  const windowStart = new Date('2024-01-01T00:00:00.000Z');
  const now = new Date('2026-01-01T00:00:00.000Z');

  it('pages the window bookings and sums them with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({
      data: {
        results: [
          { createdBy: 'u1', duration: 3 },
          { createdBy: 'u1', duration: 2 },
        ],
      },
    });

    await expect(
      fetchCitizenNights(['u1', 'u2'], windowStart, now),
    ).resolves.toEqual({ u1: 5, u2: 0 });
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get.mock.calls[0][1].params).toMatchObject({
      limit: 300,
      page: 1,
      sort_by: '-end',
    });
  });

  it('answers null when legacy shows no booking', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [] } });

    await expect(fetchCitizenNights(['u1'], windowStart, now)).resolves.toBe(
      null,
    );
  });

  it('reads citizenNights with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    booking.citizenNights.query.mockResolvedValue({
      nightsByUser: { u1: 5, u2: 0 },
      bookings: 2,
    });

    await expect(
      fetchCitizenNights(['u1', 'u2'], windowStart, now),
    ).resolves.toEqual({ u1: 5, u2: 0 });
    expect(booking.citizenNights.query).toHaveBeenCalledWith({
      userIds: ['u1', 'u2'],
      windowStart: '2024-01-01T00:00:00.000Z',
    });
  });

  it('answers null when tRPC counts no booking or fails', async () => {
    mockedEnabled.mockReturnValue(true);
    booking.citizenNights.query.mockResolvedValueOnce({
      nightsByUser: { u1: 0 },
      bookings: 0,
    });
    await expect(fetchCitizenNights(['u1'], windowStart, now)).resolves.toBe(
      null,
    );

    booking.citizenNights.query.mockRejectedValueOnce(
      trpcError('UNAUTHORIZED', 401, 'Unauthorized'),
    );
    await expect(fetchCitizenNights(['u1'], windowStart, now)).resolves.toBe(
      null,
    );
  });
});

describe('loadBooking', () => {
  it('calls the store getOne with the flag off', () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    loadBooking(platform, 'b1', { force: true });
    expect(platform.booking.getOne).toHaveBeenCalledWith('b1', { force: true });
  });

  it('hands the store a booking.get load with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    booking.get.query.mockResolvedValue({ _id: 'b1' });

    loadBooking(platform, 'b1', { force: true });
    expect(platform.booking.getOne.mock.calls[0][1].force).toBe(true);
    await expect(runLoad(platform.booking.getOne)).resolves.toEqual({
      _id: 'b1',
    });
    expect(booking.get.query).toHaveBeenCalledWith({ id: 'b1' });
  });
});

describe('fetchBooking', () => {
  it('sends the cookie token as a Bearer header with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: { _id: 'b1' } } });

    await expect(fetchBooking('b1', { token: 'tok' })).resolves.toEqual({
      _id: 'b1',
    });
    expect(mockedApi.get).toHaveBeenCalledWith('/booking/b1', {
      headers: { Authorization: 'Bearer tok' },
    });
  });

  it('reads booking.get as the token holder with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    mockServerGet.mockResolvedValue({ _id: 'b1' });

    await expect(fetchBooking('b1', { token: 'tok' })).resolves.toEqual({
      _id: 'b1',
    });
    expect(mockedTrpcFor).toHaveBeenCalledWith('tok');
    expect(mockServerGet).toHaveBeenCalledWith({ id: 'b1' });
  });

  it('rejects NOT_FOUND with the legacy 404 text', async () => {
    mockedEnabled.mockReturnValue(true);
    booking.get.query.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'Booking not found'),
    );

    const error = await fetchBooking('b1').catch((e: unknown) => e);
    expect((error as any).response.status).toBe(404);
  });
});

describe('patchBookingFields', () => {
  const fields = [{ name: 'diet', value: 'vegan' }];

  it('calls the store patch with the flag off', () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    patchBookingFields(platform, 'b1', fields);
    expect(platform.booking.patch).toHaveBeenCalledWith('b1', { fields });
  });

  it('hands the store a booking.update load with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    booking.update.mutate.mockResolvedValue({ _id: 'b1', fields });

    patchBookingFields(platform, 'b1', fields);
    expect(platform.booking.patch.mock.calls[0].slice(0, 2)).toEqual([
      'b1',
      { fields },
    ]);
    await expect(runLoad(platform.booking.patch)).resolves.toEqual({
      _id: 'b1',
      fields,
    });
    expect(booking.update.mutate).toHaveBeenCalledWith({ id: 'b1', fields });
  });
});

describe('loadBookingFunnelCounts', () => {
  const created = {
    $gte: new Date('2026-01-01T00:00:00.000Z'),
    $lte: new Date('2026-01-31T00:00:00.000Z'),
  };
  const filters = {
    allBookingsFilter: { where: { created } },
    pendingOrBeyondFilter: { where: { status: { $in: ['pending'] }, created } },
    confirmedOrBeyondFilter: {
      where: { status: { $in: ['confirmed'] }, created },
    },
    paidOrBeyondFilter: { where: { status: { $in: ['paid'] }, created } },
  };

  it('runs the four store counts with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    await loadBookingFunnelCounts(platform, filters);
    expect(platform.booking.getCount.mock.calls.map(([f]) => f)).toEqual([
      filters.allBookingsFilter,
      filters.pendingOrBeyondFilter,
      filters.confirmedOrBeyondFilter,
      filters.paidOrBeyondFilter,
    ]);
  });

  it('stores funnelCounts under each filter with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    booking.funnelCounts.query.mockResolvedValue({
      all: 10,
      pendingOrBeyond: 6,
      confirmedOrBeyond: 4,
      paidOrBeyond: 2,
    });

    await loadBookingFunnelCounts(platform, filters);
    expect(booking.funnelCounts.query).toHaveBeenCalledWith({
      createdAfter: '2026-01-01T00:00:00.000Z',
      createdBefore: '2026-01-31T00:00:00.000Z',
    });
    expect(platform.booking.setCount.mock.calls).toEqual([
      [filters.allBookingsFilter, 10],
      [filters.pendingOrBeyondFilter, 6],
      [filters.confirmedOrBeyondFilter, 4],
      [filters.paidOrBeyondFilter, 2],
    ]);
  });

  it('sends no bounds for all time and leaves the store on failure', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    booking.funnelCounts.query.mockRejectedValue(
      trpcError('UNAUTHORIZED', 401, 'Unauthorized'),
    );

    await loadBookingFunnelCounts(platform, {
      ...filters,
      allBookingsFilter: { where: {} },
    });
    expect(booking.funnelCounts.query).toHaveBeenCalledWith({});
    expect(platform.booking.setCount).not.toHaveBeenCalled();
  });
});

describe('fetchBookingStat', () => {
  const overlap = {
    status: { $in: ['paid'] },
    $and: [
      { start: { $lte: '2026-01-31T00:00:00.000Z' } },
      { end: { $gte: '2026-01-01T00:00:00.000Z' } },
    ],
  };
  const stats = {
    bookings: 4,
    nights: 9,
    guests: 6,
    eventGuests: 2,
    volunteers: 1,
  };

  it('answers each tile of one period from a single stats read', async () => {
    booking.stats.query.mockResolvedValue(stats);

    const values = await Promise.all([
      fetchBookingStat({ kind: 'count', model: 'booking', where: overlap }),
      fetchBookingStat({
        kind: 'sum',
        model: 'booking',
        field: 'duration',
        where: overlap,
      }),
      fetchBookingStat({
        kind: 'sum',
        model: 'booking',
        field: 'adults',
        where: overlap,
      }),
      fetchBookingStat({
        kind: 'sum',
        model: 'booking',
        field: 'adults',
        where: { ...overlap, eventId: { $exists: true } },
      }),
      fetchBookingStat({
        kind: 'sum',
        model: 'booking',
        field: 'adults',
        where: { ...overlap, volunteerId: { $exists: true } },
      }),
    ]);

    expect(values).toEqual([4, 9, 6, 2, 1]);
    expect(booking.stats.query).toHaveBeenCalledTimes(1);
    expect(booking.stats.query).toHaveBeenCalledWith({
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-31T00:00:00.000Z',
    });
  });

  it('reads the period by key, whatever the clause order', async () => {
    booking.stats.query.mockResolvedValue(stats);

    await fetchBookingStat({
      kind: 'count',
      model: 'booking',
      where: { ...overlap, $and: [...overlap.$and].reverse() },
    });
    expect(booking.stats.query).toHaveBeenCalledWith({
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-31T00:00:00.000Z',
    });
  });

  it('sends no period for all time', async () => {
    booking.stats.query.mockResolvedValue(stats);

    await expect(
      fetchBookingStat({
        kind: 'count',
        model: 'booking',
        where: { status: { $in: ['paid'] } },
      }),
    ).resolves.toBe(4);
    expect(booking.stats.query).toHaveBeenCalledWith(undefined);
  });
});
