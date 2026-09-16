import { List, fromJS } from 'immutable';

import { StayStatus } from '../../types/stay';
import { getBookedNights, getBookedSpaceSlots } from '../dashboard.helpers';

const TIME_ZONE = 'Europe/Lisbon';

const start = new Date('2026-03-01T00:00:00.000Z');
const end = new Date('2026-03-31T23:59:59.000Z');

const nightlyListing = fromJS({
  _id: 'listing-1',
  name: 'Shared dorm',
  private: false,
  quantity: 1,
  beds: 4,
});

const spaceListing = fromJS({
  _id: 'listing-2',
  name: 'Co-working',
  priceDuration: 'hour',
  quantity: 1,
  workingHoursStart: 9,
  workingHoursEnd: 17,
});

const nightlyBooking = (status: StayStatus) =>
  fromJS({
    _id: `booking-${status}`,
    status,
    listing: 'listing-1',
    start: '2026-03-10T00:00:00.000Z',
    end: '2026-03-13T00:00:00.000Z',
    roomOrBedNumbers: [1],
  });

const spaceBooking = (status: StayStatus) =>
  fromJS({
    _id: `space-${status}`,
    status,
    listing: 'listing-2',
    start: '2026-03-10T09:00:00.000Z',
    end: '2026-03-10T13:00:00.000Z',
    roomOrBedNumbers: [1],
  });

const countNights = (status: StayStatus) =>
  getBookedNights({
    nightlyBookings: List([nightlyBooking(status)]),
    nightlyListings: List([nightlyListing]),
    start,
    end,
    duration: 31,
    TIME_ZONE,
  }).numBookedNights;

const countSpaceSlots = (status: StayStatus) =>
  getBookedSpaceSlots(List([spaceBooking(status)]), List([spaceListing]), 31)
    .numBookedSpaceSlots;

describe('getBookedNights', () => {
  it('counts a paid stay inside the window', () => {
    expect(countNights('paid')).toBeGreaterThan(0);
  });

  it('counts a stay awaiting a payment delta like a paid one', () => {
    expect(countNights('pending-payment')).toBe(countNights('paid'));
  });

  it('counts a stay awaiting a refund like a paid one', () => {
    expect(countNights('pending-refund')).toBe(countNights('paid'));
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
