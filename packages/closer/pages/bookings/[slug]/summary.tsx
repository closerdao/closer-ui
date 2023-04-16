import { useRouter } from 'next/router';

import { useEffect } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ui/ProgressBar';

import { ParsedUrlQuery } from 'querystring';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { BaseBookingParams, Booking, Listing } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

const bookingSummaryHardcoded = {
  status: 'open',
  listing: '609d72f9a460e712c32a1c4b',
  start: '2023-04-17T00:00:00.000Z',
  end: '2023-04-20T00:00:00.000Z',
  duration: 3,
  adults: 1,
  children: 0,
  infants: 0,
  pets: 0,
  useTokens: false,
  utilityFiat: {
    val: 30,
    cur: 'EUR',
  },
  rentalFiat: {
    val: 0,
    cur: 'EUR',
  },
  rentalToken: {
    val: 1.5,
    cur: 'TDF',
  },
  dailyUtilityFiat: {
    val: 10,
    cur: 'EUR',
  },
  dailyRentalToken: {
    val: 0.5,
    cur: 'TDF',
  },
  fields: [],
  visibleBy: [],
  createdBy: '641c2524f72ea12f5e9ab85d',
  updated: '2023-04-14T14:03:36.968Z',
  created: '2023-04-14T12:37:45.240Z',
  attributes: [],
  managedBy: [],
  _id: '64394919561dfa6edd9ace0c',

  commitment: '4 hours',
  event: 're:build global summit + Audio visual immersive dance ritual with @Alquem',
  ticketOption: '1 X full passs'
};

interface Props extends BaseBookingParams {
  listing: Listing;
  booking: Booking;
  error?: string;
}

const Summary = ({ booking, listing, error }: Props) => {
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
    console.log('booking=', booking);
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
        <BookingBackButton onClick={goBack} name={__('buttons_back')} />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">📑</span>
          <span>{__('bookings_summary_step_title')}</span>
        </h1>
        <ProgressBar steps={BOOKING_STEPS} />
        <div className="mt-16 flex flex-col gap-16">
          <SummaryDates
            totalGuests={adults}
            startDate={start}
            endDate={end}
            listingName={listing.name}
            commitment={booking.commitment}
            event={booking?.event}
            ticketOption={booking?.ticketOption}
          />
          <SummaryCosts
            utilityFiat={utilityFiat}
            useTokens={useTokens}
            accomodationCost={accomodationCost}
            totalToken={rentalToken.val}
            totalFiat={totalFiat}
          />

          <Button className="booking-btn" onClick={handleNext}>
            {__('buttons_checkout')}
          </Button>
        </div>
      </div>
    </>
  );
};

Summary.getInitialProps = async ({ query }: ParsedUrlQuery) => {
  try {
    // const {
    //   data: { results: booking },
    // } = await api.get(`/booking/${query.slug}`);

    const booking = bookingSummaryHardcoded;

    const {
      data: { results: listing },
    } = await api.get(`/listing/${booking.listing}`);
    return { booking, listing, error: null };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
    };
  }
};

export default Summary;
