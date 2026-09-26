import type { ComponentType } from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StayBookingSummaryPage from '../pages/stay/[slug]/index';
import type { Booking } from '../types';
import {
  approveStayModification,
  approveStayRequest,
  getHostNotes,
  getStay,
} from '../utils/stays.api';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'host_1', roles: ['space-host'] },
  }),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: { bookings: {} } }),
}));

jest.mock('../utils/stays.api', () => ({
  ...jest.requireActual('../utils/stays.api'),
  getStay: jest.fn(),
  getHostNotes: jest.fn(() => Promise.resolve({})),
  getStayChanges: jest.fn(() =>
    Promise.resolve({ total: 0, page: 1, limit: 2, entries: [] }),
  ),
  approveStayRequest: jest.fn(),
  approveStayModification: jest.fn(),
}));

jest.mock('../components/booking/hostActions/stayHostActions', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../components/booking/stayModifyFlow', () => ({
  __esModule: true,
  default: () => null,
}));

const baseBooking = {
  _id: 'stay_1',
  createdBy: 'guest_1',
  start: '2027-01-10T00:00:00.000Z',
  end: '2027-01-12T00:00:00.000Z',
  created: '2026-09-01T00:00:00.000Z',
  adults: 1,
};

const renderPage = (booking: Record<string, unknown>) => {
  const Page = StayBookingSummaryPage as unknown as ComponentType<
    Record<string, unknown>
  >;
  renderWithNextIntl(
    <Page
      booking={booking as unknown as Booking}
      bookingConfig={{ enabled: true }}
    />,
  );
};

describe('stay detail host decisions carry a reason', () => {
  const featureBooking = process.env.NEXT_PUBLIC_FEATURE_BOOKING;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = featureBooking;
  });
  beforeEach(() => {
    jest.clearAllMocks();
    (getStay as jest.Mock).mockResolvedValue({
      ...baseBooking,
      status: 'confirmed',
    });
  });

  it('approving a request asks why and sends it', async () => {
    const user = userEvent.setup();
    renderPage({ ...baseBooking, status: 'pending' });

    await user.click(await screen.findByRole('button', { name: 'Approve' }));
    expect(approveStayRequest).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Reason'), 'Returning guest');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(approveStayRequest).toHaveBeenCalledWith(
        'stay_1',
        'Returning guest',
      ),
    );
    await waitFor(() => expect(getHostNotes).toHaveBeenCalledTimes(2));
  });

  it('approving a held change goes to /modification/approve with the reason', async () => {
    const user = userEvent.setup();
    renderPage({
      ...baseBooking,
      status: 'paid',
      pendingModification: {
        id: 'hold_1',
        type: 'dates',
        status: 'pending-approval',
        requiresHostApproval: true,
        overrides: { end: '2027-01-14T00:00:00.000Z' },
      },
    });

    await user.click(
      await screen.findByRole('button', { name: 'Approve change' }),
    );
    await user.type(screen.getByLabelText('Reason'), 'Room is free');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(approveStayModification).toHaveBeenCalledWith(
        'stay_1',
        'Room is free',
      ),
    );
  });
});
