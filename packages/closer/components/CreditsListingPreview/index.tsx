import { useEffect, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../contexts/platform';
import type { Listing } from '../../types/booking';
import { CloserCurrencies } from '../../types/currency';
import { priceFormat } from '../../utils/helpers';

const MAX_LISTINGS_TO_FETCH = 100;

const isGuestListing = (listing: Listing) => {
  const availableFor = listing.availableFor;
  const values = Array.isArray(availableFor)
    ? availableFor
    : [availableFor].filter(Boolean);
  // A listing reserved for the team or for volunteers is not something a
  // member can spend credits on, so it must not be the example we show.
  return !values.some(
    (value) => value === 'team' || value === 'volunteer',
  );
};

/**
 * The cheapest accommodation a member can actually book — the "shared"
 * option in practice, and the one a credit is worth a night of.
 */
export const pickCreditExampleListing = (
  listings: Listing[],
): Listing | null =>
  listings
    .filter(
      (listing) =>
        isGuestListing(listing) && Number(listing?.fiatPrice?.val) > 0,
    )
    .sort(
      (a, b) => Number(a.fiatPrice?.val) - Number(b.fiatPrice?.val),
    )[0] ?? null;

interface Props {
  credits: number;
  className?: string;
}

/**
 * What the credits being bought are actually worth: "14 nights in Shared
 * glamping, €750 €0". "14 nights of accommodation" told a member the unit but
 * not the value, which is the part that makes a price feel worth paying.
 *
 * Falls back to the plain nights line when the platform has no bookable
 * listing to price against.
 */
const CreditsListingPreview = ({ credits, className }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();

  const listingFilter = useMemo(
    () => ({ where: {}, limit: MAX_LISTINGS_TO_FETCH }),
    [],
  );

  useEffect(() => {
    // A failed read resolves undefined rather than rejecting, so there is
    // nothing to handle here: no listings simply means no example.
    void platform.listing.get(listingFilter);
  }, [listingFilter]);

  const results = platform.listing.find(listingFilter);
  const listing = useMemo(
    () => pickCreditExampleListing(results?.toJS?.() ?? []),
    [results],
  );

  if (!listing) {
    return (
      <span className={className}>
        {t('credits_checkout_nights_hint', { nights: credits })}
      </span>
    );
  }

  const worth = credits * Number(listing.fiatPrice?.val ?? 0);
  const currency = (listing.fiatPrice?.cur ||
    CloserCurrencies.EUR) as CloserCurrencies;

  return (
    <span className={`flex flex-wrap items-baseline gap-x-2 ${className || ''}`}>
      <span>
        {t('credits_checkout_nights_in_listing', {
          nights: credits,
          listing: listing.name,
        })}
      </span>
      <span className="line-through text-gray-400">
        {priceFormat(worth, currency)}
      </span>
      <span className="font-bold text-system-success">
        {priceFormat(0, currency)}
      </span>
    </span>
  );
};

export default CreditsListingPreview;
