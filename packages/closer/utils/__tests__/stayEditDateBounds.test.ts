import { getStayEditDateBounds } from '../booking.helpers';

/*
 * A five night stay at TDF: check-in 16:00, checkout 11:00 Lisbon time,
 * stored as UTC instants (15:00Z / 10:00Z in summer).
 */
const start = '2026-09-13T15:00:00.000Z';
const end = '2026-09-18T10:00:00.000Z';

describe('getStayEditDateBounds', () => {
  it('bounds the pickers to the day after checkout / the day before it', () => {
    expect(getStayEditDateBounds('Europe/Lisbon', start, end)).toEqual({
      minExtendDate: '2026-09-19',
      minShortenDate: '2026-09-14',
      maxShortenDate: '2026-09-17',
    });
  });

  it('reads the calendar day in the property timezone, not UTC', () => {
    // 23:30 UTC on the 17th is already the 18th in Lisbon (UTC+1) …
    const lateCheckout = '2026-09-17T23:30:00.000Z';
    expect(
      getStayEditDateBounds('Europe/Lisbon', start, lateCheckout).minExtendDate,
    ).toBe('2026-09-19');
    // … and still the 17th for a property west of UTC.
    expect(
      getStayEditDateBounds('America/New_York', start, lateCheckout)
        .minExtendDate,
    ).toBe('2026-09-18');
  });

  it('leaves a one night stay with nothing to shorten to', () => {
    const bounds = getStayEditDateBounds(
      'Europe/Lisbon',
      '2026-09-13T15:00:00.000Z',
      '2026-09-14T10:00:00.000Z',
    );
    expect(bounds.minShortenDate > bounds.maxShortenDate).toBe(true);
  });

  it('accepts Date instances and falls back to the raw value without a timezone', () => {
    expect(
      getStayEditDateBounds(undefined, new Date(start), new Date(end))
        .minExtendDate,
    ).toMatch(/^2026-09-1[89]$/);
  });
});
