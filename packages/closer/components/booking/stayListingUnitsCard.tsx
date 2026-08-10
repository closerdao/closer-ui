import { useTranslations } from 'next-intl';

import type { StaySearchListing } from '../../types/durationDiscount';
import {
  listingUnitsCountTranslationKey,
  shouldShowBookingUnitsNote,
} from '../../utils/listingUnits.helpers';

interface StayListingUnitsCardProps {
  listing: StaySearchListing;
}

const StayListingUnitsCard = ({ listing }: StayListingUnitsCardProps) => {
  const t = useTranslations();
  const unitsRequired = listing.numberOfUnitsRequired;

  if (!shouldShowBookingUnitsNote(unitsRequired)) {
    return null;
  }

  return (
    <div className="shrink-0 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 text-xs font-medium text-gray-700 text-center leading-snug">
      {t(listingUnitsCountTranslationKey(Boolean(listing.private)), {
        count: unitsRequired!,
      })}
    </div>
  );
};

export default StayListingUnitsCard;
