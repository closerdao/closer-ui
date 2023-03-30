import { useRouter } from 'next/router';

import { useEffect } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingProgress from '../../../components/BookingProgress';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';

import PropTypes from 'prop-types';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const Summary = ({ booking, listing, error }) => {
  const {
    utilityFiat,
    rentalToken,
    rentalFiat,
    useTokens,
    start,
    end,
    adults,
  } = booking || {};

  useEffect(() => {
    if (booking.status !== 'open') {
      router.push(`/bookings/${booking._id}`);
    }
  }, [booking.status]);

  const accomodationCost = useTokens ? rentalToken : rentalFiat;
  const totalFiat = useTokens
    ? utilityFiat.val
    : rentalFiat.val + utilityFiat.val;

  const router = useRouter();
  const handleNext = () => {
    router.push(`/bookings/${booking._id}/checkout`);
  };

  const goBack = () => {
    router.push(`/bookings/${booking._id}/questions`);
  };

  const { isAuthenticated } = useAuth();

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton action={goBack} name={__('buttons_back')} />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">📑</span>
          <span>{__('bookings_summary_step_title')}</span>
        </h1>
        <BookingProgress />
        <div className="mt-16 flex flex-col gap-16">
          <SummaryDates
            totalGuests={adults}
            startDate={start}
            endDate={end}
            listingName={listing.name}
          />
          <SummaryCosts
            utilityFiat={utilityFiat}
            useTokens={useTokens}
            accomodationCost={accomodationCost}
            totalToken={rentalToken.val}
            totalFiat={totalFiat}
          />
          <button className="booking-btn" onClick={handleNext}>
            {__('buttons_checkout')}
          </button>
        </div>
      </div>
    </>
  );
};

Summary.getInitialProps = async ({ query }) => {
  try {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${query.slug}`);
    const {
      data: { results: listing },
    } = await api.get(`/listing/${booking.listing}`);
    return { booking, listing, error: null };
  } catch (err) {
    return {
      error: err.message,
      booking: null,
      listing: null,
    };
  }
};

Summary.propTypes = {
  booking: PropTypes.shape({
    utilityFiat: PropTypes.shape({
      val: PropTypes.number,
      currency: PropTypes.string,
    }),
    rentalToken: PropTypes.shape({
      val: PropTypes.number,
      currency: PropTypes.string,
    }),
    rentalFiat: PropTypes.shape({
      val: PropTypes.number,
      currency: PropTypes.string,
    }),
    useTokens: PropTypes.bool,
    start: PropTypes.string,
    end: PropTypes.string,
    guests: PropTypes.number,
    listing: PropTypes.string,
  }),
  listing: PropTypes.shape({
    name: PropTypes.string,
  }),
};

export default Summary;
