import { useTranslations } from 'next-intl';

import Heading from '../ui/Heading';

import { Booking } from '../../types';

interface Props {
  booking: Booking | null;
  eventName: string;
  className?: string;
}

const BookingResult = ({ booking, eventName }: Props) => {
  const t = useTranslations();
  const { status, volunteerId, eventId, _id, volunteerInfo } = booking || {};

  if (!booking) return null;

  return (
    <div className="flex flex-col gap-16 flex-nowrap">
      {status === 'paid' && (volunteerId || volunteerInfo) && (
        <>
          <Heading className="pb-4 mt-8">
            <span className="mr-2">🎊</span>
            {t('bookings_title_confirmed')}
          </Heading>
          <p>{t('subscriptions_success_thank_you_message')}</p>
          <p className="uppercase font-bold">
            {t('bookings_confirmation_step_success_your_booking_id')} {_id}
          </p>
          <p>{t('booking_status_booking_complete')}</p>
        </>
      )}
      {status === 'paid' && !volunteerId && !volunteerInfo && !eventId && (
        <>
          <Heading className="pb-4 mt-8">
            <span className="mr-2">🎊</span>
            {t('bookings_title_confirmed')}
          </Heading>
          <p>{t('subscriptions_success_thank_you_message')}</p>
          <p className="uppercase font-bold">
            {t('bookings_confirmation_step_success_your_booking_id')} {_id}
          </p>
          <p>{t('booking_status_booking_complete')}</p>
        </>
      )}

      {status === 'pending' && !volunteerId && !volunteerInfo && !eventId && (
        <>
          <Heading className="pb-4 mt-8">
            <span className="mr-2">⏳</span>
            {t('bookings_title_pending')}
          </Heading>
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
          <Heading className="pb-4 mt-8">
            {t('bookings_confirmation_step_you_are_coming')} {eventName}
          </Heading>
          <p>{t('subscriptions_success_thank_you_message')}</p>
          <p className="my-14 uppercase font-bold">
            {t('bookings_confirmation_step_success_your_booking_id')} {_id}
          </p>
          <p>{t('bookings_event_confirmation_see_you_soon')}</p>
        </div>
      )}

      {status !== 'paid' && (volunteerId || volunteerInfo) && (
        <>
          <Heading className="pb-4 mt-8">
            {volunteerInfo?.bookingType === 'volunteer'
              ? t('bookings_title_application_sent')
              : t('bookings_title_residency_application_sent')}
          </Heading>

          <p>{t('subscriptions_success_thank_you_message')}</p>
          <p className="font-black uppercase">
            {t('bookings_confirmation_step_success_your_application_id')} {_id}
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
