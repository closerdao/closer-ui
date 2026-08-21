import { Listing } from '../../types';
import {
  doesBookingCoverEvent,
  getAccommodationPriceRange,
  getEventNights,
} from '../events.helpers';

const listing = (name: string, val: number, availableFor?: string[]) =>
  ({
    name,
    fiatPrice: { val, cur: 'EUR' },
    ...(availableFor ? { availableFor } : {}),
  } as unknown as Listing);

// Mirrors the live TDF booking config, which stores its numbers as strings and
// carries a high season modifier of "0".
const settings = {
  discountsDaily: 0,
  discountsWeekly: '0.30',
  discountsMonthly: '0.50',
  seasonsHighStart: 'April',
  seasonsHighEnd: 'October',
  seasonsHighModifier: '0',
};

const listings = [
  listing('Camping', 15, ['guests', 'events']),
  listing('Tree House', 90, ['guests', 'events']),
  listing('Volunteer dorm', 5, ['volunteer']),
];

describe('getEventNights', () => {
  it('counts the nights between the arrival and departure days', () => {
    // Thursday 14:00 to Sunday 13:00 is three nights, even though the raw
    // timestamps are less than three full days apart.
    expect(
      getEventNights('2026-09-24T14:00:00.000Z', '2026-09-27T13:00:00.000Z'),
    ).toBe(3);
  });

  it('counts one night for an event that ends the next morning', () => {
    expect(
      getEventNights('2026-09-24T18:00:00.000Z', '2026-09-25T11:00:00.000Z'),
    ).toBe(1);
  });

  it('counts no nights for a same day event', () => {
    expect(
      getEventNights('2026-09-24T10:00:00.000Z', '2026-09-24T18:00:00.000Z'),
    ).toBe(0);
  });

  it('handles missing dates', () => {
    expect(getEventNights(null, '2026-09-27')).toBe(0);
    expect(getEventNights('2026-09-24', undefined)).toBe(0);
  });
});

describe('getAccommodationPriceRange', () => {
  it('ignores a high season modifier of zero instead of pricing the stay at nothing', () => {
    const { min, max, currency } = getAccommodationPriceRange(
      settings,
      listings,
      3,
      '2026-09-24T14:00:00.000Z',
    );

    expect(min).toBe(45);
    expect(max).toBe(270);
    expect(currency).toBe('EUR');
  });

  it('applies a usable high season modifier to both ends of the range', () => {
    const { min, max } = getAccommodationPriceRange(
      { ...settings, seasonsHighModifier: 1.5 },
      listings,
      2,
      '2026-09-24T14:00:00.000Z',
    );

    expect(min).toBe(45);
    expect(max).toBe(270);
  });

  it('discounts both ends of the range by the same duration discount', () => {
    const { min, max } = getAccommodationPriceRange(
      settings,
      listings,
      7,
      '2026-01-10T14:00:00.000Z',
    );

    expect(min).toBeCloseTo(15 * 7 * 0.7);
    expect(max).toBeCloseTo(90 * 7 * 0.7);
  });

  it('skips listings that are not open to event guests', () => {
    const { min } = getAccommodationPriceRange(
      settings,
      listings,
      1,
      '2026-01-10T14:00:00.000Z',
    );

    expect(min).toBe(15);
  });

  it('returns a zero range when there is nothing to price', () => {
    expect(
      getAccommodationPriceRange(settings, undefined, 3, '2026-09-24'),
    ).toEqual({ min: 0, max: 0, currency: 'EUR' });
  });
});

describe('doesBookingCoverEvent', () => {
  const eventStart = '2026-09-24T14:00:00.000Z';
  const eventEnd = '2026-09-27T13:00:00.000Z';
  const booking = {
    _id: 'b1',
    start: '2026-09-24T14:00:00.000Z',
    end: '2026-09-27T11:00:00.000Z',
    status: 'paid',
    listing: 'listing-1',
  };

  it('covers an event it spans exactly', () => {
    expect(doesBookingCoverEvent(booking, eventStart, eventEnd)).toBe(true);
  });

  it('covers an event it wraps around', () => {
    expect(
      doesBookingCoverEvent(
        { ...booking, start: '2026-09-20', end: '2026-10-01' },
        eventStart,
        eventEnd,
      ),
    ).toBe(true);
  });

  it('does not cover an event it only partly overlaps', () => {
    expect(
      doesBookingCoverEvent(
        { ...booking, end: '2026-09-26T11:00:00.000Z' },
        eventStart,
        eventEnd,
      ),
    ).toBe(false);
    expect(
      doesBookingCoverEvent(
        { ...booking, start: '2026-09-25T14:00:00.000Z' },
        eventStart,
        eventEnd,
      ),
    ).toBe(false);
  });

  it('ignores bookings that reserve no space', () => {
    expect(
      doesBookingCoverEvent(
        { ...booking, isDayTicket: true },
        eventStart,
        eventEnd,
      ),
    ).toBe(false);
    expect(
      doesBookingCoverEvent(
        { ...booking, listing: null },
        eventStart,
        eventEnd,
      ),
    ).toBe(false);
  });

  it('ignores bookings the guest no longer holds', () => {
    expect(
      doesBookingCoverEvent(
        { ...booking, status: 'cancelled' },
        eventStart,
        eventEnd,
      ),
    ).toBe(false);
  });

  it('handles missing input', () => {
    expect(doesBookingCoverEvent(null, eventStart, eventEnd)).toBe(false);
    expect(doesBookingCoverEvent(booking, null, eventEnd)).toBe(false);
  });
});
