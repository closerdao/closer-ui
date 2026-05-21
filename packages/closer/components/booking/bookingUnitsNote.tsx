import { useTranslations } from 'next-intl';

import {
  bookingGuestCount,
  listingUnitsCountTranslationKey,
  shouldShowBookingUnitsNote,
} from '../../utils/listingUnits.helpers';

interface BookingUnitsNoteProps {
  numberOfUnits?: number | null;
  listingPrivate?: boolean;
  adults?: number | null;
  childCount?: number | null;
  className?: string;
}

const BookingUnitsNote = ({
  numberOfUnits,
  listingPrivate = false,
  adults,
  childCount,
  className = 'text-xs text-gray-600',
}: BookingUnitsNoteProps) => {
  const t = useTranslations();

  if (!shouldShowBookingUnitsNote(numberOfUnits)) {
    return null;
  }

  const count = Number(numberOfUnits);
  const guests = bookingGuestCount(adults, childCount);
  const unitSummary = t(listingUnitsCountTranslationKey(listingPrivate), {
    count,
  });

  return (
    <p className={className}>
      {t('booking_units_summary_note', {
        unitSummary,
        guests,
      })}
    </p>
  );
};

export default BookingUnitsNote;
