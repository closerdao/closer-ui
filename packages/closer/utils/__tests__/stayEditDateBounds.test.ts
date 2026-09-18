import {
  getPropertyCalendarDay,
  getPropertyLocalDateTime,
  getStayDateEditPlan,
  getStayEditDateBounds,
} from '../booking.helpers';

const start = '2026-09-13T15:00:00.000Z';
const end = '2026-09-18T10:00:00.000Z';

describe('getPropertyLocalDateTime', () => {
  it('returns the wall-clock time in the property timezone', () => {
    expect(getPropertyLocalDateTime('Europe/Lisbon', end)).toBe(
      '2026-09-18 11:00',
    );
    expect(getPropertyLocalDateTime('Asia/Tokyo', end)).toBe(
      '2026-09-18 19:00',
    );
  });

  it('falls back to the raw value without a timezone', () => {
    const date = new Date(end);
    expect(getPropertyLocalDateTime(undefined, end)).toBe(end);
    expect(getPropertyLocalDateTime(undefined, date)).toBe(date);
  });

  it('returns null for a missing date', () => {
    expect(getPropertyLocalDateTime('Europe/Lisbon', undefined)).toBeNull();
    expect(getPropertyLocalDateTime(undefined, null)).toBeNull();
  });
});

describe('getPropertyCalendarDay', () => {
  it('reads the calendar day in the property timezone, not UTC', () => {
    const lateCheckout = '2026-09-17T23:30:00.000Z';
    expect(getPropertyCalendarDay('Europe/Lisbon', lateCheckout)).toBe(
      '2026-09-18',
    );
    expect(getPropertyCalendarDay('America/New_York', lateCheckout)).toBe(
      '2026-09-17',
    );
  });

  it('accepts Date instances', () => {
    expect(getPropertyCalendarDay('Asia/Tokyo', new Date(start))).toBe(
      '2026-09-14',
    );
  });

  it('returns an empty string for a missing date', () => {
    expect(getPropertyCalendarDay('Europe/Lisbon', null)).toBe('');
  });
});

describe('getStayEditDateBounds', () => {
  it('bounds the pickers to the day after checkout / the day before it', () => {
    expect(getStayEditDateBounds('Europe/Lisbon', start, end)).toEqual({
      minExtendDate: '2026-09-19',
      minShortenDate: '2026-09-14',
      maxShortenDate: '2026-09-17',
      canShorten: true,
    });
  });

  it('reads the calendar day in the property timezone, not UTC', () => {
    const lateCheckout = '2026-09-17T23:30:00.000Z';
    expect(
      getStayEditDateBounds('Europe/Lisbon', start, lateCheckout).minExtendDate,
    ).toBe('2026-09-19');
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
    expect(bounds.canShorten).toBe(false);
  });

  it('yields empty bounds rather than "Invalid Date" for a missing date', () => {
    const noBounds = {
      minExtendDate: '',
      minShortenDate: '',
      maxShortenDate: '',
      canShorten: false,
    };
    expect(getStayEditDateBounds('Europe/Lisbon', start, null)).toEqual(
      noBounds,
    );
    expect(getStayEditDateBounds('Europe/Lisbon', null, end)).toEqual(noBounds);
    expect(getStayEditDateBounds('Europe/Lisbon', start, undefined)).toEqual(
      noBounds,
    );
  });

  it('accepts Date instances', () => {
    expect(
      getStayEditDateBounds('Europe/Lisbon', new Date(start), new Date(end)),
    ).toEqual({
      minExtendDate: '2026-09-19',
      minShortenDate: '2026-09-14',
      maxShortenDate: '2026-09-17',
      canShorten: true,
    });
  });

  it('uses the local calendar day of the raw value without a timezone', () => {
    expect(
      getStayEditDateBounds(
        undefined,
        new Date(2026, 8, 13, 16),
        new Date(2026, 8, 18, 11),
      ),
    ).toEqual({
      minExtendDate: '2026-09-19',
      minShortenDate: '2026-09-14',
      maxShortenDate: '2026-09-17',
      canShorten: true,
    });
  });
});

describe('getStayDateEditPlan', () => {
  it('sees no edit when the pending days match the stored instants', () => {
    expect(
      getStayDateEditPlan({
        timeZone: 'Europe/Lisbon',
        start,
        end,
        pendingStartDay: '2026-09-13',
        pendingEndDay: '2026-09-18',
      }),
    ).toEqual({ hasArrivalChange: false, endChange: 'none' });
  });

  it('compares in the property timezone for a guest browsing from abroad', () => {
    const lateCheckout = '2026-09-17T23:30:00.000Z';
    expect(
      getStayDateEditPlan({
        timeZone: 'Europe/Lisbon',
        start,
        end: lateCheckout,
        pendingStartDay: '2026-09-13',
        pendingEndDay: '2026-09-18',
      }),
    ).toEqual({ hasArrivalChange: false, endChange: 'none' });
    expect(
      getStayDateEditPlan({
        timeZone: 'America/New_York',
        start,
        end: lateCheckout,
        pendingStartDay: '2026-09-13',
        pendingEndDay: '2026-09-18',
      }),
    ).toEqual({ hasArrivalChange: false, endChange: 'extend' });
  });

  it('classifies a later checkout as an extension and an earlier one as a shortening', () => {
    expect(
      getStayDateEditPlan({
        timeZone: 'Europe/Lisbon',
        start,
        end,
        pendingStartDay: '2026-09-13',
        pendingEndDay: '2026-09-20',
      }).endChange,
    ).toBe('extend');
    expect(
      getStayDateEditPlan({
        timeZone: 'Europe/Lisbon',
        start,
        end,
        pendingStartDay: '2026-09-13',
        pendingEndDay: '2026-09-16',
      }).endChange,
    ).toBe('shorten');
  });

  it('flags an arrival change', () => {
    expect(
      getStayDateEditPlan({
        timeZone: 'Europe/Lisbon',
        start,
        end,
        pendingStartDay: '2026-09-14',
        pendingEndDay: '2026-09-18',
      }).hasArrivalChange,
    ).toBe(true);
  });

  it('reports no change when a day is missing', () => {
    expect(
      getStayDateEditPlan({
        timeZone: 'Europe/Lisbon',
        start,
        end,
        pendingStartDay: '',
        pendingEndDay: '',
      }),
    ).toEqual({
      hasArrivalChange: false,
      endChange: 'none',
    });
    expect(
      getStayDateEditPlan({
        timeZone: 'Europe/Lisbon',
        start: null,
        end: null,
        pendingStartDay: '2026-09-13',
        pendingEndDay: '2026-09-18',
      }),
    ).toEqual({ hasArrivalChange: false, endChange: 'none' });
  });
});
