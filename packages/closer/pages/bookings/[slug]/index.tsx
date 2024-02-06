import Head from 'next/head';

import { useState } from 'react';

import BookingRequestButtons from '../../../components/BookingRequestButtons';
import PageError from '../../../components/PageError';
import SummaryCosts from '../../../components/SummaryCosts';
import SummaryDates from '../../../components/SummaryDates';
import UserInfoButton from '../../../components/UserInfoButton';
import Heading from '../../../components/ui/Heading';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { NextApiRequest } from 'next';
import { ParsedUrlQuery } from 'querystring';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { STATUS_COLOR } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import { usePlatform } from '../../../contexts/platform';
import {
  Booking,
  BookingConfig,
  Event,
  Listing,
  VolunteerOpportunity,
} from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

dayjs.extend(LocalizedFormat);

interface Props {
  booking: Booking;
  error?: string;
  listing: Listing;
  event: Event;
  volunteer: VolunteerOpportunity;
  bookingCreatedBy: User;
  bookingConfig: BookingConfig | null;
}

const BookingPage = ({
  booking,
  listing,
  event,
  volunteer,
  error,
  bookingCreatedBy,
  bookingConfig,
}: Props) => {
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const { platform }: any = usePlatform();
  const { isAuthenticated, user } = useAuth();
  const isSpaceHost = user?.roles.includes('space-host');
  const userInfo = bookingCreatedBy && {
    name: bookingCreatedBy.screenname,
    photo: bookingCreatedBy.photo,
  };

  const [status, setStatus] = useState(booking?.status);

  const {
    utilityFiat,
    rentalToken,
    rentalFiat,
    useTokens,
    children,
    pets,
    infants,
    start: bookingStart,
    end: bookingEnd,
    adults,
    volunteerId,
    ticketOption,
    eventFiat,
    total,
    doesNeedSeparateBeds,
    doesNeedPickup,
    createdBy,
    _id,
    created,
  } = booking || {};

  const refetchStatus = async () => {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${_id}`);

    setStatus(booking.status);
  };

  const createdFormatted = dayjs(created).format('DD/MM/YYYY - HH:mm:A');
  const isNotPaid = status !== 'paid';

  const confirmBooking = async () => {
    await platform.bookings.confirm(_id);
    await refetchStatus();
  };
  const rejectBooking = async () => {
    await platform.bookings.reject(_id);
    await refetchStatus();
  };

  if (
    !booking ||
    !isBookingEnabled ||
    (user?._id !== booking.createdBy && !isSpaceHost)
  ) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <Head>
        <title>{`${__('bookings_summary_step_dates_title')}`}</title>
        <meta
          name="description"
          content={`${__('bookings_summary_step_dates_title')}`}
        />
        <meta property="og:type" content="booking" />
      </Head>
      <main className="main-content max-w-prose booking flex flex-col gap-4">
        <Heading className="mb-4">
          {__(`bookings_title_${booking.status}`)}
        </Heading>

        <section className="flex flex-col gap-2 mb-6">
          <div className="text-sm text-disabled">
            <p>{createdFormatted}</p>
            <p>
              {__('bookings_id')} <b>{booking._id}</b>
            </p>
          </div>
          <p
            className={`bg-${STATUS_COLOR[status]}  mt-2 
            capitalize opacity-100 text-base p-1 text-white text-center rounded-md`}
          >
            {status}
          </p>
          {isSpaceHost && (
            <UserInfoButton userInfo={userInfo} createdBy={createdBy} />
          )}
        </section>

        <section className="flex flex-col gap-12">
          <SummaryDates
            isDayTicket={booking?.isDayTicket}
            totalGuests={adults}
            kids={children}
            infants={infants}
            pets={pets}
            startDate={bookingStart}
            endDate={bookingEnd}
            listingName={listing?.name}
            listingUrl={listing?.slug}
            volunteerId={volunteerId}
            eventName={event?.name}
            volunteerName={volunteer?.name}
            ticketOption={ticketOption?.name}
            doesNeedPickup={doesNeedPickup}
            doesNeedSeparateBeds={doesNeedSeparateBeds}
          />
          <SummaryCosts
            utilityFiat={utilityFiat}
            useTokens={useTokens}
            accomodationCost={useTokens ? rentalToken : rentalFiat}
            totalToken={rentalToken}
            totalFiat={total}
            eventCost={eventFiat}
            eventDefaultCost={
              ticketOption?.price ? ticketOption.price * adults : undefined
            }
            accomodationDefaultCost={listing?.fiatPrice?.val * adults}
            volunteerId={volunteerId}
            isNotPaid={isNotPaid}
          />
        </section>
        <section>
          <BookingRequestButtons
            _id={_id}
            status={status}
            createdBy={createdBy}
            end={bookingEnd}
            start={bookingStart}
            confirmBooking={confirmBooking}
            rejectBooking={rejectBooking}
          />
        </section>

        {booking.status === 'confirmed' && (
          <section className="mt-3">{__('bookings_confirmation')}</section>
        )}
      </main>
    </>
  );
};

BookingPage.getInitialProps = async ({
  req,
  query,
}: {
  req: NextApiRequest;
  query: ParsedUrlQuery;
}) => {
  try {
    const [bookingRes, bookingConfigRes] = await Promise.all([
      api
        .get(`/booking/${query.slug}`, {
          headers: req?.cookies?.access_token && {
            Authorization: `Bearer ${req?.cookies?.access_token}`,
          },
        })
        .catch(() => {
          return null;
        }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
    ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = bookingConfigRes?.data?.results?.value;

    const [optionalEvent, optionalListing, optionalVolunteer] =
      await Promise.all([
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
        booking.volunteerId &&
          api.get(`/volunteer/${booking.volunteerId}`, {
            headers: req?.cookies?.access_token && {
              Authorization: `Bearer ${req?.cookies?.access_token}`,
            },
          }),
      ]);
    const event = optionalEvent?.data?.results;
    const listing = optionalListing?.data?.results;
    const volunteer = optionalVolunteer?.data?.results;

    let bookingCreatedBy = null;
    try {
      const optionalCreatedBy =
        booking.createdBy &&
        api.get(`/user/${booking.createdBy}`, {
          headers: req?.cookies?.access_token && {
            Authorization: `Bearer ${req?.cookies?.access_token}`,
          },
        });
      bookingCreatedBy = optionalCreatedBy?.data?.results;
    } catch (error) {}

    return {
      booking,
      listing,
      event,
      volunteer,
      error: null,
      bookingCreatedBy,
      bookingConfig,
    };
  } catch (err: any) {
    console.log('Error', err.message);

    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
      event: null,
      volunteer: null,
      createdBy: null,
      bookingConfig: null,
    };
  }
};

export default BookingPage;
