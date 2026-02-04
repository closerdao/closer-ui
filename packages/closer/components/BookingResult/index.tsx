import { useTranslations } from 'next-intl';

import dayjs from 'dayjs';

import Card from '../ui/Card';

import { Booking } from '../../types';
import { priceFormat } from '../../utils/helpers';

interface Props {
  booking: Booking | null;
  eventName: string;
  className?: string;
}

const BookingResult = ({ booking, eventName }: Props) => {
  const t = useTranslations();
  const {
    status,
    volunteerId,
    eventId,
    _id,
    start,
    end,
    adults,
    children,
    infants,
    total,
    useTokens,
    rentalToken,
  } = booking || {};

  if (!booking) return null;

  if (status !== 'paid' && status !== 'checked-in') return null;

  const guestCount = [adults ?? 0, children ?? 0, infants ?? 0].reduce(
    (sum, n) => sum + (typeof n === 'number' && n > 0 ? n : 0),
    0,
  );
  const hasGuests = guestCount > 0;

  return (
    <Card className="p-3 gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="card-feature shrink-0">{t('bookings_id')}</p>
        <p className="text-sm truncate">#{_id}</p>
      </div>
      {start && end && (
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <p className="card-feature">{t('bookings_checkin')}</p>
            <p className="text-sm">{dayjs(start).format('ddd, MMM D')}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="card-feature">{t('bookings_checkout')}</p>
            <p className="text-sm">{dayjs(end).format('ddd, MMM D')}</p>
          </div>
        </div>
      )}
      {eventId && eventName && (
        <div className="min-w-0">
          <p className="card-feature">{t('bookings_summary_step_dates_event')}</p>
          <p className="text-sm truncate">{eventName}</p>
        </div>
      )}
      {!eventId && (
        <div>
          <p className="card-feature">{t('bookings_checkout_step_accomodation')}</p>
          <p className="text-sm">
            {volunteerId
              ? t('bookings_summary_step_volunteer_opportunity')
              : t('bookings_checkout_step_accomodation')}
          </p>
        </div>
      )}
      <div className="flex gap-3">
        {hasGuests && (
          <div className="flex-1 min-w-0">
            <p className="card-feature">{t('bookings_summary_step_dates_number_of_guests')}</p>
            <p className="text-sm">
              {adults}
              {((children ?? 0) + (infants ?? 0) > 0) &&
                ` + ${(children ?? 0) + (infants ?? 0)}`}
            </p>
          </div>
        )}
        {useTokens && rentalToken?.val != null && rentalToken.val > 0 && (
          <div className="flex-1 min-w-0">
            <p className="card-feature">{t('bookings_tokens_lock')}</p>
            <p className="text-sm">{priceFormat(rentalToken.val, rentalToken.cur)}</p>
          </div>
        )}
        {total && (
          <div className="flex-1 min-w-0">
            <p className="card-feature">{t('bookings_total')}</p>
            <p className="text-sm font-medium">{priceFormat(total?.val, total?.cur)}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BookingResult;
