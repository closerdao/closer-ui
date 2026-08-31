import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import type { StaySearchListing } from '../../types/durationDiscount';
import StayListingAccommodationPrice from './stayListingAccommodationPrice';

const buildListing = ({
  gross,
  discounted,
  durationFraction = 0,
  passportFraction = 0,
  combinedFraction = 0,
  bookingRate = 'daily',
}: {
  gross: number;
  discounted: number;
  durationFraction?: number;
  passportFraction?: number;
  combinedFraction?: number;
  bookingRate?: 'daily' | 'weekly' | 'monthly';
}) =>
  ({
    _id: 'listing-1',
    name: 'Test accommodation',
    fiatPrice: { val: 100, cur: 'EUR' },
    rentalFiat: { val: discounted, cur: 'EUR' },
    bookingRate,
    discount: durationFraction,
    accommodationDiscount: {
      duration: { tier: bookingRate, fraction: durationFraction },
      passport: { fraction: passportFraction },
      combinedFraction,
    },
    accommodationPricing: {
      fiat: {
        gross: { val: gross, cur: 'EUR' },
        discounted: { val: discounted, cur: 'EUR' },
        discountAmount: { val: gross - discounted, cur: 'EUR' },
        effectivePerNight: { val: discounted, cur: 'EUR' },
      },
    },
  } as unknown as StaySearchListing);

describe('StayListingAccommodationPrice', () => {
  it('does not strike through the price when no discount applies', () => {
    const { container } = renderWithNextIntl(
      <StayListingAccommodationPrice
        listing={buildListing({ gross: 600, discounted: 600 })}
        duration={6}
      />,
    );

    expect(container.querySelector('.line-through')).not.toBeInTheDocument();
    expect(screen.getByText(/for 6 nights/i)).toBeVisible();
  });

  it('shows the gross price and weekly badge for a duration discount', () => {
    const { container } = renderWithNextIntl(
      <StayListingAccommodationPrice
        listing={buildListing({
          gross: 700,
          discounted: 490,
          durationFraction: 0.3,
          combinedFraction: 0.3,
          bookingRate: 'weekly',
        })}
        duration={7}
      />,
    );

    expect(container.querySelector('.line-through')).toBeVisible();
    expect(screen.getByText('Weekly stay −30%')).toBeVisible();
  });

  it('preserves up to two decimal places in the duration percentage', () => {
    renderWithNextIntl(
      <StayListingAccommodationPrice
        listing={buildListing({
          gross: 700,
          discounted: 465.5,
          durationFraction: 0.335,
          combinedFraction: 0.335,
          bookingRate: 'weekly',
        })}
        duration={7}
      />,
    );

    expect(screen.getByText('Weekly stay −33.5%')).toBeVisible();
  });

  // TODO: Add Passport-only and stacked-discount UI coverage when Passport is
  // rolled out to users. The rendering support stays in production code, but
  // Passport scenarios are intentionally outside the current release test plan.
});
