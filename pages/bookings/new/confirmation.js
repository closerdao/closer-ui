import { useRouter } from 'next/router';

import { BookingBackButton } from '../../../components/BookingBackButton';
import { BookingProgress } from '../../../components/BookingProgress';
import Layout from '../../../components/Layout';

import { useBookingState } from '../../../contexts/booking';
import { __ } from '../../../utils/helpers';

const ConfirmationStep = () => {
  const { steps } = useBookingState();
  const paymentData = steps.find(
    (step) => step.path === '/bookings/new/checkout',
  ).data;
  const { fiatPayment, tokenPayment } = paymentData;
  const paymentRejected =
    (fiatPayment && fiatPayment.error) || (tokenPayment && tokenPayment.error);
  const { bookingId } = steps.find(
    (step) => step.path === '/bookings/new/accomodation',
  ).data;

  const router = useRouter();

  if (paymentRejected) {
    return (
      <Layout>
        <div className="max-w-screen-xl mx-auto p-8">
          <BookingBackButton />
          <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
            <span className="mr-1">❌</span>
            <span>{__('bookings_confirmation_step_error')}</span>
          </h1>
          <BookingProgress />
          <div className="mt-16 flex flex-col gap-4">
            {tokenPayment.error && (
              <>
                <h2>Token Payment rejected</h2>
                <p>{JSON.stringify(tokenPayment.error, null, 2)}</p>
              </>
            )}
            {fiatPayment.error && (
              <>
                <h2>Euro payment rejected</h2>
                <p>{JSON.stringify(fiatPayment.error, null, 2)}</p>
              </>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  const viewBooking = () => {
    router.push(`/bookings/${bookingId}`);
  };

  if (!bookingId) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto p-8">
        <BookingBackButton />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🎊</span>
          <span>{__('bookings_confirmation_step_success')}</span>
        </h1>
        <BookingProgress />
        <div className="mt-16 flex flex-col gap-16 flex-nowrap">
          <h2 className="text-2xl leading-10 font-normal">
            <span className="mr-1">🏡</span>
            <span>{__('bookings_confirmation_step_success_subtitle')}</span>
          </h2>
          <p>{__('bookings_confirmation_step_success_thankyou')}</p>
          <p className="font-black uppercase">
            {__(
              'bookings_confirmation_step_success_your_booking_id',
              bookingId,
            )}
          </p>
          <div>
            <p className="mb-4">
              {__('bookings_confirmation_step_success_what_happen_next')}
            </p>
            <p>
              {__('bookings_confirmation_step_success_when_payment_processed')}
            </p>
          </div>
          <button
            className="btn w-full uppercase"
            type="button"
            onClick={viewBooking}
          >
            {__('bookings_confirmation_step_success_button')}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ConfirmationStep;
