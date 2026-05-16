import { useTranslations } from 'next-intl';

import type { BookingRate, StaySearchListing } from '../../types/durationDiscount';
import { CloserCurrencies } from '../../types/currency';
import {
  computeGrossAccommodationFromDiscounted,
  durationDiscountPercent,
  isDurationDiscountFraction,
} from '../../utils/durationDiscount';
import { priceFormat } from '../../utils/helpers';

interface StayListingAccommodationPriceProps {
  listing: StaySearchListing;
  duration: number;
}

const rateTranslationKey = (rate: BookingRate) =>
  `stay_create_discount_rate_${rate}` as const;

const StayListingAccommodationPrice = ({
  listing,
  duration,
}: StayListingAccommodationPriceProps) => {
  const t = useTranslations();
  const nightlyVal = listing.fiatPrice?.val;
  const currency =
    listing.rentalFiat?.cur ??
    listing.fiatPrice?.cur ??
    CloserCurrencies.EUR;
  const rentalFiat = listing.rentalFiat;
  const discount = Number(listing.discount) || 0;
  const hasDiscount = isDurationDiscountFraction(discount);
  const grossVal = hasDiscount
    ? computeGrossAccommodationFromDiscounted(rentalFiat, discount)
    : null;
  const showTotal =
    rentalFiat?.val != null &&
    Number.isFinite(rentalFiat.val) &&
    duration > 0;

  if (!showTotal && (nightlyVal == null || !Number.isFinite(nightlyVal))) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      {nightlyVal != null && Number.isFinite(nightlyVal) && nightlyVal > 0 && (
        <p className="text-gray-500 text-xs">
          {priceFormat(nightlyVal, currency as CloserCurrencies)}
          <span> / {t('listing_preview_night')}</span>
        </p>
      )}
      {showTotal && (
        <p className="text-gray-900">
          {grossVal != null && (
            <span className="text-gray-400 line-through font-normal mr-1.5">
              {priceFormat(grossVal, currency as CloserCurrencies)}
            </span>
          )}
          <span className="font-semibold">
            {priceFormat(rentalFiat!.val, currency as CloserCurrencies)}
          </span>
          <span className="text-gray-600 font-normal">
            {' '}
            {t('stay_create_listing_for_nights', { nights: duration })}
          </span>
        </p>
      )}
      {hasDiscount && listing.bookingRate && (
        <p className="text-xs font-medium text-accent">
          {t('stay_create_duration_discount_badge', {
            rate: t(rateTranslationKey(listing.bookingRate)),
            percent: durationDiscountPercent(discount),
          })}
        </p>
      )}
    </div>
  );
};

export default StayListingAccommodationPrice;
