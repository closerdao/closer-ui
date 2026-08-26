import { useTranslations } from 'next-intl';

import { CloserCurrencies } from '../../types/currency';
import type {
  BookingRate,
  StaySearchListing,
} from '../../types/durationDiscount';
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
const displayDiscountPercent = (fraction: number) =>
  Math.round(fraction * 10_000) / 100;

const StayListingAccommodationPrice = ({
  listing,
  duration,
}: StayListingAccommodationPriceProps) => {
  const t = useTranslations();
  const currency =
    listing.rentalFiat?.cur ?? listing.fiatPrice?.cur ?? CloserCurrencies.EUR;
  const rentalFiat = listing.rentalFiat;
  const durationDiscount =
    Number(
      listing.accommodationDiscount?.duration.fraction ?? listing.discount,
    ) || 0;
  const passportDiscount =
    Number(listing.accommodationDiscount?.passport.fraction) || 0;
  const combinedDiscount =
    Number(
      listing.accommodationDiscount?.combinedFraction ?? durationDiscount,
    ) || 0;
  const hasDiscount = isDurationDiscountFraction(combinedDiscount);
  const resolvedGrossVal = hasDiscount
    ? listing.accommodationPricing?.fiat.gross.val ??
      computeGrossAccommodationFromDiscounted(rentalFiat, combinedDiscount)
    : null;
  const grossVal =
    resolvedGrossVal != null &&
    Number.isFinite(resolvedGrossVal) &&
    rentalFiat?.val != null &&
    resolvedGrossVal > rentalFiat.val
      ? resolvedGrossVal
      : null;
  const showTotal =
    rentalFiat?.val != null && Number.isFinite(rentalFiat.val) && duration > 0;

  if (!showTotal && !(hasDiscount && listing.bookingRate)) {
    return null;
  }

  const formattedCurrency = currency as CloserCurrencies;

  return (
    <div className="flex flex-col gap-1 text-sm">
      {showTotal && (
        <p className="text-gray-900">
          {grossVal != null && (
            <span className="text-gray-400 line-through font-normal mr-1.5 tabular-nums">
              {priceFormat(grossVal, formattedCurrency)}
            </span>
          )}
          <span className="font-semibold tabular-nums">
            {priceFormat(rentalFiat!.val, formattedCurrency)}
          </span>
          <span className="text-gray-600 font-normal">
            {' '}
            {t('stay_create_listing_for_nights', { nights: duration })}
          </span>
        </p>
      )}
      {hasDiscount && listing.bookingRate && (
        <div className="text-xs font-medium text-accent flex flex-wrap gap-x-2">
          {durationDiscount > 0 && (
            <span>
              {t('stay_create_duration_discount_badge', {
                rate: t(rateTranslationKey(listing.bookingRate)),
                percent: durationDiscountPercent(durationDiscount),
              })}
            </span>
          )}
          {passportDiscount > 0 && (
            <span>
              {t('stay_accommodation_discount_passport', {
                percent: displayDiscountPercent(passportDiscount),
              })}
            </span>
          )}
          {durationDiscount > 0 && passportDiscount > 0 && (
            <span>
              {t('stay_accommodation_discount_combined', {
                percent: displayDiscountPercent(combinedDiscount),
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StayListingAccommodationPrice;
