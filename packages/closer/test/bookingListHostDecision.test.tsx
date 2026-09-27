import BookingListPreview from '../components/BookingListPreview/BookingListPreview';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromJS } from 'immutable';

import { renderWithNextIntl } from './utils';

const confirm = jest.fn(() => Promise.resolve());
const reject = jest.fn(() => Promise.resolve());

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'host_1', roles: ['space-host'] } }),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: { bookings: { confirm, reject } } }),
}));

const renderPending = () =>
  renderWithNextIntl(
    <BookingListPreview
      booking={fromJS({
        _id: '6aac49ae0000000000000001',
        status: 'pending',
        start: '2027-01-10T00:00:00.000Z',
        end: '2027-01-14T00:00:00.000Z',
        created: '2026-09-01T00:00:00.000Z',
        createdBy: 'guest_1',
        adults: 1,
      })}
      listing={{ name: 'Small Glamping', private: true, quantity: 1 }}
      userInfo={null}
      eventName=""
      volunteerName=""
      link={null}
    />,
  );

describe('host decisions from the bookings list', () => {
  beforeEach(() => jest.clearAllMocks());

  it('approve asks why and sends the reason', async () => {
    const user = userEvent.setup();
    renderPending();

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(confirm).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Reason'), 'Returning guest');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(confirm).toHaveBeenCalledWith(
        '6aac49ae0000000000000001',
        'Returning guest',
      ),
    );
  });

  it('reject asks why and sends the reason', async () => {
    const user = userEvent.setup();
    renderPending();

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await user.type(screen.getByLabelText('Reason'), 'Retreat week');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(reject).toHaveBeenCalledWith(
        '6aac49ae0000000000000001',
        'Retreat week',
      ),
    );
  });
});
