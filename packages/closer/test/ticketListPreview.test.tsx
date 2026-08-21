import React from 'react';

import TicketListPreview from '../components/TicketListPreview';

import { screen } from '@testing-library/react';

import type { Ticket } from '../types/ticket';
import { renderWithNextIntl } from './utils';

const baseTicket = {
  _id: '664000000000000000000031',
  status: 'approved',
  paymentMethod: 'card',
  event: '664000000000000000000009',
  quantity: 1,
  name: 'Sam',
  email: 'sam@example.com',
  price: { val: 50, cur: 'EUR' },
  unitPrice: { val: 50, cur: 'EUR' },
  option: { name: 'Regular', price: 100, currency: 'EUR' },
} as unknown as Ticket;

/** priceFormat goes through Intl, so separators depend on the host locale. */
const money = (amount: string) =>
  new RegExp(`${amount}[.,]00`.replace('.', '\\.'));

describe('TicketListPreview', () => {
  it('shows the discount against the list price, not just the total', () => {
    renderWithNextIntl(
      <TicketListPreview
        ticket={{ ...baseTicket, discount: { code: 'HALF' } } as Ticket}
      />,
    );

    expect(screen.getByText('Discount (HALF)')).toBeInTheDocument();
    // 100 struck through, 50 off, 50 paid.
    expect(screen.getByText(money('100'))).toBeInTheDocument();
    expect(screen.getByText(/-.*50[.,]00/)).toBeInTheDocument();
    expect(screen.getByText('List price')).toBeInTheDocument();
  });

  it('leaves the discount rows out when nothing was taken off', () => {
    renderWithNextIntl(
      <TicketListPreview
        ticket={
          {
            ...baseTicket,
            price: { val: 100, cur: 'EUR' },
            unitPrice: { val: 100, cur: 'EUR' },
          } as Ticket
        }
      />,
    );

    expect(screen.queryByText('List price')).not.toBeInTheDocument();
    expect(screen.getByText('Total cost:')).toBeInTheDocument();
  });

  it('links to the booking only when the ticket came with one', () => {
    const { unmount } = renderWithNextIntl(
      <TicketListPreview ticket={baseTicket} />,
    );
    expect(screen.queryByText('View booking')).not.toBeInTheDocument();
    unmount();

    renderWithNextIntl(
      <TicketListPreview
        ticket={
          {
            ...baseTicket,
            paymentMethod: 'booking',
            booking: '664000000000000000000077',
          } as Ticket
        }
      />,
    );
    expect(screen.getByText('View booking')).toHaveAttribute(
      'href',
      '/stay/664000000000000000000077',
    );
  });

  it('renders a ticket carrying nothing but an id', () => {
    renderWithNextIntl(
      <TicketListPreview
        ticket={{ _id: 'ticket-1', status: 'pending' } as Ticket}
      />,
    );

    expect(screen.getByText('ticket-1')).toBeInTheDocument();
    expect(screen.queryByText('View booking')).not.toBeInTheDocument();
  });
});
