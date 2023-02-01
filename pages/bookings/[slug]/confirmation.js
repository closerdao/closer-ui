import { useRouter } from 'next/router';

import { useEffect } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingProgress from '../../../components/BookingProgress';
import Layout from '../../../components/Layout';
import PageError from '../../../components/PageError';

import { useBookingState } from '../../../contexts/booking';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const ConfirmationStep = ({ error, booking }) => {
  const {
    data: { checkout },
  } = useBookingState();
  const { fiatPayment, tokenPayment } = checkout || {};
  const paymentRejected =
    (fiatPayment && fiatPayment.error) || (tokenPayment && tokenPayment.error);

  const router = useRouter();
  const viewBooking = (id) => {
    router.push(`/bookings/${id}`);
  };
  const startNewBooking = () => {
    router.push('/bookings/create');
  };

  useEffect(() => {
    if (!booking._id) {
      startNewBooking();
    }
  }, [booking._id]);

  if (paymentRejected) {
    return (
      <Layout>
        <div className="max-w-screen-sm mx-auto p-8">
          <BookingBackButton
            action={startNewBooking}
            name={__('buttons_go_to_bookings')}
          />
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
  if (error) {
    return <PageError error={error} />;
  }

  if (!booking._id) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-screen-sm mx-auto p-8">
        <BookingBackButton url="/dashboard" />
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
              booking._id,
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
            className="booking-btn"
            type="button"
            onClick={() => viewBooking(booking._id)}
          >
            {__('bookings_confirmation_step_success_button')}
          </button>
        </div>
      </div>
    </Layout>
  );
};

ConfirmationStep.getInitialProps = async ({ query }) => {
  try {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${query.slug}`);

    return { booking, error: null };
  } catch (err) {
    return {
      error: err.message,
      booking: null,
      listing: null,
    };
  }
};

export default ConfirmationStep;
