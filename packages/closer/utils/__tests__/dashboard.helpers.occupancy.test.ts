import { List, Map, fromJS } from 'immutable';

import { StayStatus } from '../../types/stay';
import { getBookedNights, getBookedSpaceSlots } from '../dashboard.helpers';

// `fromJS` infers a Map typed by the literal keys/values of the object it was
// given, which Immutable's invariant Map generic won't widen to the
// `Map<string, any>` the helpers under test accept. Cast at the boundary
// rather than loosening the helpers' real signature.
const asRecordMap = (value: unknown) => value as Map<string, any>;

const start = new Date('2026-03-01T00:00:00.000Z');
const end = new Date('2026-03-31T23:59:59.000Z');

const nightlyListing = asRecordMap(
  fromJS({
    _id: 'listing-1',
    name: 'Shared dorm',
    private: false,
    quantity: 1,
    beds: 4,
  }),
);

const spaceListing = asRecordMap(
  fromJS({
    _id: 'listing-2',
    name: 'Co-working',
    priceDuration: 'hour',
    quantity: 1,
    workingHoursStart: 9,
    workingHoursEnd: 17,
  }),
);

const nightlyBooking = (
  status: StayStatus,
  bookingStart = '2026-03-10T00:00:00.000Z',
  bookingEnd = '2026-03-13T00:00:00.000Z',
) =>
  asRecordMap(
    fromJS({
      _id: `booking-${status}`,
      status,
      listing: 'listing-1',
      start: bookingStart,
      end: bookingEnd,
      roomOrBedNumbers: [1],
    }),
  );

const spaceBooking = (status: StayStatus) =>
  asRecordMap(
    fromJS({
      _id: `space-${status}`,
      status,
      listing: 'listing-2',
      start: '2026-03-10T09:00:00.000Z',
      end: '2026-03-10T13:00:00.000Z',
      roomOrBedNumbers: [1],
    }),
  );

const countNights = (
  status: StayStatus,
  bookingStart?: string,
  bookingEnd?: string,
) =>
  getBookedNights({
    nightlyBookings: List([nightlyBooking(status, bookingStart, bookingEnd)]),
    nightlyListings: List([nightlyListing]),
    start,
    end,
    duration: 31,
    TIME_ZONE: 'UTC',
  }).numBookedNights;

const countSpaceSlots = (status: StayStatus) =>
  getBookedSpaceSlots(List([spaceBooking(status)]), List([spaceListing]), 31)
    .numBookedSpaceSlots;

describe('getBookedNights', () => {
  it('counts a paid stay that checks out inside the window', () => {
    expect(countNights('paid')).toBe(2);
  });

  it('counts a stay awaiting a payment delta', () => {
    expect(countNights('pending-payment')).toBe(2);
  });

  it('counts a stay awaiting a refund', () => {
    expect(countNights('pending-refund')).toBe(2);
  });

  it('counts a settling stay that runs past the end of the window', () => {
    expect(
      countNights(
        'pending-refund',
        '2026-03-29T00:00:00.000Z',
        '2026-04-03T00:00:00.000Z',
      ),
    ).toBe(3);
  });

  it('ignores a cancelled stay', () => {
    expect(countNights('cancelled')).toBe(0);
  });

  it('ignores a stay that was never paid for', () => {
    expect(countNights('pending')).toBe(0);
    expect(countNights('confirmed')).toBe(0);
  });
});

describe('getBookedSpaceSlots', () => {
  it('counts a paid space booking', () => {
    expect(countSpaceSlots('paid')).toBe(4);
  });

  it('counts space bookings that are settling a price change', () => {
    expect(countSpaceSlots('pending-payment')).toBe(4);
    expect(countSpaceSlots('pending-refund')).toBe(4);
  });

  it('ignores space bookings that do not occupy the slot', () => {
    expect(countSpaceSlots('cancelled')).toBe(0);
    expect(countSpaceSlots('pending')).toBe(0);
  });

  it('agrees with getBookedNights on which statuses occupy', () => {
    const statuses: StayStatus[] = [
      'paid',
      'tokens-staked',
      'credits-paid',
      'checked-in',
      'checked-out',
      'pending-payment',
      'pending-refund',
      'pending',
      'confirmed',
      'cancelled',
      'rejected',
      'open',
      'draft',
    ];

    statuses.forEach((status) => {
      expect(countSpaceSlots(status) > 0).toBe(countNights(status) > 0);
    });
  });
});
