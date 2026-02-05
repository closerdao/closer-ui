import { BookingPage } from 'closer';
import { renderWithProviders } from '@/test/utils';
import { screen } from '@testing-library/react';
import {
  bookingWithPaymentDelta,
  listing,
  user,
  paymentConfig,
} from '@/__tests__/mocks';
import { bookingConfig } from '@/__tests__/mocks/bookingConfig';
import { mockAuthContext } from '@/__tests__/mocks/mockAuthContext';

const bookingCreatorId = '63fc8e8910354e3f945e249a';

jest.mock('closer/contexts/auth', () => {
  const actual = jest.requireActual<typeof import('closer/contexts/auth')>('closer/contexts/auth');
  return {
    ...actual,
    useAuth: () => ({ ...mockAuthContext, user: { ...user, _id: bookingCreatorId } }),
  };
});

jest.mock('closer/contexts/platform', () => {
  const actual = jest.requireActual<typeof import('closer/contexts/platform')>('closer/contexts/platform');
  return {
    ...actual,
    usePlatform: () => ({ platform: { bookings: { confirm: jest.fn(), reject: jest.fn() } } }),
  };
});

describe('BookingPage (detail/edit)', () => {
  const OLD_ENV = process.env;
  const generalConfig = { timeZone: 'Europe/Lisbon' };
  const foodOptions: { _id: string; name: string; price?: number; isDefault?: boolean }[] = [];
  const projects: unknown[] = [];
  const listings = [listing];

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_FEATURE_BOOKING: 'true' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('renders booking detail with payment delta amount due', () => {
    renderWithProviders(
      <BookingPage
        booking={bookingWithPaymentDelta}
        listing={listing}
        event={{} as any}
        volunteer={{} as any}
        bookingCreatedBy={user as any}
        bookingConfig={bookingConfig}
        listings={listings}
        generalConfig={generalConfig}
        paymentConfig={paymentConfig}
        foodOptions={foodOptions}
        projects={projects}
      />,
    );
    expect(screen.getByText(/#/)).toBeInTheDocument();
    expect(screen.getByText(bookingWithPaymentDelta._id)).toBeInTheDocument();
  });

  it('renders checkout action when booking is pending payment', () => {
    renderWithProviders(
      <BookingPage
        booking={bookingWithPaymentDelta}
        listing={listing}
        event={{} as any}
        volunteer={{} as any}
        bookingCreatedBy={user as any}
        bookingConfig={bookingConfig}
        listings={listings}
        generalConfig={generalConfig}
        paymentConfig={paymentConfig}
        foodOptions={foodOptions}
        projects={projects}
      />,
    );
    expect(screen.getByRole('heading', { name: /your booking is pending payment/i })).toBeInTheDocument();
    expect(screen.getByText(/complete payment/i)).toBeInTheDocument();
  });
});
