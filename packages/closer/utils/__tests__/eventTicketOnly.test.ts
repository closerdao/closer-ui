import { eventNeedsAccommodation, isFreeEvent } from '../events.helpers';

/**
 * Which events are sold as a ticket alone, and which of those cost nothing.
 * Getting either wrong sends a guest into the booking flow for a night that
 * does not exist, or charges them for a ticket the event gives away.
 */
describe('eventNeedsAccommodation', () => {
  it('is false for an event that starts and ends on the same day', () => {
    expect(
      eventNeedsAccommodation({
        start: '2026-09-24T09:00:00.000Z',
        end: '2026-09-24T18:00:00.000Z',
      }),
    ).toBe(false);
  });

  it('is false for a virtual event however many days it runs', () => {
    expect(
      eventNeedsAccommodation({
        start: '2026-09-24T10:00:00.000Z',
        end: '2026-09-27T18:00:00.000Z',
        virtual: true,
      }),
    ).toBe(false);
  });

  it('is true for an event on site that spans a night', () => {
    expect(
      eventNeedsAccommodation({
        start: '2026-09-24T14:00:00.000Z',
        end: '2026-09-25T11:00:00.000Z',
      }),
    ).toBe(true);
  });

  it('is false for an event with no dates to read', () => {
    expect(eventNeedsAccommodation(null)).toBe(false);
    expect(eventNeedsAccommodation({})).toBe(false);
  });
});

describe('isFreeEvent', () => {
  it('is free when the event was never marked paid', () => {
    expect(isFreeEvent({ paid: false })).toBe(true);
  });

  it('is free when every ticket it sells is priced at nothing', () => {
    expect(
      isFreeEvent({ paid: true, ticketOptions: [{ price: 0 }, { price: 0 }] }),
    ).toBe(true);
  });

  it('is not free when any ticket carries a price', () => {
    expect(
      isFreeEvent({ paid: true, ticketOptions: [{ price: 0 }, { price: 45 }] }),
    ).toBe(false);
  });

  // A paid event nobody finished configuring has no price to charge, so it
  // reads as free rather than as a purchase that can never complete.
  it('is free when a paid event carries no ticket options at all', () => {
    expect(isFreeEvent({ paid: true, ticketOptions: [] })).toBe(true);
  });

  it('prefers the options it is handed over the ones on the event', () => {
    expect(
      isFreeEvent({ paid: true, ticketOptions: [{ price: 45 }] }, [
        { price: 0 },
      ]),
    ).toBe(true);
  });
});
