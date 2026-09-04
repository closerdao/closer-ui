import {
  CANCELLED_TICKET_GRACE_MS,
  isStaleCancelledTicket,
} from './tickets.helpers';

const NOW = new Date('2026-06-01T12:00:00.000Z');
const hoursAgo = (hours: number) =>
  new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString();

describe('isStaleCancelledTicket', () => {
  it('hides a ticket cancelled more than three hours ago', () => {
    expect(
      isStaleCancelledTicket(
        { status: 'cancelled', cancellation: { at: hoursAgo(4) } },
        NOW,
      ),
    ).toBe(true);
  });

  it('keeps a ticket cancelled within the last three hours', () => {
    expect(
      isStaleCancelledTicket(
        { status: 'cancelled', cancellation: { at: hoursAgo(2) } },
        NOW,
      ),
    ).toBe(false);
  });

  it('treats exactly three hours as still fresh', () => {
    const at = new Date(NOW.getTime() - CANCELLED_TICKET_GRACE_MS).toISOString();
    expect(
      isStaleCancelledTicket({ status: 'cancelled', cancellation: { at } }, NOW),
    ).toBe(false);
  });

  it('falls back to updated, then created, when the cancel route left no stamp', () => {
    expect(
      isStaleCancelledTicket(
        { status: 'cancelled', updated: hoursAgo(5), created: hoursAgo(40) },
        NOW,
      ),
    ).toBe(true);
    expect(
      isStaleCancelledTicket(
        { status: 'cancelled', updated: hoursAgo(1), created: hoursAgo(40) },
        NOW,
      ),
    ).toBe(false);
    expect(
      isStaleCancelledTicket({ status: 'cancelled', created: hoursAgo(40) }, NOW),
    ).toBe(true);
  });

  it('never hides a ticket that is not cancelled', () => {
    expect(
      isStaleCancelledTicket(
        { status: 'approved', updated: hoursAgo(400), created: hoursAgo(400) },
        NOW,
      ),
    ).toBe(false);
    expect(
      isStaleCancelledTicket(
        { status: 'refunded', cancellation: { at: hoursAgo(400) } },
        NOW,
      ),
    ).toBe(false);
  });

  it('keeps a cancelled ticket with no usable timestamp', () => {
    expect(isStaleCancelledTicket({ status: 'cancelled' }, NOW)).toBe(false);
    expect(
      isStaleCancelledTicket(
        { status: 'cancelled', cancellation: { at: 'not a date' } },
        NOW,
      ),
    ).toBe(false);
  });
});
