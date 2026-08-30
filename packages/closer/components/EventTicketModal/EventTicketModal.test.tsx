import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import EventTicketModal from './EventTicketModal';

jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
  cdn: '',
  formatSearch: (where: unknown) => JSON.stringify(where),
}));

// Stripe only matters once a card is in play; the free and hand-off paths
// never touch it, and the card path is driven through this mock.
const confirmCardPayment = jest.fn();

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useStripe: () => ({ confirmCardPayment }),
  useElements: () => ({ getElement: () => ({}) }),
  CardElement: ({ onChange }: { onChange: (e: any) => void }) => (
    <button
      type="button"
      data-testid="card-element"
      onClick={() => onChange({ empty: false, error: null })}
    >
      card
    </button>
  ),
}));

const api = jest.requireMock('../../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};

const routerPush = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    pathname: '/events/confluencia',
    asPath: '/events/confluencia',
    isReady: true,
    replace: jest.fn(),
    push: routerPush,
    prefetch: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  }),
}));

let mockUser: any = null;

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ isAuthenticated: !!mockUser, user: mockUser }),
}));

const event = {
  _id: 'event-1',
  name: 'Confluência',
  slug: 'confluencia',
  paid: true,
  start: '2026-09-24T14:00:00.000Z',
  end: '2026-09-27T13:00:00.000Z',
  ticketOptions: [],
} as any;

const ticketOptions = [
  {
    name: '3-day Ticket (At Cost)',
    price: 60,
    currency: 'EUR',
    limit: 52,
    available: 52,
  },
  {
    name: 'Day Ticket - Saturday',
    price: 45,
    currency: 'EUR',
    limit: 40,
    available: 40,
    isDayTicket: true,
  },
];

const coveringBooking = {
  _id: 'booking-1',
  start: '2026-09-23T14:00:00.000Z',
  end: '2026-09-28T11:00:00.000Z',
  status: 'paid',
  listing: 'listing-1',
};

const quoteFor = (unit: number, quantity = 1) => ({
  eventId: 'event-1',
  quantity,
  currency: 'EUR',
  listUnitPrice: { val: unit, cur: 'EUR' },
  unitPrice: { val: unit, cur: 'EUR' },
  total: { val: unit * quantity, cur: 'EUR' },
  discountApplied: false,
  discountRejected: false,
});

const pendingTicket = {
  _id: 'ticket-7',
  status: 'pending-payment',
  paymentMethod: 'card',
  event: 'event-1',
  quantity: 2,
  option: { name: 'Day Ticket - Saturday' },
  discount: { code: 'EARLYBIRD' },
  unitPrice: { val: 45, cur: 'EUR' },
  price: { val: 90, cur: 'EUR' },
};

const mockApi = ({
  bookings = [] as unknown[],
  quote = quoteFor(60),
  ticket = pendingTicket as any,
  init = {
    ticketId: 'ticket-9',
    status: 'pending-payment',
    paymentMethod: 'card',
    total: { val: 60, cur: 'EUR' },
    clientSecret: 'secret',
    paymentIntentId: 'pi_1',
  },
} = {}) => {
  api.get.mockImplementation((url: string) => {
    if (url.includes('/tickets/event/')) {
      return Promise.resolve({ data: { results: { ticketOptions } } });
    }
    if (url === '/booking') {
      return Promise.resolve({ data: { results: bookings } });
    }
    if (url.startsWith('/tickets/')) {
      return Promise.resolve({
        data: {
          results: { ticket, event: { _id: 'event-1' }, refundQuote: null },
        },
      });
    }
    return Promise.resolve({ data: { results: [] } });
  });
  api.post.mockImplementation((url: string) => {
    if (url === '/tickets/quote') {
      return Promise.resolve({ data: { results: quote } });
    }
    if (url === '/tickets/init') {
      return Promise.resolve({ data: { results: init } });
    }
    if (url.includes('/confirm-card')) {
      return Promise.resolve({
        data: { results: { status: 'success', ticketId: 'ticket-9' } },
      });
    }
    return Promise.resolve({ data: { results: {} } });
  });
};

const renderModal = (props: Record<string, unknown> = {}) =>
  renderWithNextIntl(
    <EventTicketModal event={event} closeModal={jest.fn()} {...props} />,
  );

const pickTicket = async (name: string) =>
  userEvent.click(await screen.findByText(name));

const clickButton = (name: RegExp) =>
  userEvent.click(screen.getByRole('button', { name }));

describe('EventTicketModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { _id: 'user-1', email: 'guest@example.com', roles: [] };
    confirmCardPayment.mockResolvedValue({
      paymentIntent: { id: 'pi_1', status: 'succeeded' },
    });
    mockApi();
  });

  it('lists day tickets alongside overnight tickets', async () => {
    renderModal();

    expect(
      await screen.findByText('Day Ticket - Saturday'),
    ).toBeInTheDocument();
    expect(screen.getByText('3-day Ticket (At Cost)')).toBeInTheDocument();
  });

  it('prices the selection on the server rather than in the client', async () => {
    renderModal();
    await pickTicket('3-day Ticket (At Cost)');

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/tickets/quote', {
        eventId: 'event-1',
        ticketOption: '3-day Ticket (At Cost)',
        quantity: 1,
      }),
    );
  });

  it('hands an overnight ticket to the booking flow with the ticket chosen', async () => {
    renderModal();
    await pickTicket('3-day Ticket (At Cost)');

    expect(
      screen.getByText(/pick where to sleep for the 3 nights/i),
    ).toBeInTheDocument();

    await clickButton(/choose accommodation/i);

    const url = routerPush.mock.calls[0][0] as string;
    expect(url).toContain('/stay/create');
    expect(url).toContain('eventId=event-1');
    expect(url).toContain('ticketOption=3-day+Ticket+%28At+Cost%29');
  });

  it('carries the tickets bought into the booking flow as the party size', async () => {
    renderModal();
    await pickTicket('3-day Ticket (At Cost)');

    await userEvent.selectOptions(screen.getByLabelText(/tickets/i), '3');
    await clickButton(/choose accommodation/i);

    const url = routerPush.mock.calls[0][0] as string;
    expect(url).toContain('adults=3');
  });

  it('books one bed when the guest never touches the quantity', async () => {
    renderModal();
    await pickTicket('3-day Ticket (At Cost)');
    await clickButton(/choose accommodation/i);

    expect(routerPush.mock.calls[0][0]).toContain('adults=1');
  });

  it('sells a day ticket without leaving the modal', async () => {
    mockApi({ quote: quoteFor(45) });
    renderModal();
    await pickTicket('Day Ticket - Saturday');

    expect(screen.getByText(/don't need accommodation/i)).toBeInTheDocument();

    await clickButton(/continue to payment/i);

    expect(routerPush).not.toHaveBeenCalled();
    expect(await screen.findByText(/pay for your ticket/i)).toBeInTheDocument();
  });

  it('sells a ticket alone when a booking already covers the event', async () => {
    mockApi({ bookings: [coveringBooking] });
    renderModal();
    await pickTicket('3-day Ticket (At Cost)');

    await waitFor(() =>
      expect(
        screen.getByText(/already covers accommodation/i),
      ).toBeInTheDocument(),
    );

    await clickButton(/continue to payment/i);

    expect(routerPush).not.toHaveBeenCalled();
    expect(await screen.findByText(/pay for your ticket/i)).toBeInTheDocument();
  });

  it('still asks for accommodation when the booking only partly overlaps', async () => {
    mockApi({
      bookings: [{ ...coveringBooking, end: '2026-09-26T11:00:00.000Z' }],
    });
    renderModal();
    await pickTicket('3-day Ticket (At Cost)');

    await waitFor(() =>
      expect(
        screen.getByText(/pick where to sleep for the 3 nights/i),
      ).toBeInTheDocument(),
    );

    await clickButton(/choose accommodation/i);
    expect(routerPush.mock.calls[0][0]).toContain('/stay/create');
  });

  it('pays by card and lands on the celebration', async () => {
    mockApi({ quote: quoteFor(45) });
    renderModal();
    await pickTicket('Day Ticket - Saturday');
    await clickButton(/continue to payment/i);

    await userEvent.click(await screen.findByTestId('card-element'));
    await clickButton(/pay now/i);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/tickets/init', {
        eventId: 'event-1',
        ticketOption: 'Day Ticket - Saturday',
        quantity: 1,
        paymentMethod: 'card',
        email: 'guest@example.com',
      }),
    );
    expect(confirmCardPayment).toHaveBeenCalledWith(
      'secret',
      expect.anything(),
    );
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/tickets/ticket-9/confirm-card', {
        paymentIntentId: 'pi_1',
      }),
    );
    // Twice: the confetti overlay and the modal underneath it.
    expect(await screen.findAllByText(/you're going to/i)).toHaveLength(2);
  });

  it('claims a free ticket without asking for a card', async () => {
    mockApi({
      quote: quoteFor(0),
      init: {
        ticketId: 'ticket-free',
        status: 'approved',
        paymentMethod: 'free',
        total: { val: 0, cur: 'EUR' },
      } as any,
    });
    renderModal();
    await pickTicket('Day Ticket - Saturday');
    // A quote of nothing makes the ticket free however it was priced, so the
    // checkout it continues to is a claim rather than a payment.
    await clickButton(/^continue$/i);

    await clickButton(/get my ticket/i);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/tickets/init', {
        eventId: 'event-1',
        ticketOption: 'Day Ticket - Saturday',
        quantity: 1,
        email: 'guest@example.com',
      }),
    );
    // Twice: the confetti overlay and the modal underneath it.
    expect(await screen.findAllByText(/you're going to/i)).toHaveLength(2);
  });

  describe('free and single-day events', () => {
    const freeInit = {
      ticketId: 'ticket-free',
      status: 'approved',
      paymentMethod: 'free',
      total: { val: 0, cur: 'EUR' },
    } as any;

    it('claims a free event in one click, with no option to name', async () => {
      mockApi({ quote: quoteFor(0), init: freeInit });
      api.get.mockImplementation((url: string) => {
        // A free event that never had ticket options of its own.
        if (url.includes('/tickets/event/')) {
          return Promise.resolve({ data: { results: { ticketOptions: [] } } });
        }
        return Promise.resolve({ data: { results: [] } });
      });
      renderModal({
        event: {
          ...event,
          paid: false,
          ticketOptions: [],
          start: '2026-09-24T10:00:00.000Z',
          end: '2026-09-24T18:00:00.000Z',
        },
      });

      // Straight onto the claim — there is nothing to choose and nothing to pay.
      await userEvent.click(
        await screen.findByRole('button', { name: /get my ticket/i }),
      );

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/tickets/init', {
          eventId: 'event-1',
          quantity: 1,
          email: 'guest@example.com',
        }),
      );
      expect(routerPush).not.toHaveBeenCalled();
    });

    it('never calls a ticket overnight on an event that spans no night', async () => {
      mockApi({ quote: quoteFor(60) });
      renderModal({
        event: {
          ...event,
          start: '2026-09-24T09:00:00.000Z',
          end: '2026-09-24T18:00:00.000Z',
        },
      });

      // The option carries no isDayTicket flag, but there is no night for it
      // to span either way.
      expect(
        await screen.findByText('3-day Ticket (At Cost)'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/overnight/i)).not.toBeInTheDocument();
    });

    it('still tells day and overnight apart when the event spans nights', async () => {
      mockApi();
      renderModal();

      expect(await screen.findByText(/overnight ticket/i)).toBeInTheDocument();
      expect(screen.getByText(/day ticket\./i)).toBeInTheDocument();
    });

    it('sells a one-day event as a ticket, never as a stay', async () => {
      mockApi({ quote: quoteFor(60) });
      renderModal({
        event: {
          ...event,
          start: '2026-09-24T10:00:00.000Z',
          end: '2026-09-24T18:00:00.000Z',
        },
      });
      await pickTicket('3-day Ticket (At Cost)');

      expect(
        screen.queryByText(/pick where to sleep/i),
      ).not.toBeInTheDocument();

      await clickButton(/continue to payment/i);

      expect(routerPush).not.toHaveBeenCalled();
      expect(
        await screen.findByText(/pay for your ticket/i),
      ).toBeInTheDocument();
    });
  });

  it('gives the held seat back when the guest backs out of payment', async () => {
    mockApi({ quote: quoteFor(45) });
    renderModal();
    await pickTicket('Day Ticket - Saturday');
    await clickButton(/continue to payment/i);

    await userEvent.click(await screen.findByTestId('card-element'));
    // Start the purchase, then leave before paying.
    confirmCardPayment.mockResolvedValueOnce({
      error: { message: 'Card declined' },
    });
    await clickButton(/pay now/i);
    await screen.findByText('Card declined');

    await clickButton(/back to tickets/i);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/tickets/ticket-9/cancel', {
        reason: 'checkout abandoned',
      }),
    );
  });

  it('never asks a virtual event for accommodation', async () => {
    renderWithNextIntl(
      <EventTicketModal
        event={{ ...event, virtual: true }}
        closeModal={jest.fn()}
      />,
    );
    await pickTicket('3-day Ticket (At Cost)');

    await clickButton(/continue to payment/i);

    expect(routerPush).not.toHaveBeenCalled();
    expect(await screen.findByText(/pay for your ticket/i)).toBeInTheDocument();
  });

  it('sends a signed out guest to log in and back to the event', async () => {
    mockUser = null;
    mockApi({ quote: quoteFor(45) });
    renderModal();
    await pickTicket('Day Ticket - Saturday');

    await clickButton(/login/i);

    const url = routerPush.mock.calls[0][0] as string;
    expect(url).toContain('/login?back=');
    expect(url).toContain('confluencia');
  });

  describe('opened by a deep link', () => {
    it('preselects the ticket the link names', async () => {
      mockApi({ quote: quoteFor(45) });
      renderModal({ initialTicketOption: 'Day Ticket - Saturday' });

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/tickets/quote', {
          eventId: 'event-1',
          ticketOption: 'Day Ticket - Saturday',
          quantity: 1,
        }),
      );
      expect(
        screen.getByRole('button', { name: /continue to payment/i }),
      ).toBeInTheDocument();
    });

    it('matches an option written with underscores in the link', async () => {
      mockApi({ quote: quoteFor(45) });
      renderModal({ initialTicketOption: 'day_ticket_-_saturday' });

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/tickets/quote', {
          eventId: 'event-1',
          ticketOption: 'Day Ticket - Saturday',
          quantity: 1,
        }),
      );
    });

    it('applies a linked discount code without waiting for Apply', async () => {
      mockApi({ quote: quoteFor(45) });
      renderModal({
        initialTicketOption: 'Day Ticket - Saturday',
        initialDiscountCode: 'earlybird',
      });

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/tickets/quote', {
          eventId: 'event-1',
          ticketOption: 'Day Ticket - Saturday',
          quantity: 1,
          discountCode: 'EARLYBIRD',
        }),
      );
    });

    it('opens on payment for a pending ticket, priced as it was bought', async () => {
      mockApi({ quote: quoteFor(45, 2) });
      renderModal({ initialTicketId: 'ticket-7' });

      expect(await screen.findByText(/pay for your ticket/i)).toBeInTheDocument();
      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/tickets/quote', {
          eventId: 'event-1',
          ticketOption: 'Day Ticket - Saturday',
          quantity: 2,
          discountCode: 'EARLYBIRD',
        }),
      );
      expect(api.get).toHaveBeenCalledWith('/tickets/ticket-7');
      expect(screen.getByText('Day Ticket - Saturday × 2')).toBeInTheDocument();
    });

    it('pays the resumed ticket on the terms the ticket carries', async () => {
      mockApi({ quote: quoteFor(45, 2) });
      renderModal({ initialTicketId: 'ticket-7' });

      await userEvent.click(await screen.findByTestId('card-element'));
      await clickButton(/pay now/i);

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/tickets/init', {
          eventId: 'event-1',
          ticketOption: 'Day Ticket - Saturday',
          quantity: 2,
          discountCode: 'EARLYBIRD',
          paymentMethod: 'card',
          email: 'guest@example.com',
        }),
      );
    });

    it('says so rather than charging again for a ticket already paid', async () => {
      mockApi({ ticket: { ...pendingTicket, status: 'approved' } });
      renderModal({ initialTicketId: 'ticket-7' });

      expect(
        await screen.findByText(/already paid for/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/pay for your ticket/i)).not.toBeInTheDocument();
    });

    it('refuses a ticket that belongs to another event', async () => {
      mockApi({ ticket: { ...pendingTicket, event: 'event-2' } });
      renderModal({ initialTicketId: 'ticket-7' });

      expect(
        await screen.findByText(/belongs to a different event/i),
      ).toBeInTheDocument();
    });

    it('falls back to choosing a ticket when the link points at nothing', async () => {
      mockApi();
      api.get.mockImplementation((url: string) => {
        if (url.includes('/tickets/event/')) {
          return Promise.resolve({ data: { results: { ticketOptions } } });
        }
        if (url === '/booking') return Promise.resolve({ data: { results: [] } });
        return Promise.reject(new Error('Ticket not found.'));
      });
      renderModal({ initialTicketId: 'ticket-gone' });

      expect(
        await screen.findByText(/could not pick that ticket back up/i),
      ).toBeInTheDocument();
      expect(screen.getByText('Day Ticket - Saturday')).toBeInTheDocument();
    });

    it('sends a signed out guest to log in and back to the deep link', async () => {
      mockUser = null;
      mockApi({ quote: quoteFor(45) });
      renderModal({ initialTicketId: 'ticket-7' });

      await pickTicket('Day Ticket - Saturday');
      await clickButton(/login/i);

      expect(routerPush.mock.calls[0][0]).toContain(
        encodeURIComponent('/events/confluencia'),
      );
    });
  });
});
