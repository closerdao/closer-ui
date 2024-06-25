import { useTranslations } from 'next-intl';

import { Booking } from '../../types';

interface Props {
  booking: Booking | null;
  eventName: string;
  className?: string;
}

const BookingResult = ({ booking, eventName }: Props) => {
  const t = useTranslations();
  const { status, volunteerId, eventId, _id } = booking || {};

  if (!booking) return null;

  return (
    <div className="flex flex-col gap-16 flex-nowrap">
      {status === 'paid' && !volunteerId && !eventId && (
        <>
          <p className="font-bold text-3xl">{t('bookings_title_confirmed')}</p>
          <p>{t('subscriptions_success_thank_you_message')}</p>
          <p className="uppercase font-bold">
            {t('bookings_confirmation_step_success_your_booking_id')} {_id}
          </p>
          <p>{t('booking_status_booking_complete')}</p>
        </>
      )}

      {status === 'pending' && !volunteerId && !eventId && (
        <>
          <p className="font-bold text-3xl">{t('bookings_title_pending')}</p>
          <p>{t('subscriptions_success_thank_you_message')}</p>
          <p className="uppercase font-bold">
            {t('bookings_confirmation_step_success_your_booking_id')} {_id}
          </p>
          <p>{t('bookings_confirmation_step_success_what_happen_next')}</p>
          <p>
            {t('bookings_confirmation_step_success_when_payment_processed')}
          </p>
        </>
      )}

      {eventId && (
        <div>
          <p className="font-bold text-3xl mb-16">
            {t('bookings_confirmation_step_you_are_coming')} {eventName}
          </p>
          <p>{t('subscriptions_success_thank_you_message')}</p>
          <p className="my-14 uppercase font-bold">
            {t('bookings_confirmation_step_success_your_booking_id')} {_id}
          </p>
          <p>{t('bookings_event_confirmation_see_you_soon')}</p>
        </div>
      )}

      {volunteerId && (
        <>
          <p className="font-bold text-3xl">
            {t('bookings_title_application_sent')}
          </p>

          <p>{t('subscriptions_success_thank_you_message')}</p>
          <p className="font-black uppercase">
            {t('bookings_confirmation_step_success_your_application_id')}
          </p>
          <div>
            <p className="mb-4">
              {t('bookings_confirmation_step_success_what_happen_next')}
            </p>
            <p>
              {t('bookings_confirmation_step_success_when_payment_processed')}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BookingResult;
