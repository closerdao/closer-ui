import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import type { CalendarBlockingEvent } from '../../utils/events.helpers';
import StayEventBlockedNotice from './stayEventBlockedNotice';

const event: CalendarBlockingEvent = {
  _id: 'event-1',
  name: 'Regeneration Week',
  slug: 'regeneration-week',
  start: '2026-09-10',
  end: '2026-09-14',
  paid: true,
  blocksBookingCalendar: true,
};

describe('StayEventBlockedNotice', () => {
  it('explains why the dates cannot be booked', () => {
    renderWithNextIntl(<StayEventBlockedNotice events={[event]} />);

    expect(
      screen.getByText(/ticketed event happening within that period/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Regeneration Week')).toBeInTheDocument();
    expect(screen.getByText(/Sep 10 – Sep 14, 2026/)).toBeInTheDocument();
  });

  it('invites the guest to get a ticket when one paid event blocks the dates', () => {
    renderWithNextIntl(<StayEventBlockedNotice events={[event]} />);

    expect(
      screen.getByRole('link', { name: /get a ticket for the event/i }),
    ).toHaveAttribute('href', '/events/regeneration-week');
  });

  it('links to a free event without offering a ticket', () => {
    renderWithNextIntl(
      <StayEventBlockedNotice events={[{ ...event, paid: false }]} />,
    );

    expect(
      screen.getByRole('link', { name: /see the event/i }),
    ).toHaveAttribute('href', '/events/regeneration-week');
  });

  it('links to the events page when several events block the dates', () => {
    renderWithNextIntl(
      <StayEventBlockedNotice
        events={[
          event,
          {
            ...event,
            _id: 'event-2',
            name: 'Builders Gathering',
            slug: 'builders',
          },
        ]}
      />,
    );

    expect(
      screen.getByRole('link', { name: /check the events page/i }),
    ).toHaveAttribute('href', '/events');
  });

  it('renders a dismiss action only when one is provided', async () => {
    const onDismiss = jest.fn();
    const { rerender } = renderWithNextIntl(
      <StayEventBlockedNotice events={[event]} />,
    );
    expect(
      screen.queryByRole('button', { name: /adjust my dates/i }),
    ).not.toBeInTheDocument();

    rerender(<StayEventBlockedNotice events={[event]} onDismiss={onDismiss} />);
    await userEvent.click(
      screen.getByRole('button', { name: /adjust my dates/i }),
    );
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders nothing without blocking events', () => {
    const { container } = renderWithNextIntl(
      <StayEventBlockedNotice events={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
