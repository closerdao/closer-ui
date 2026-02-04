import DateSelector from '@/pages/bookings/create/dates';
import { renderWithProviders } from '@/test/utils';

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { bookingConfig } from '@/__tests__/mocks/bookingConfig';
import { mockAuthContext } from '@/__tests__/mocks/mockAuthContext';

const memberUser = { ...mockAuthContext.user, roles: ['member'] };
const guestUser = { ...mockAuthContext.user, roles: [] as string[] };

jest.mock('closer/contexts/auth', () => {
  const actual = jest.requireActual<typeof import('closer/contexts/auth')>('closer/contexts/auth');
  return {
    ...actual,
    useAuth: jest.fn(() => ({ isAuthenticated: true, user: guestUser })),
  };
});

describe('DateSelector', () => {
  it('should render and have a proper title', () => {
    renderWithProviders(
      <DateSelector
        bookingSettings={bookingConfig}
        volunteerConfig={null}
      />,
    );

    const title = screen.getByRole('heading', {
      name: /your stay/i,
    });
    expect(title).toBeInTheDocument();
  });

  describe('Minimum stay', () => {
    beforeEach(() => {
      const auth = require('closer/contexts/auth');
      (auth.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: memberUser,
      });
    });

    afterEach(() => {
      const auth = require('closer/contexts/auth');
      (auth.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: guestUser,
      });
    });

    it('should show min duration error and disable Search when stay is under 3 days', () => {
      renderWithProviders(
        <DateSelector
          bookingSettings={bookingConfig}
          volunteerConfig={null}
        />,
        {
          route: '/bookings/create/dates',
          router: {
            query: { start: '2026-03-15', end: '2026-03-16' },
          },
        },
      );
      const errorMessages = screen.getAllByText(/min booking duration is 3 days/i);
      expect(errorMessages.length).toBeGreaterThan(0);
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toBeDisabled();
    });

    it('should enable Search when stay is exactly 3 days', () => {
      renderWithProviders(
        <DateSelector
          bookingSettings={bookingConfig}
          volunteerConfig={null}
        />,
        {
          route: '/bookings/create/dates',
          router: {
            query: { start: '2026-03-15', end: '2026-03-18' },
          },
        },
      );
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toBeEnabled();
    });
  });

  describe('Guest counters', () => {
    it('should increment adult count when + button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <DateSelector
          bookingSettings={bookingConfig}
          volunteerConfig={null}
        />,
      );
      const adultsSection = screen.getByText(/Adults/i).closest('div');
      const buttons = within(adultsSection!).getAllByRole('button');
      const incrementButton = buttons[buttons.length - 1];
      expect(within(adultsSection!).getByText('1')).toBeInTheDocument();
      await user.click(incrementButton);
      expect(within(adultsSection!).getByText('2')).toBeInTheDocument();
    });

    it('should not decrement adults below 1', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <DateSelector
          bookingSettings={bookingConfig}
          volunteerConfig={null}
        />,
      );
      const adultsSection = screen.getByText(/Adults/i).closest('div');
      const buttons = within(adultsSection!).getAllByRole('button');
      const decrementButton = buttons[0];
      expect(within(adultsSection!).getByText('1')).toBeInTheDocument();
      await user.click(decrementButton);
      expect(within(adultsSection!).getByText('1')).toBeInTheDocument();
    });

    it('should allow 0 for children, infants, and pets', () => {
      renderWithProviders(
        <DateSelector
          bookingSettings={bookingConfig}
          volunteerConfig={null}
        />,
      );
      expect(
        within(screen.getByText(/Children/i).closest('div')!).getByText('0'),
      ).toBeInTheDocument();
      expect(
        within(screen.getByText(/Infants/i).closest('div')!).getByText('0'),
      ).toBeInTheDocument();
      expect(
        within(screen.getByText(/Pets/i).closest('div')!).getByText('0'),
      ).toBeInTheDocument();
    });
  });
});
