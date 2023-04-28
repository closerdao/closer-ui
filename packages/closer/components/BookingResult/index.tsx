import { Booking } from '../../types';
import { __ } from '../../utils/helpers';

interface Props {
  booking: Booking;
  eventName: string;
  className?: string;
}

const index = ({
  booking: { status, volunteerId, eventId, _id },
  eventName,
}: Props) => {
  return (
    <div className="flex flex-col gap-16 flex-nowrap">
      {status === 'paid' && !volunteerId && !eventId && (
        <>
          <p className="font-bold text-3xl">{__('bookings_title_confirmed')}</p>
          <p>{__('subscriptions_success_thank_you_message')}</p>
          <p className="uppercase font-bold">
            {__('bookings_confirmation_step_success_your_booking_id')} {_id}
          </p>
          <p>
            {__('booking_status_booking_complete')}
          </p>
        </>
      )}

      {status === 'pending' && !volunteerId && !eventId && (
        <>
          <p className="font-bold text-3xl">{__('bookings_title_pending')}</p>
          <p>{__('subscriptions_success_thank_you_message')}</p>
          <p className="uppercase font-bold">
            {__('bookings_confirmation_step_success_your_booking_id')} {_id}
          </p>
          <p>{__('bookings_confirmation_step_success_what_happen_next')}</p>
          <p>
            {__('bookings_confirmation_step_success_when_payment_processed')}
          </p>
        </>
      )}

      {eventId && (
        <div>
          <p className="font-bold text-3xl mb-16">
            {__('bookings_confirmation_step_you_are_coming')} {eventName}
          </p>
          <p>{__('subscriptions_success_thank_you_message')}</p>
          <p className="my-14 uppercase font-bold">
            {__('bookings_confirmation_step_success_your_booking_id')} {_id}
          </p>
          <p>{__('bookings_event_confirmation_see_you_soon')}</p>
        </div>
      )}

      {volunteerId && (
        <>
          <p className="font-bold text-3xl">
            {__('bookings_title_application_sent')}
          </p>

          <p>{__('subscriptions_success_thank_you_message')}</p>
          <p className="font-black uppercase">
            {__('bookings_confirmation_step_success_your_application_id', _id)}
          </p>
          <div>
            <p className="mb-4">
              {__('bookings_confirmation_step_success_what_happen_next')}
            </p>
            <p>
              {__('bookings_confirmation_step_success_when_payment_processed')}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default index;
