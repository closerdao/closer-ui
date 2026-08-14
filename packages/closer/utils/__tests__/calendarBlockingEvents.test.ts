import {
  CalendarBlockingEvent,
  getCalendarBlockingEventsInRange,
} from '../events.helpers';

const buildEvent = (
  overrides: Partial<CalendarBlockingEvent> = {},
): CalendarBlockingEvent => ({
  _id: 'event-1',
  name: 'Regeneration Week',
  slug: 'regeneration-week',
  start: '2026-09-10',
  end: '2026-09-14',
  paid: true,
  blocksBookingCalendar: true,
  ...overrides,
});

describe('getCalendarBlockingEventsInRange', () => {
  it('returns events that fully cover the stay', () => {
    const event = buildEvent();
    expect(
      getCalendarBlockingEventsInRange([event], '2026-09-11', '2026-09-13'),
    ).toEqual([event]);
  });

  it('returns events that partially overlap the stay', () => {
    const event = buildEvent();
    expect(
      getCalendarBlockingEventsInRange([event], '2026-09-08', '2026-09-11'),
    ).toHaveLength(1);
    expect(
      getCalendarBlockingEventsInRange([event], '2026-09-13', '2026-09-18'),
    ).toHaveLength(1);
  });

  it('treats the event end day as blocked for check-in', () => {
    expect(
      getCalendarBlockingEventsInRange(
        [buildEvent()],
        '2026-09-14',
        '2026-09-16',
      ),
    ).toHaveLength(1);
  });

  it('allows a stay that checks out on the event start day', () => {
    expect(
      getCalendarBlockingEventsInRange(
        [buildEvent()],
        '2026-09-06',
        '2026-09-10',
      ),
    ).toEqual([]);
  });

  it('ignores stays entirely outside the event', () => {
    expect(
      getCalendarBlockingEventsInRange(
        [buildEvent()],
        '2026-09-15',
        '2026-09-20',
      ),
    ).toEqual([]);
    expect(
      getCalendarBlockingEventsInRange(
        [buildEvent()],
        '2026-08-01',
        '2026-08-05',
      ),
    ).toEqual([]);
  });

  it('ignores events that do not block the booking calendar', () => {
    expect(
      getCalendarBlockingEventsInRange(
        [buildEvent({ blocksBookingCalendar: false })],
        '2026-09-11',
        '2026-09-13',
      ),
    ).toEqual([]);
  });

  it('handles missing input without throwing', () => {
    expect(
      getCalendarBlockingEventsInRange(null, '2026-09-11', '2026-09-13'),
    ).toEqual([]);
    expect(
      getCalendarBlockingEventsInRange([buildEvent()], null, null),
    ).toEqual([]);
    expect(
      getCalendarBlockingEventsInRange(
        [buildEvent({ start: '', end: '' })],
        '2026-09-11',
        '2026-09-13',
      ),
    ).toEqual([]);
  });

  it('returns every overlapping event', () => {
    const events = [
      buildEvent(),
      buildEvent({
        _id: 'event-2',
        name: 'Builders Gathering',
        start: '2026-09-13',
        end: '2026-09-20',
      }),
      buildEvent({
        _id: 'event-3',
        name: 'Winter Retreat',
        start: '2026-12-01',
        end: '2026-12-08',
      }),
    ];
    expect(
      getCalendarBlockingEventsInRange(events, '2026-09-12', '2026-09-15').map(
        (event) => event._id,
      ),
    ).toEqual(['event-1', 'event-2']);
  });
});
