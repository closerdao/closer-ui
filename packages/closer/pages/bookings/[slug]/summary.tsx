import { useRouter } from 'next/router';

import { useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import Conditions from '../../../components/Conditions';
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
import {
  BaseBookingParams,
  Booking,
  BookingSettings,
  Listing,
} from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __, getPriceWithDiscount } from '../../../utils/helpers';

const bookingHardcoded = {
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
    val: 15,
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

  volunteer: { id: 'id', name: 'lets build', commitment: '4 hours' },
  // event: {
  //   id: 'id',
  //   name: 're:build global summit + Audio visual immersive dance ritual with @Alquem',
  //   ticketOption: {
  //     name: '1 X full passs',
  //     price: 11,
  //     cur: 'EUR',
  //     disclaimer: 'ice-cream',
  //   },
  //   eventPrice: { val: 11, cur: 'EUR' },
  //   eventDiscount: {
  //     val: 0,
  //     percent: 20,
  //     name: '1 X full passs',
  //     code: 'code',
  //     _id: 'id',
  //   },
  // },
};

interface Props extends BaseBookingParams {
  listing: Listing;
  booking: Booking;
  error?: string;
  settings: BookingSettings;
  eventName: string;
}

const Summary = ({ booking, listing, settings, error, eventName }: Props) => {
  const router = useRouter();
  const [hasComplied, setCompliance] = useState(false);
  const onComply = (isComplete: boolean) => setCompliance(isComplete);

  const {
    utilityFiat,
    rentalToken,
    rentalFiat,
    useTokens,
    start,
    end,
    adults,

    event,
    volunteer,
  } = booking || {};

  const eventCostWithDiscount = getPriceWithDiscount(
    Number(event?.eventPrice.val),
    event?.eventDiscount,
    event?.ticketOption.name,
  );

  // useEffect(() => {
  //   console.log('booking=', booking);
  //   if (booking?.status !== 'open') {
  //     router.push(`/bookings/${booking?._id}`);
  //   }
  // }, [booking?.status]);

  const accomodationCost = useTokens
    ? rentalToken
    : volunteer?.id
    ? 0
    : rentalFiat;

  const totalToPayInFiat = useTokens
    ? utilityFiat?.val
    : event?.eventPrice.val
    ? rentalFiat?.val + utilityFiat?.val + eventCostWithDiscount
    : volunteer?.id
    ? utilityFiat?.val
    : rentalFiat?.val + utilityFiat?.val;

  const handleNext = () => {
    if (volunteer) {
      router.push(`/bookings/${booking._id}/confirmation`);
    } else {
      router.push(`/bookings/${booking._id}/checkout`);
    }
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

  if (!listing || !booking) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} name={__('buttons_back')} />
        <h1 className="step-title pb-2 flex space-x-1 items-center mt-8">
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
            commitment={booking?.volunteer?.commitment}
            event={booking?.event?.name}
            ticketOption={booking?.event?.ticketOption.name}
          />
          <SummaryCosts
            utilityFiat={utilityFiat}
            useTokens={useTokens}
            accomodationCost={accomodationCost}
            totalToken={rentalToken.val}
            totalFiat={totalToPayInFiat}
            eventCost={eventCostWithDiscount}
          />
          {event && (
            <Button className="booking-btn" onClick={handleNext}>
              {__('buttons_checkout')}
            </Button>
          )}
          {volunteer && (
            <>
              <Conditions
                setComply={onComply}
                visitorsGuide={settings.visitorsGuide}
              />
              <Button className="booking-btn" onClick={handleNext}>
                {__('apply_submit_button')}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

Summary.getInitialProps = async ({ query }: { query: ParsedUrlQuery }) => {
  try {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${query.slug}`);
    console.log('booking=', booking);
    const [
      {
        data: { results: listing },
      },
      {
        data: { results: settings },
      },
      {
        data: { results: event },
      },
    ] = await Promise.all([
      api.get(`/listing/${booking.listing}`),
      api.get('/bookings/settings'),
      api.get(`/event/${booking.eventId}`),
    ]);
    return {
      booking,
      listing,
      settings,
      eventName: event.name,
      error: null,
    };
  } catch (err) {
    console.log('HERE', err.message, parseMessageFromError(err));
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
    };
  }
};

export default Summary;
