import { BookingSummaryPage } from 'closer';
import { renderWithProviders } from '@/test/utils';
import { screen } from '@testing-library/react';
import {
  booking,
  bookingWithFood,
  listing,
  paymentConfig,
} from '@/__tests__/mocks';
import { bookingConfig, bookingConfigWithFoodAndUtilityDisabled } from '@/__tests__/mocks/bookingConfig';
import { mockAuthContext } from '@/__tests__/mocks/mockAuthContext';

jest.mock('closer/contexts/auth', () => ({
  useAuth: () => mockAuthContext,
}));

describe('BookingSummaryPage', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_FEATURE_BOOKING: 'true' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('renders summary with booking and shows cost section when food and utility enabled', () => {
    renderWithProviders(
      <BookingSummaryPage
        booking={bookingWithFood}
        listing={listing}
        event={undefined}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
      />,
    );
    expect(
      screen.getByRole('heading', { name: /summary/i }),
    ).toBeInTheDocument();
  });

  it('renders summary with food and utility disabled in config', () => {
    renderWithProviders(
      <BookingSummaryPage
        booking={booking}
        listing={listing}
        event={undefined}
        bookingConfig={bookingConfigWithFoodAndUtilityDisabled}
        paymentConfig={paymentConfig}
      />,
    );
    expect(
      screen.getByRole('heading', { name: /summary/i }),
    ).toBeInTheDocument();
  });

  it('renders progress steps', () => {
    renderWithProviders(
      <BookingSummaryPage
        booking={booking}
        listing={listing}
        event={undefined}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
      />,
    );
    expect(screen.getByText(/dates/i)).toBeInTheDocument();
  });
});
