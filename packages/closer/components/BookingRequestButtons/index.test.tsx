import { fireEvent, screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import BookingRequestButtons from './index';

const guest = { _id: 'user-1', roles: ['member'] };
let currentUser: { _id: string; roles: string[] } = guest;

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: currentUser }),
}));

afterEach(() => {
  currentUser = guest;
});

const baseProps = {
  _id: 'booking-1',
  createdBy: 'user-1',
  start: '2026-09-01',
  end: '2026-09-05',
  confirmBooking: jest.fn(),
  rejectBooking: jest.fn(),
};

describe('BookingRequestButtons draft cancellation', () => {
  it('lets the owner cancel a draft booking', () => {
    const onCancelDraft = jest.fn();
    renderWithNextIntl(
      <BookingRequestButtons
        {...baseProps}
        status="draft"
        onCancelDraft={onCancelDraft}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel booking/i }));

    expect(onCancelDraft).toHaveBeenCalledTimes(1);
  });

  it('cancels a draft paid with credits or tokens too', () => {
    const onCancelDraft = jest.fn();
    renderWithNextIntl(
      <BookingRequestButtons
        {...baseProps}
        status="draft"
        onCancelDraft={onCancelDraft}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel booking/i }));

    expect(onCancelDraft).toHaveBeenCalledTimes(1);
  });

  it('shows no cancel button on a draft when no handler is given', () => {
    renderWithNextIntl(<BookingRequestButtons {...baseProps} status="draft" />);

    expect(
      screen.queryByRole('button', { name: /cancel booking/i }),
    ).not.toBeInTheDocument();
  });

  it('shows no cancel button on a draft belonging to someone else', () => {
    const onCancelDraft = jest.fn();
    renderWithNextIntl(
      <BookingRequestButtons
        {...baseProps}
        createdBy="someone-else"
        status="draft"
        onCancelDraft={onCancelDraft}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /cancel booking/i }),
    ).not.toBeInTheDocument();
  });
});

describe('BookingRequestButtons cancellation of live bookings', () => {
  const cancelLink = () =>
    screen.queryByRole('link', { name: /cancel booking/i });
  const liveProps = { ...baseProps, start: '2027-03-01', end: '2027-03-05' };

  it('lets the owner cancel a stay that is pending payment after an extension', () => {
    renderWithNextIntl(
      <BookingRequestButtons {...liveProps} status="pending-payment" />,
    );
    expect(cancelLink()).toHaveAttribute('href', '/bookings/booking-1/cancel');
  });

  it.each(['tokens-staked', 'credits-paid'])(
    'lets the owner cancel a %s stay',
    (status) => {
      renderWithNextIntl(
        <BookingRequestButtons {...liveProps} status={status} />,
      );
      expect(cancelLink()).toBeInTheDocument();
    },
  );

  it('hides cancellation once the stay has ended', () => {
    renderWithNextIntl(
      <BookingRequestButtons {...liveProps} status="paid" end="2020-01-01" />,
    );
    expect(cancelLink()).not.toBeInTheDocument();
  });

  it('hides cancellation on a cancelled stay', () => {
    renderWithNextIntl(
      <BookingRequestButtons {...liveProps} status="cancelled" />,
    );
    expect(cancelLink()).not.toBeInTheDocument();
  });

  it('lets an admin cancel another guest’s stay', () => {
    currentUser = { _id: 'admin-1', roles: ['admin'] };
    renderWithNextIntl(
      <BookingRequestButtons
        {...liveProps}
        createdBy="someone-else"
        status="paid"
      />,
    );
    expect(cancelLink()).toHaveAttribute('href', '/bookings/booking-1/cancel');
  });

  it('hides cancellation of another guest’s stay from a plain member', () => {
    renderWithNextIntl(
      <BookingRequestButtons
        {...liveProps}
        createdBy="someone-else"
        status="paid"
      />,
    );
    expect(cancelLink()).not.toBeInTheDocument();
  });
});
