import {
  appendBookingCoGuest,
  buildMyBookingsAccessOr,
  canEditBookingCoGuests,
  canViewBookingAsGuest,
  getBookingCoGuestIds,
  getMaxBookingCoGuests,
  isBookingCoGuest,
  isBookingOwner,
  normalizeBookingGuests,
} from '../bookingCoGuests.helpers';

const booking = {
  createdBy: 'owner-1',
  paidBy: 'payer-1',
  guests: ['owner-1', 'guest-1', 'guest-2'],
};

describe('normalizeBookingGuests', () => {
  it('drops blanks, duplicates and the booking owner', () => {
    expect(
      normalizeBookingGuests(
        ['guest-1', 'owner-1', 'guest-1', '', 'guest-2'],
        'owner-1',
      ),
    ).toEqual(['guest-1', 'guest-2']);
  });
});

describe('getBookingCoGuestIds', () => {
  it('returns guest ids except the owner', () => {
    expect(getBookingCoGuestIds(booking)).toEqual(['guest-1', 'guest-2']);
  });

  it('reads ids from immutable-like collections', () => {
    expect(
      getBookingCoGuestIds({
        createdBy: 'owner-1',
        guests: { toJS: () => ['guest-1', 'owner-1'] },
      }),
    ).toEqual(['guest-1']);
  });
});

describe('isBookingOwner', () => {
  it('matches createdBy or paidBy', () => {
    expect(isBookingOwner(booking, 'owner-1')).toBe(true);
    expect(isBookingOwner(booking, 'payer-1')).toBe(true);
    expect(isBookingOwner(booking, 'guest-1')).toBe(false);
  });
});

describe('isBookingCoGuest', () => {
  it('is true only for listed guests who are not owner or payer', () => {
    expect(isBookingCoGuest(booking, 'guest-1')).toBe(true);
    expect(isBookingCoGuest(booking, 'owner-1')).toBe(false);
    expect(isBookingCoGuest(booking, 'payer-1')).toBe(false);
    expect(isBookingCoGuest(booking, 'stranger')).toBe(false);
  });
});

describe('canViewBookingAsGuest', () => {
  it('allows owners, payers and co-guests', () => {
    expect(canViewBookingAsGuest(booking, 'owner-1')).toBe(true);
    expect(canViewBookingAsGuest(booking, 'payer-1')).toBe(true);
    expect(canViewBookingAsGuest(booking, 'guest-2')).toBe(true);
    expect(canViewBookingAsGuest(booking, 'stranger')).toBe(false);
  });
});

describe('canEditBookingCoGuests', () => {
  it('allows the owner, payer or a space host', () => {
    expect(canEditBookingCoGuests(booking, 'owner-1')).toBe(true);
    expect(canEditBookingCoGuests(booking, 'guest-1')).toBe(false);
    expect(canEditBookingCoGuests(booking, 'guest-1', true)).toBe(true);
  });
});

describe('getMaxBookingCoGuests', () => {
  it('reserves one adult slot for the main guest', () => {
    expect(getMaxBookingCoGuests(1)).toBe(0);
    expect(getMaxBookingCoGuests(3)).toBe(2);
    expect(getMaxBookingCoGuests(undefined)).toBe(0);
  });
});

describe('appendBookingCoGuest', () => {
  it('appends onto the latest list so two rapid adds both stick', () => {
    const afterFirst = appendBookingCoGuest(
      ['guest-1'],
      'guest-2',
      'owner-1',
      3,
    );
    expect(afterFirst).toEqual(['guest-1', 'guest-2']);
    expect(
      appendBookingCoGuest(afterFirst ?? [], 'guest-3', 'owner-1', 4),
    ).toEqual(['guest-1', 'guest-2', 'guest-3']);
  });

  it('rejects duplicates, the owner, and adds past the adult cap', () => {
    expect(
      appendBookingCoGuest(['guest-1'], 'guest-1', 'owner-1', 3),
    ).toBeNull();
    expect(
      appendBookingCoGuest(['guest-1'], 'owner-1', 'owner-1', 3),
    ).toBeNull();
    expect(
      appendBookingCoGuest(['guest-1'], 'guest-2', 'owner-1', 2),
    ).toBeNull();
  });
});

describe('buildMyBookingsAccessOr', () => {
  it('includes owned and co-guest bookings', () => {
    expect(buildMyBookingsAccessOr({ _id: 'user-1' })).toEqual([
      { createdBy: 'user-1' },
      { guests: { $in: ['user-1'] } },
    ]);
  });

  it('adds the friends-booking email clause when an email is present', () => {
    const clauses = buildMyBookingsAccessOr({
      _id: 'user-1',
      email: 'ada@example.com',
    });
    expect(clauses).toHaveLength(3);
    expect(clauses[2]).toEqual({
      $and: [
        { isFriendsBooking: { $eq: true } },
        { friendEmails: { $exists: true } },
        { friendEmails: { $ne: [] } },
        { friendEmails: { $in: ['ada@example.com'] } },
      ],
    });
  });
});
