import dayjs from 'dayjs';

import { MAX_BOOKINGS_TO_FETCH, UPCOMING_BOOKING_STATUSES } from '../constants';
import { useBookingSearchWhere } from '../hooks/useBookingSearchWhere';
import { useDebounce } from '../hooks/useDebounce';
import type { Booking, StakeConflictStay } from '../types/booking';
import api, { formatSearch } from './api';
import {
  CANCELLED_BOOKING_VISIBLE_DAYS,
  buildHideStaleCancelledBookingsClause,
} from './booking.helpers';
import { buildMyBookingsAccessOr } from './bookingCoGuests.helpers';
import {
  buildWindowBookingsWhere,
  sumNightsByUser,
} from './citizenFunnel.helpers';
import type { StatQuery } from './dashboardStats.helpers';
import { ACTIVE_BOOKING_STATUSES } from './events.helpers';
import {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  trpc,
  trpcFor,
} from './trpc';

type Platform = Record<string, any>;
type Bound = Date | string | number;
type BookingFilter = {
  where?: any;
  limit?: number;
  sort_by?: string;
  page?: number;
};

// Optional procedure inputs read as `void | input`.
type InputOf<Query extends (...args: any) => any> = Exclude<
  Parameters<Query>[0],
  void | undefined
>;
export type MineInput = InputOf<typeof trpc.booking.mine.query>;
export type HostListInput = InputOf<typeof trpc.booking.hostList.query>;
type FunnelInput = InputOf<typeof trpc.booking.funnelCounts.query>;

// The procedure behind a `Bookings` list; its filter stays the legacy request and store key.
export type BookingListQuery =
  { mine: MineInput } | { hostList: HostListInput };

// Legacy sent an invalid date as JSON null, which closer-api cast to the epoch.
const iso = (date: Bound) => {
  const parsed = new Date(date);
  return (Number.isNaN(parsed.getTime()) ? new Date(0) : parsed).toISOString();
};

const queryBookingList = (query: BookingListQuery) =>
  'mine' in query
    ? trpc.booking.mine.query(query.mine)
    : trpc.booking.hostList.query(query.hostList);

// The guest's upcoming stays as `user`, own, co-guest or friend booking.
export const upcomingBookingsList = (
  user: { _id: string; email?: string },
  limit: number,
): { filter: BookingFilter; query: BookingListQuery } => ({
  filter: {
    where: {
      $or: buildMyBookingsAccessOr(user),
      status: UPCOMING_BOOKING_STATUSES,
      end: {
        $gt: new Date(),
      },
    },
    limit,
  },
  query: {
    mine: {
      userId: user._id,
      statuses: [...UPCOMING_BOOKING_STATUSES],
      endAfter: iso(new Date()),
      limit,
      sortBy: '-created',
    },
  },
});

// The guest's past stays, cancelled ones only while recent.
export const pastBookingsList = (
  user: { _id: string; email?: string },
  limit: number,
): { filter: BookingFilter; query: BookingListQuery } => ({
  filter: {
    where: {
      $or: buildMyBookingsAccessOr(user),
      end: { $lt: new Date() },
      ...buildHideStaleCancelledBookingsClause(),
    },
    limit,
  },
  query: {
    mine: {
      userId: user._id,
      endBefore: iso(new Date()),
      hideCancelledEndedBefore: dayjs()
        .subtract(CANCELLED_BOOKING_VISIBLE_DAYS, 'day')
        .toISOString(),
      limit,
      sortBy: '-created',
    },
  },
});

// Bookings' store key: legacy reads under `filter`; tRPC under its query, which carries the host search.
export const bookingListFilter = (
  filter: BookingFilter,
  query: BookingListQuery,
) => (isTrpcEnabled() ? { query } : filter);

// Bookings' list into the store, and its total where `findBookingListTotal` reads it.
export const loadBookingList = (
  platform: Platform,
  filter: BookingFilter,
  query: BookingListQuery,
) => {
  if (!isTrpcEnabled()) {
    platform.booking.get(filter);
    platform.booking.get({
      where: filter.where,
      limit: MAX_BOOKINGS_TO_FETCH,
    });
    return;
  }
  const key = bookingListFilter(filter, query);
  platform.booking.get(key, {
    load: () =>
      queryBookingList(query)
        .then(({ bookings, total }) => {
          platform.booking.setCount(key, total);
          return bookings;
        })
        .catch(throwApiError),
  });
};

// Legacy counted a refetch capped at MAX_BOOKINGS_TO_FETCH; tRPC answers the exact total.
export const findBookingListTotal = (
  platform: Platform,
  filter: BookingFilter,
  query: BookingListQuery,
): number | undefined =>
  isTrpcEnabled()
    ? platform.booking.findCount(bookingListFilter(filter, query))
    : platform.booking.find({
        where: filter?.where,
        limit: MAX_BOOKINGS_TO_FETCH,
      })?.size;

// The host search term: legacy resolves it to a `where` here, tRPC sends it as typed and searches server-side.
export const useBookingSearch = (term: string) => {
  const trpcEnabled = isTrpcEnabled();
  const legacy = useBookingSearchWhere(trpcEnabled ? '' : term);
  const trimmed = term.trim();
  const debounced = useDebounce(trimmed, 300);
  if (!trpcEnabled) return { ...legacy, search: undefined };
  return {
    searchWhere: null,
    search: debounced || undefined,
    isSearching: trimmed !== debounced,
  };
};

// The `where` of the dashboard, current-guests and calendar reads: statuses and date bounds only.
type DateBounds = { $lte?: Bound; $lt?: Bound; $gte?: Bound; $gt?: Bound };
export type BookingRangeWhere = {
  status?: { $in: readonly string[] };
  start?: DateBounds;
  end?: DateBounds;
  $and?: { start?: DateBounds; end?: DateBounds }[];
};
export type BookingRangeFilter = {
  where: BookingRangeWhere;
  limit?: number;
  sort_by?: string;
  page?: number;
};

const upper = (bounds?: DateBounds) => bounds?.$lte ?? bounds?.$lt;
const lower = (bounds?: DateBounds) => bounds?.$gte ?? bounds?.$gt;

// Both bounds inclusive on the API; the strict ones here are `now`, where a millisecond never matters.
export const toInRangeInput = ({
  where,
  limit,
  page,
  sort_by,
}: BookingRangeFilter) => {
  const clauses = [where, ...(where.$and ?? [])];
  const pick = (field: 'start' | 'end', read: typeof upper) =>
    clauses.map((clause) => read(clause[field])).find((v) => v !== undefined);
  const startAfter = pick('start', lower);
  const startBefore = pick('start', upper);
  const endAfter = pick('end', lower);
  const endBefore = pick('end', upper);
  return {
    ...(where.status && { statuses: [...where.status.$in] }),
    ...(startAfter !== undefined && { startAfter: iso(startAfter) }),
    ...(startBefore !== undefined && { startBefore: iso(startBefore) }),
    ...(endAfter !== undefined && { endAfter: iso(endAfter) }),
    ...(endBefore !== undefined && { endBefore: iso(endBefore) }),
    ...(limit !== undefined && { limit }),
    ...(page !== undefined && { page }),
    sortBy: sort_by ?? '-created',
  };
};

// The store's `get(filter)` of a status-and-dates read; resolves the store's action, never rejects.
export const loadBookingsInRange = (
  platform: Platform,
  filter: BookingRangeFilter,
) =>
  isTrpcEnabled()
    ? platform.booking.get(filter, {
        load: () =>
          trpc.booking.inRange
            .query(toInRangeInput(filter))
            .catch(throwApiError),
      })
    : platform.booking.get(filter);

// The store's `get(filter)` of the caller's own bookings, read through `mine`.
export const loadOwnBookings = (
  platform: Platform,
  filter: BookingFilter,
  input: MineInput,
) =>
  isTrpcEnabled()
    ? platform.booking.get(filter, {
        load: () =>
          trpc.booking.mine
            .query(input)
            .then(({ bookings }) => bookings)
            .catch(throwApiError),
      })
    : platform.booking.get(filter);

// The people of paid stays spanning now, createdBy then paidBy per booking; none when the read fails.
export const fetchOnSiteUserIds = async (
  platform: Platform,
): Promise<string[]> => {
  if (!isTrpcEnabled()) {
    const now = new Date();
    const result = await platform.booking.get({
      where: {
        status: { $in: ['paid', 'checked-in'] },
        start: { $lte: now },
        end: { $gte: now },
      },
      limit: 500,
    });
    const bookings = result?.results?.toJS?.() ?? result?.results ?? [];
    const userIds = new Set<string>();
    bookings.forEach((booking: any) => {
      if (booking?.createdBy) userIds.add(booking.createdBy);
      if (booking?.paidBy) userIds.add(booking.paidBy);
    });
    return Array.from(userIds);
  }
  return trpc.booking.onSiteNow.query().catch(() => []);
};

// The ticket modal's own active bookings ending on or after the event's start, which may already cover it.
export const fetchBookingsEndingFrom = async (
  user: { _id: string; email?: string },
  eventStart: Bound,
): Promise<Booking[]> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get('/booking', {
      params: {
        where: {
          $or: buildMyBookingsAccessOr(user),
          status: ACTIVE_BOOKING_STATUSES,
          end: { $gte: eventStart },
        },
        limit: 50,
      },
    });
    return data?.results || [];
  }
  const { bookings } = await trpc.booking.mine
    .query({
      statuses: [...ACTIVE_BOOKING_STATUSES],
      endAfter: iso(eventStart),
      limit: 50,
    })
    .catch(throwApiError);
  return bookings as unknown as Booking[];
};

// The member's own event bookings in an attended status.
export const fetchAttendedEventBookings = async (
  memberId: string,
  statuses: string[],
  limit: number,
): Promise<{ eventId?: string }[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/booking', {
      params: {
        where: {
          createdBy: memberId,
          eventId: { $exists: true },
          status: { $in: statuses },
        },
        limit,
      },
    });
    return res?.data?.results;
  }
  const { bookings } = await trpc.booking.mine
    .query({
      userId: memberId,
      createdOnly: true,
      hasEvent: true,
      statuses,
      limit,
    })
    .catch(throwApiError);
  return bookings as { eventId?: string }[];
};

// The guest's other active stays overlapping `stay`.
export const fetchOverlappingOwnStays = async (
  stay: StakeConflictStay,
  userId: string,
): Promise<Booking[]> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get('/booking', {
      params: {
        where: {
          createdBy: userId,
          _id: { $ne: stay._id },
          status: ACTIVE_BOOKING_STATUSES,
          start: { $lt: stay.end },
          end: { $gt: stay.start },
        },
        limit: 20,
      },
    });
    return (data?.results as Booking[]) || [];
  }
  const { bookings } = await trpc.booking.mine
    .query({
      createdOnly: true,
      ...(stay._id && { excludeId: stay._id }),
      statuses: [...ACTIVE_BOOKING_STATUSES],
      ...(stay.end && { startBefore: iso(stay.end) }),
      ...(stay.start && { endAfter: iso(stay.start) }),
      limit: 20,
    })
    .catch(throwApiError);
  return bookings as unknown as Booking[];
};

/** `/booking` caps a page at 300 server-side; page until a short page arrives. */
const BOOKING_PAGE_LIMIT = 300;
const MAX_BOOKING_PAGES = 10;
/** Keeps the `$in` clause (and therefore the query string) to a sane size. */
const USER_IDS_PER_BOOKING_QUERY = 200;

// Nights per citizen in the window; null when no booking is visible at all or the read fails.
export const fetchCitizenNights = async (
  userIds: string[],
  windowStart: Date,
  now: Date,
): Promise<Record<string, number> | null> => {
  if (!isTrpcEnabled()) {
    const bookings: Array<{ createdBy?: unknown; duration?: unknown }> = [];
    try {
      for (let i = 0; i < userIds.length; i += USER_IDS_PER_BOOKING_QUERY) {
        const ids = userIds.slice(i, i + USER_IDS_PER_BOOKING_QUERY);
        const where = buildWindowBookingsWhere(ids, windowStart, now);
        for (
          let bookingPage = 1;
          bookingPage <= MAX_BOOKING_PAGES;
          bookingPage++
        ) {
          const res = await api.get('/booking', {
            params: {
              where: formatSearch(where),
              limit: BOOKING_PAGE_LIMIT,
              page: bookingPage,
              sort_by: '-end',
            },
          });
          const rows = res?.data?.results;
          if (!Array.isArray(rows)) break;
          bookings.push(...rows);
          if (rows.length < BOOKING_PAGE_LIMIT) break;
        }
      }
    } catch {
      return null;
    }
    if (bookings.length === 0) return null;
    return sumNightsByUser(bookings, userIds);
  }
  const result = await trpc.booking.citizenNights
    .query({ userIds, windowStart: windowStart.toISOString() })
    .catch(() => null);
  if (!result || result.bookings === 0) return null;
  return result.nightsByUser;
};

// The store's `getOne(id)`, where `findOne(id)` reads it.
export const loadBooking = (
  platform: Platform,
  id: string,
  opts: { force?: boolean } = {},
) =>
  platform.booking.getOne(
    id,
    isTrpcEnabled()
      ? {
          ...opts,
          load: () => trpc.booking.get.query({ id }).catch(throwApiError),
        }
      : opts,
  );

// Legacy `GET /booking/:id`; `token` is a server render's cookie token, which the browser's own client cannot see.
export const fetchBooking = async (
  id: string,
  options?: { token: string | undefined },
): Promise<Booking> => {
  if (!isTrpcEnabled()) {
    const path = `/booking/${id}`;
    const res = options
      ? await api.get(path, {
          headers: options.token
            ? { Authorization: `Bearer ${options.token}` }
            : undefined,
        })
      : await api.get(path);
    return res.data.results;
  }
  const result = await (
    options?.token ? trpcFor(options.token) : trpc
  ).booking.get
    .query({ id })
    .catch(throwApiErrorWithLegacy404);
  return result as unknown as Booking;
};

// The store's `patch(id, {fields})` of the questionnaire answers; resolves the store's action, never rejects.
export const patchBookingFields = (
  platform: Platform,
  id: string,
  fields: unknown,
) =>
  isTrpcEnabled()
    ? platform.booking.patch(
        id,
        { fields },
        {
          load: () =>
            trpc.booking.update
              .mutate({ id, fields: fields as any })
              .catch(throwApiError),
        },
      )
    : platform.booking.patch(id, { fields });

export type BookingFunnelFilters = {
  allBookingsFilter: { where: { created?: { $gte?: Bound; $lte?: Bound } } };
  pendingOrBeyondFilter: object;
  confirmedOrBeyondFilter: object;
  paidOrBeyondFilter: object;
};

// The stays funnel's four `getCount`s, where `findCount` reads them; a failed read leaves the store as it was.
export const loadBookingFunnelCounts = async (
  platform: Platform,
  filters: BookingFunnelFilters,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await Promise.all([
      platform.booking.getCount(filters.allBookingsFilter),
      platform.booking.getCount(filters.pendingOrBeyondFilter),
      platform.booking.getCount(filters.confirmedOrBeyondFilter),
      platform.booking.getCount(filters.paidOrBeyondFilter),
    ]);
    return;
  }
  const created = filters.allBookingsFilter.where.created;
  const input: FunnelInput = {
    ...(created?.$gte && { createdAfter: iso(created.$gte) }),
    ...(created?.$lte && { createdBefore: iso(created.$lte) }),
  };
  const counts = await trpc.booking.funnelCounts.query(input).catch(() => null);
  if (!counts) return;
  platform.booking.setCount(filters.allBookingsFilter, counts.all);
  platform.booking.setCount(
    filters.pendingOrBeyondFilter,
    counts.pendingOrBeyond,
  );
  platform.booking.setCount(
    filters.confirmedOrBeyondFilter,
    counts.confirmedOrBeyond,
  );
  platform.booking.setCount(filters.paidOrBeyondFilter, counts.paidOrBeyond);
};

type BookingStats = Awaited<ReturnType<typeof trpc.booking.stats.query>>;

// The dashboard asks every booking tile of one period at once; they share one read.
const statsInFlight = new Map<string, Promise<BookingStats>>();

const fetchBookingStats = (start?: string, end?: string) => {
  const key = `${start}|${end}`;
  const pending = statsInFlight.get(key);
  if (pending) return pending;
  const read = trpc.booking.stats
    .query(start && end ? { start, end } : undefined)
    .finally(() => statsInFlight.delete(key));
  statsInFlight.set(key, read);
  return read;
};

// The dashboard stat a legacy `/count/booking` or `/sum/booking/:field` query stands for.
const statKey = (
  query: Extract<StatQuery, { kind: 'count' | 'sum' }>,
): keyof BookingStats => {
  if (query.kind === 'count') return 'bookings';
  if (query.field === 'duration') return 'nights';
  if ('eventId' in query.where) return 'eventGuests';
  if ('volunteerId' in query.where) return 'volunteers';
  return 'guests';
};

// A booking headline stat over tRPC: the period comes from the overlap `$and` the spec built.
export const fetchBookingStat = async (
  query: Extract<StatQuery, { kind: 'count' | 'sum' }>,
): Promise<number> => {
  const overlap = query.where.$and as
    [{ start: { $lte: string } }, { end: { $gte: string } }] | undefined;
  const stats = await fetchBookingStats(
    overlap?.[1].end.$gte,
    overlap?.[0].start.$lte,
  );
  return stats[statKey(query)];
};
