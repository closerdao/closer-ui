import { booking, bookingSettings, listing } from '@/__tests__/mocks';
import Checkout from '@/pages/bookings/[slug]/checkout';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

describe('Checkout page', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it.skip('should render No access by default', async () => {
    process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY = '12345';
    renderWithProviders(
      <Checkout
        booking={booking}
        listing={listing}
        settings={bookingSettings}
      />,
    );

    const title = screen.getByRole('heading', {
      name: /No access/i,
    });
    expect(title).toBeInTheDocument();
  });
});
