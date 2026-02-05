import { BookingSummaryPage } from 'closer';
import { renderWithProviders } from '@/test/utils';
import { screen, within } from '@testing-library/react';
import {
  booking,
  bookingWithFood,
  listing,
  paymentConfig,
} from '@/__tests__/mocks';
import { bookingConfig, bookingConfigWithFoodAndUtilityDisabled } from '@/__tests__/mocks/bookingConfig';
import { mockAuthContext } from '@/__tests__/mocks/mockAuthContext';

jest.mock('closer/contexts/auth', () => {
  const actual = jest.requireActual<typeof import('closer/contexts/auth')>('closer/contexts/auth');
  return { ...actual, useAuth: () => mockAuthContext };
});

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

  it('renders booking details and costs section', () => {
    renderWithProviders(
      <BookingSummaryPage
        booking={booking}
        listing={listing}
        event={undefined}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
      />,
    );
    expect(screen.getByRole('heading', { name: /Costs/i })).toBeInTheDocument();
    const accommodationLabels = screen.getAllByText(/Accommodation:/i);
    expect(accommodationLabels.length).toBeGreaterThan(0);
  });

  it('shows food €0.00 / not included when booking has no food selected', () => {
    renderWithProviders(
      <BookingSummaryPage
        booking={booking}
        listing={listing}
        event={undefined}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
      />,
    );
    const costsSection = screen.getByRole('heading', { name: /Costs/i }).closest('div');
    expect(costsSection).toBeInTheDocument();
    const foodLabel = screen.getByText(/Food:/i);
    expect(foodLabel.closest('div')).toHaveTextContent(/€0\.00|not included/i);
  });

  it('shows food cost when booking has food selected', () => {
    const bookingWithFoodSelected = {
      ...bookingWithFood,
      foodOptionId: 'food-1',
    };
    renderWithProviders(
      <BookingSummaryPage
        booking={bookingWithFoodSelected}
        listing={listing}
        event={undefined}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
      />,
    );
    const foodRow = screen.getByText(/Food:/i).closest('div');
    expect(foodRow).toHaveTextContent('€24.00');
  });

  it('correctly sums accommodation + utilities + food in total', () => {
    const bookingWithFoodSelected = {
      ...bookingWithFood,
      foodOptionId: 'food-1',
      total: { cur: 'EUR', val: 104 },
    };
    renderWithProviders(
      <BookingSummaryPage
        booking={bookingWithFoodSelected}
        listing={listing}
        event={undefined}
        bookingConfig={bookingConfig}
        paymentConfig={paymentConfig}
      />,
    );
    const costsHeading = screen.getByRole('heading', { name: /Costs/i });
    const costsSection = costsHeading.closest('div')?.parentElement ?? costsHeading.parentElement;
    const withinCosts = within(costsSection as HTMLElement);
    expect(withinCosts.getByText(/Accommodation:/i).closest('div')).toHaveTextContent('€60.00');
    expect(withinCosts.getByText(/Utilities fee:/i).closest('div')).toHaveTextContent('€20.00');
    expect(withinCosts.getByText(/Food:/i).closest('div')).toHaveTextContent('€24.00');
    expect(withinCosts.getByText(/Total/i).closest('div')).toHaveTextContent('€104.00');
  });
});
