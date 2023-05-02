import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import Conditions from '../../../components/Conditions';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ui/ProgressBar';
import Heading from '../../../components/ui/Heading';

import { NextApiRequest } from 'next';
import { ParsedUrlQuery } from 'querystring';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { BaseBookingParams, Booking, Event, Listing } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __, getAccommodationCost } from '../../../utils/helpers';

interface Props extends BaseBookingParams {
  listing: Listing;
  booking: Booking;
  error?: string;
  event?: Event;
}

const Summary = ({ booking, listing, event, error }: Props) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [handleNextError, setHandleNextError] = useState<string | null>(null);
  const [hasComplied, setCompliance] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const onComply = (isComplete: boolean) => setCompliance(isComplete);
  const { VISITORS_GUIDE } = useConfig() || {};

  const {
    utilityFiat,
    rentalToken,
    rentalFiat,
    useTokens,
    start,
    end,
    adults,
    volunteerId,
    eventId,
    ticketOption,
    eventFiat,
    total,
  } = booking || {};

  const accomodationCost = getAccommodationCost(
    useTokens,
    rentalToken,
    rentalFiat,
    volunteerId,
  );

  useEffect(() => {
    if (booking?.status === 'pending' || booking?.status === 'paid') {
      router.push(`/bookings/${booking._id}`);
    }
  }, [booking?.status]);

  useEffect(() => {
    if (user) {
      setIsMember(user?.roles.includes('member'));
    }
  }, [user]);

  const handleNext = async () => {
    setHandleNextError(null);
    if (booking.status === 'confirmed') {
      return router.push(`/bookings/${booking._id}/checkout`);
    }
    try {
      const res = await api.post(`/bookings/${booking._id}/complete`, {});
      const status = res.data.results.status;

      if (status === 'confirmed') {
        router.push(`/bookings/${booking._id}/checkout`);
      } else if (status === 'pending') {
        router.push(`/bookings/${booking._id}/confirmation`);
      } else {
        console.log(`Could not redirect: ${status}`);
      }
    } catch (err: any) {
      setHandleNextError(err.response?.data?.error || err.message);
    }
  };

  const goBack = () => {
    router.push(`/bookings/${booking._id}/questions`);
  };

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
        <Heading
          level={1}
          className="pb-4 mt-8"
        >
          <span className="mr-4">📑</span>
          <span>{__('bookings_summary_step_title')}</span>
        </Heading>
        { handleNextError && (
          <div className="error-box">{handleNextError}</div>
        ) }
        <ProgressBar steps={BOOKING_STEPS} />
        {booking && (
          <div className="mt-16 flex flex-col gap-16">
            <SummaryDates
              isDayTicket={booking?.isDayTicket}
              totalGuests={adults}
              startDate={start}
              endDate={end}
              listingName={listing?.name}
              volunteerId={volunteerId}
              eventName={event?.name}
              ticketOption={ticketOption?.name}
            />
            <SummaryCosts
              utilityFiat={utilityFiat}
              useTokens={useTokens}
              accomodationCost={accomodationCost}
              totalToken={rentalToken?.val}
              totalFiat={total}
              eventCost={eventFiat?.val}
              eventDefaultCost={
                booking.ticketOption?.price
                  ? booking.ticketOption.price * booking.adults
                  : undefined
              }
              accomodationDefaultCost={listing?.fiatPrice?.val * booking.adults}
              volunteerId={volunteerId}
            />

            {volunteerId ? (
              <>
                <Conditions
                  setComply={onComply}
                  visitorsGuide={VISITORS_GUIDE}
                />
                <Button
                  isEnabled={hasComplied}
                  className="booking-btn"
                  onClick={handleNext}
                >
                  {__('apply_submit_button')}
                </Button>
              </>
            ) : eventId ? (
              <Button className="booking-btn" onClick={handleNext}>
                {__('buttons_checkout')}
              </Button>
            ) : user && isMember ? (
              <Button className="booking-btn" onClick={handleNext}>
                {__('buttons_checkout')}
              </Button>
            ) : (
              <Button className="booking-btn" onClick={handleNext}>
                {__('buttons_booking_request')}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

Summary.getInitialProps = async ({
  req,
  query,
}: {
  req: NextApiRequest;
  query: ParsedUrlQuery;
}) => {
  try {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${query.slug}`, {
      headers: req?.cookies?.access_token && {
        Authorization: `Bearer ${req?.cookies?.access_token}`,
      },
    });
    const [optionalEvent, optionalListing] = await Promise.all([
      booking.eventId &&
        api.get(`/event/${booking.eventId}`, {
          headers: req?.cookies?.access_token && {
            Authorization: `Bearer ${req?.cookies?.access_token}`,
          },
        }),
      booking.listing &&
        api.get(`/listing/${booking.listing}`, {
          headers: req?.cookies?.access_token && {
            Authorization: `Bearer ${req?.cookies?.access_token}`,
          },
        }),
    ]);
    const event = optionalEvent?.data?.results;
    const listing = optionalListing?.data?.results;

    return { booking, listing, event, error: null };
  } catch (err) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
    };
  }
};

export default Summary;
