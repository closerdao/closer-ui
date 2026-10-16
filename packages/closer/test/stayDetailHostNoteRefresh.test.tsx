import type { ComponentType } from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StayBookingSummaryPage from '../pages/stay/[slug]/index';
import type { Booking } from '../types';
import { getHostNotes, getStay, stakeStayTokens } from '../utils/stays.api';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'host_1', roles: ['admin'] },
  }),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: { bookings: {} } }),
}));

jest.mock('../hooks/useBookingLinkedCharges', () => ({
  useBookingLinkedCharges: () => ({
    linkedCharges: [],
    refetchCharges: jest.fn(),
  }),
}));

jest.mock('../utils/stays.api', () => ({
  ...jest.requireActual('../utils/stays.api'),
  getStay: jest.fn(),
  stakeStayTokens: jest.fn(),
  getHostNotes: jest.fn(),
  getStayChanges: jest.fn(() =>
    Promise.resolve({ total: 0, page: 1, limit: 2, entries: [] }),
  ),
}));

jest.mock('../components/booking/hostActions/stayHostActions', () => ({
  __esModule: true,
  default: ({ onStayChange }: { onStayChange: () => void }) => (
    <button type="button" onClick={onStayChange}>
      Save host note
    </button>
  ),
}));

const mockedGetStay = getStay as jest.Mock;
const mockedHostNotes = getHostNotes as jest.Mock;

const booking = {
  _id: 'stay_1',
  status: 'confirmed',
  createdBy: 'guest_1',
  start: '2027-01-10T00:00:00.000Z',
  end: '2027-01-12T00:00:00.000Z',
  created: '2026-09-01T00:00:00.000Z',
  adults: 1,
} as unknown as Booking;

describe('stay detail host note', () => {
  beforeEach(() => jest.clearAllMocks());
  it('applies the checked booking immediately and ignores an older availability response', async () => {
    const web3 = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING;
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
    try {
      const money = (val: number, cur = 'EUR') => ({ val, cur });
      const before = {
        ...booking,
        stakeVerificationAvailable: true,
        tokensTarget: money(8.669192, 'TDF'),
        tokensStaked: money(0, 'TDF'),
        priceLock: {
          appliedTokens: money(10.836489, 'TDF'),
          appliedCredits: money(0, 'credits'),
          total: money(237.72),
          vat: money(44.46),
          dailyRentalToken: money(3, 'TDF'),
          lines: {
            accommodation: money(97.15),
            utility: money(20),
            food: money(70),
            event: money(0),
          },
        },
      };
      let finishOldRead: (value: unknown) => void = () => {};
      mockedGetStay.mockReturnValue(
        new Promise((resolve) => {
          finishOldRead = resolve;
        }),
      );
      mockedHostNotes.mockResolvedValue({});
      (stakeStayTokens as jest.Mock).mockResolvedValue({
        booking: {
          ...before,
          tokensStaked: money(8.669192, 'TDF'),
        },
        stakingStatus: { status: 'partial' },
      });
      const Page = StayBookingSummaryPage as unknown as ComponentType<
        Record<string, unknown>
      >;
      renderWithNextIntl(
        <Page booking={before} bookingConfig={{ enabled: true }} />,
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Check staking status' }),
      );
      expect(await screen.findByText('Complete')).toBeInTheDocument();
      await act(async () => {
        finishOldRead({ ...before, stakeVerificationAvailable: false });
      });
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText(/8[.,]67 TDF staked/)).toBeInTheDocument();
      expect(screen.queryByText(/still to stake/)).not.toBeInTheDocument();
    } finally {
      process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = web3;
    }
  });
  const featureBooking = process.env.NEXT_PUBLIC_FEATURE_BOOKING;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = featureBooking;
  });

  it('refreshes the host note even when refetching the stay fails', async () => {
    mockedHostNotes.mockResolvedValue({});
    mockedGetStay.mockRejectedValue(new Error('network down'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const Page = StayBookingSummaryPage as unknown as ComponentType<
      Record<string, unknown>
    >;
    renderWithNextIntl(
      <Page booking={booking} bookingConfig={{ enabled: true }} />,
    );

    await waitFor(() => expect(mockedHostNotes).toHaveBeenCalledTimes(1));
    await userEvent.click(
      screen.getByRole('button', { name: 'Save host note' }),
    );

    await waitFor(() => expect(mockedGetStay).toHaveBeenCalledWith('stay_1'));
    await waitFor(() => expect(mockedHostNotes).toHaveBeenCalledTimes(2));
  });
});
