import dayjs from 'dayjs';

import {
  buildBookingSearchWhere,
  isBookingIdSearch,
  matchesBookingSearchTerm,
  mergeBookingSearchWhere,
  parseBookingSearchDate,
} from '../bookingSearch.helpers';

const BOOKING_ID = '63fc8e8910354e3f945e249a';

describe('isBookingIdSearch', () => {
  it('recognises a mongo id', () => {
    expect(isBookingIdSearch(BOOKING_ID)).toBe(true);
    expect(isBookingIdSearch(` ${BOOKING_ID} `)).toBe(true);
  });

  it('rejects names and partial ids', () => {
    expect(isBookingIdSearch('Ana Silva')).toBe(false);
    expect(isBookingIdSearch('63fc8e89')).toBe(false);
  });
});

describe('parseBookingSearchDate', () => {
  it('parses an ISO day into a single-day range', () => {
    const range = parseBookingSearchDate('2026-03-12');
    expect(range).not.toBeNull();
    expect(dayjs(range!.from).format('YYYY-MM-DD HH:mm')).toBe(
      '2026-03-12 00:00',
    );
    expect(dayjs(range!.to).format('YYYY-MM-DD HH:mm')).toBe('2026-03-12 23:59');
  });

  it('reads slashed dates as day/month', () => {
    const range = parseBookingSearchDate('12/03/2026');
    expect(dayjs(range!.from).format('YYYY-MM-DD')).toBe('2026-03-12');
  });

  it('defaults a year-less day to the current year', () => {
    const range = parseBookingSearchDate('12/03');
    expect(dayjs(range!.from).format('MM-DD')).toBe('03-12');
    expect(dayjs(range!.from).year()).toBe(dayjs().year());
  });

  it('expands a month to the whole month', () => {
    const range = parseBookingSearchDate('2026-03');
    expect(dayjs(range!.from).format('YYYY-MM-DD')).toBe('2026-03-01');
    expect(dayjs(range!.to).format('YYYY-MM-DD')).toBe('2026-03-31');
  });

  it('accepts a month name', () => {
    const range = parseBookingSearchDate('March');
    expect(dayjs(range!.from).format('MM-DD')).toBe('03-01');
  });

  it('returns null for a name', () => {
    expect(parseBookingSearchDate('Ana Silva')).toBeNull();
    expect(parseBookingSearchDate('')).toBeNull();
  });
});

describe('buildBookingSearchWhere', () => {
  it('is inactive for an empty term', () => {
    expect(buildBookingSearchWhere({ term: '  ', userIds: [] })).toBeNull();
  });

  it('matches resolved guests on createdBy or paidBy', () => {
    const where = buildBookingSearchWhere({
      term: 'Ana',
      userIds: ['u1', 'u2'],
    });
    expect(where).toEqual({
      $or: [{ createdBy: { $in: ['u1', 'u2'] } }, { paidBy: { $in: ['u1', 'u2'] } }],
    });
  });

  it('matches a booking id directly', () => {
    expect(buildBookingSearchWhere({ term: BOOKING_ID, userIds: null })).toEqual({
      $or: [{ _id: BOOKING_ID }],
    });
  });

  it('matches bookings overlapping a searched date', () => {
    const where = buildBookingSearchWhere({ term: '2026-03-12', userIds: [] });
    const dateClause = where!.$or[0];
    expect(Object.keys(dateClause)).toEqual(['$and']);
    expect(dayjs(dateClause.$and[0].start.$lte).format('YYYY-MM-DD')).toBe(
      '2026-03-12',
    );
    expect(dayjs(dateClause.$and[1].end.$gte).format('YYYY-MM-DD')).toBe(
      '2026-03-12',
    );
  });

  it('combines guest and date matches', () => {
    const where = buildBookingSearchWhere({
      term: '2026-03-12',
      userIds: ['u1'],
    });
    expect(where!.$or).toHaveLength(3);
  });

  it('matches nothing when a non-empty term resolves to nothing', () => {
    expect(buildBookingSearchWhere({ term: 'Nobody', userIds: [] })).toEqual({
      _id: { $in: [] },
    });
  });
});

describe('mergeBookingSearchWhere', () => {
  it('returns the base untouched when there is no search', () => {
    const base = { status: { $nin: ['open'] } };
    expect(mergeBookingSearchWhere(base, null)).toEqual(base);
  });

  it('spreads non-conflicting keys', () => {
    const merged = mergeBookingSearchWhere(
      { status: 'pending' },
      { $or: [{ _id: BOOKING_ID }] },
    );
    expect(merged).toEqual({
      status: 'pending',
      $or: [{ _id: BOOKING_ID }],
    });
  });

  it('moves a colliding $or into $and so neither side is lost', () => {
    const base = {
      end: { $gte: new Date('2026-01-01') },
      $or: [{ status: 'pending' }],
    };
    const merged = mergeBookingSearchWhere(base, {
      $or: [{ createdBy: { $in: ['u1'] } }],
    });

    expect(merged.$or).toBeUndefined();
    expect(merged.end).toEqual(base.end);
    expect(merged.$and).toEqual([
      { $or: [{ status: 'pending' }] },
      { $or: [{ createdBy: { $in: ['u1'] } }] },
    ]);
  });

  it('preserves an existing $and', () => {
    const merged = mergeBookingSearchWhere(
      { $and: [{ a: 1 }], $or: [{ b: 2 }] },
      { $or: [{ c: 3 }] },
    );
    expect(merged.$and).toEqual([
      { a: 1 },
      { $or: [{ b: 2 }] },
      { $or: [{ c: 3 }] },
    ]);
  });

  it('does not mutate the base', () => {
    const base = { $or: [{ status: 'pending' }] };
    mergeBookingSearchWhere(base, { $or: [{ createdBy: { $in: ['u1'] } }] });
    expect(base).toEqual({ $or: [{ status: 'pending' }] });
  });
});

describe('matchesBookingSearchTerm', () => {
  const row = {
    _id: BOOKING_ID,
    guestName: 'Ana Silva',
    guestEmail: 'ana@example.com',
    listingName: 'Glamping tent',
    status: 'paid',
    start: '2026-03-10T14:00:00.000Z',
    end: '2026-03-15T11:00:00.000Z',
  };

  it('keeps every row for an empty term', () => {
    expect(matchesBookingSearchTerm(row, '   ')).toBe(true);
  });

  it('matches first name, last name and full name', () => {
    expect(matchesBookingSearchTerm(row, 'Ana')).toBe(true);
    expect(matchesBookingSearchTerm(row, 'Silva')).toBe(true);
    expect(matchesBookingSearchTerm(row, 'ana silva')).toBe(true);
  });

  it('matches partial names case-insensitively', () => {
    expect(matchesBookingSearchTerm(row, 'sil')).toBe(true);
  });

  it('matches email, listing, status and id', () => {
    expect(matchesBookingSearchTerm(row, 'ana@example')).toBe(true);
    expect(matchesBookingSearchTerm(row, 'glamping')).toBe(true);
    expect(matchesBookingSearchTerm(row, 'paid')).toBe(true);
    expect(matchesBookingSearchTerm(row, BOOKING_ID)).toBe(true);
  });

  it('matches a date inside the stay, not outside it', () => {
    expect(matchesBookingSearchTerm(row, '2026-03-12')).toBe(true);
    expect(matchesBookingSearchTerm(row, '2026-03-20')).toBe(false);
  });

  it('rejects a non-matching term', () => {
    expect(matchesBookingSearchTerm(row, 'Bruno')).toBe(false);
  });
});
