import type { Stay } from '../../types/stay';
import {
  STAY_CREATE_BACK_PARAMS,
  buildStayCreateHrefFromStay,
} from '../stayRouting.helpers';

const baseStay = {
  _id: 'stay-1',
  start: '2026-10-13T00:00:00.000Z',
  end: '2026-10-14T00:00:00.000Z',
  adults: 2,
  children: 0,
  infants: 0,
  pets: 0,
  listing: 'listing-1',
} as unknown as Stay;

const queryOf = (href: string) =>
  Object.fromEntries(new URL(href, 'https://x.test').searchParams);

const backQuery = (overrides: Partial<Stay> = {}) =>
  queryOf(buildStayCreateHrefFromStay({ ...baseStay, ...overrides }));

describe('buildStayCreateHrefFromStay', () => {
  it('carries only dates and guests for a plain stay', () => {
    expect(backQuery()).toEqual({
      start: '2026-10-13',
      end: '2026-10-14',
      adults: '2',
    });
  });

  describe('friends bookings', () => {
    // Back from checkout used to drop these, so the next pick created a stay
    // owned by the booker instead of a friends booking.
    it('keeps a friends booking a friends booking', () => {
      expect(
        backQuery({
          isFriendsBooking: true,
          friendEmails: 'ada@example.com,bob@example.com',
        }),
      ).toMatchObject({
        isFriendsBooking: 'true',
        friendEmails: 'ada@example.com,bob@example.com',
      });
    });

    it('accepts the array of emails the API returns', () => {
      expect(
        backQuery({
          isFriendsBooking: true,
          friendEmails: ['ada@example.com', 'bob@example.com'],
        }).friendEmails,
      ).toBe('ada@example.com,bob@example.com');
    });

    it('keeps the flag even when the stay has no emails', () => {
      const query = backQuery({ isFriendsBooking: true });
      expect(query.isFriendsBooking).toBe('true');
      expect(query).not.toHaveProperty('friendEmails');
    });
  });

  it('keeps a team booking a team booking', () => {
    expect(backQuery({ isTeamBooking: true }).isTeamBooking).toBe('true');
  });

  describe('event stays', () => {
    it('keeps the ticket and discount code', () => {
      expect(
        backQuery({
          eventId: 'event-1',
          ticketOption: { name: '3-day Ticket' },
          eventDiscount: { code: 'early' },
        }),
      ).toMatchObject({
        eventId: 'event-1',
        ticketOption: '3-day Ticket',
        discountCode: 'EARLY',
      });
    });

    it('reads a discount stored as a bare code', () => {
      expect(
        backQuery({ eventId: 'event-1', eventDiscount: 'early' }).discountCode,
      ).toBe('EARLY');
    });

    it('keeps a ticket-only stay out of the accommodation search', () => {
      expect(backQuery({ eventId: 'event-1', listing: null }).ticketOnly).toBe(
        'true',
      );
    });

    it('sends a stay with a space back to the accommodation search', () => {
      expect(backQuery({ eventId: 'event-1' })).not.toHaveProperty(
        'ticketOnly',
      );
    });

    it('ignores ticket and discount on a stay without an event', () => {
      const query = backQuery({
        ticketOption: { name: '3-day Ticket' },
        eventDiscount: 'early',
      });
      expect(query).not.toHaveProperty('ticketOption');
      expect(query).not.toHaveProperty('discountCode');
    });
  });

  it('keeps the residence project', () => {
    expect(
      backQuery({
        volunteerInfo: { bookingType: 'residence', projectId: ['p1', 'p2'] },
      } as Partial<Stay>),
    ).toMatchObject({ bookingType: 'residence', projectId: 'p1,p2' });
  });
});

// /stay/create reads its query through StayCreateQueryKey, and
// STAY_CREATE_BACK_PARAMS must say for every key whether Back carries it. This
// checks the answers are true, so a mode cannot claim to survive Back while
// the href silently drops it.
describe('STAY_CREATE_BACK_PARAMS', () => {
  const everyModeStays = [
    {
      ...baseStay,
      children: 1,
      infants: 1,
      pets: 1,
      eventId: 'event-1',
      ticketOption: { name: '3-day Ticket' },
      eventDiscount: { code: 'early' },
      listing: null,
      isTeamBooking: true,
      isFriendsBooking: true,
      friendEmails: ['ada@example.com'],
    },
    {
      ...baseStay,
      volunteerInfo: { bookingType: 'residence', projectId: ['p1'] },
    },
  ] as unknown as Stay[];

  const emitted = new Set(
    everyModeStays.flatMap((stay) =>
      Object.keys(queryOf(buildStayCreateHrefFromStay(stay))),
    ),
  );

  it.each(Object.entries(STAY_CREATE_BACK_PARAMS))(
    '%s matches its Back decision',
    (key, decision) => {
      expect(emitted.has(key)).toBe(decision.carried);
    },
  );

  it('gives a reason for every param Back drops', () => {
    Object.values(STAY_CREATE_BACK_PARAMS).forEach((decision) => {
      if (!decision.carried) expect(decision.reason).toBeTruthy();
    });
  });
});
