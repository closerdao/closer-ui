import { fireEvent, screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import BookingRequestButtons from './index';

const guest = { _id: 'user-1', roles: ['member'] };

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: guest }),
}));

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
        isFiatBooking={false}
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
