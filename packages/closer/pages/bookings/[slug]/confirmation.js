import { useRouter } from 'next/router';

import { useEffect } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingProgress from '../../../components/BookingProgress';
import PageError from '../../../components/PageError';

import PageNotFound from '../../404';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';
import Heading from '../../../components/ui/Heading';

const ConfirmationStep = ({ error, booking }) => {
  const router = useRouter();

  useEffect(() => {
    if (!booking._id) {
      startNewBooking();
    }
  }, [booking._id]);

  const viewBooking = (id) => {
    router.push(`/bookings/${id}`);
  };
  const startNewBooking = () => {
    router.push('/bookings/create');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  if (!booking._id) {
    return null;
  }

  return (
    <>
      <div className="max-w-screen-sm mx-auto p-8">
        <BookingBackButton url="/" />
         <Heading className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🎊</span>
          <span>{__('bookings_confirmation_step_success')}</span>
        </Heading>
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
    </>
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
