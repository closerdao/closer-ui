import { useRouter } from 'next/router';

import { useContext, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingWallet from '../../../components/BookingWallet';
import CheckoutPayment from '../../../components/CheckoutPayment';
import CheckoutTotal from '../../../components/CheckoutTotal';
import PageError from '../../../components/PageError';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Checkbox from '../../../components/ui/Checkbox';
import HeadingRow from '../../../components/ui/HeadingRow';
import ProgressBar from '../../../components/ui/ProgressBar';
import Row from '../../../components/ui/Row';

import { ParsedUrlQuery } from 'querystring';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { WalletState } from '../../../contexts/wallet';
import { BaseBookingParams, Booking, Event, Listing } from '../../../types';
import { BookingSettings } from '../../../types/api';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __, priceFormat } from '../../../utils/helpers';

interface Props extends BaseBookingParams {
  listing: Listing;
  booking: Booking;
  settings: BookingSettings;
  error?: string;
  event?: Event;
}

const Checkout = ({ booking, listing, settings, error }: Props) => {
  const {
    utilityFiat,
    rentalToken,
    rentalFiat,
    useTokens,
    start,
    dailyRentalToken,
    duration,
    ticketOption,
    eventPrice,
  } = booking || {};

  const { balanceAvailable } = useContext(WalletState);

  const isNotEnoughBalance = rentalToken?.val
    ? balanceAvailable < rentalToken.val
    : false;
  const { user, isAuthenticated } = useAuth();

  const listingName = listing?.name;
  const [hasAgreedToWalletDisclaimer, setWalletDisclaimer] = useState(false);

  const router = useRouter();
  const goBack = () => {
    router.push(`/bookings/${booking._id}/summary`);
  };
  const handleNext = () => {
    router.push(`/bookings/${booking._id}/confirmation`);
  };

  const { platform }: any = usePlatform();
  // TODO: add types to platform

  const switchToEUR = async () => {
    // TODO - this should not be possible - should enable a custom endpoint to change the booking type
    await platform.booking.patch(booking._id, { useTokens: false });
    router.push(`/bookings/${booking._id}/checkout`);
  };

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} name={__('buttons_back')} />
        <Heading
          level={1}
          className="pb-4 mt-8"
        >
          <span className="mr-1">💰</span>
          <span>{__('bookings_checkout_step_title')}</span>
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />
        <div className="mt-16 flex flex-col gap-16">
          <div>
            {eventPrice && (
              <div>
                <HeadingRow>
                  <span className="mr-2">🎉</span>
                  <span>{__('bookings_checkout_ticket_cost')}</span>
                </HeadingRow>
                <div className="mb-16 mt-4">
                  <Row
                    rowKey={ticketOption?.name}
                    value={`${priceFormat(eventPrice.val, eventPrice.cur)}`}
                  />
                </div>
              </div>
            )}

            <HeadingRow>
              <span className="mr-2">🏡</span>
              <span>{__('bookings_checkout_step_accomodation')}</span>
            </HeadingRow>
            <div className="flex justify-between items-center mt-3">
              <p>{listingName}</p>
              { useTokens ?
                <p className="font-bold">{priceFormat(rentalToken)}</p>:
                <p className="font-bold">{priceFormat(rentalFiat)}</p>
              }
            </div>
            <p className="text-right text-xs">
              {__('bookings_checkout_step_accomodation_description')}
            </p>

            {process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' && rentalToken && rentalToken.val > 0 &&  (
              <div className="mt-4">
                <BookingWallet
                  toPay={rentalToken.val}
                  switchToEUR={switchToEUR}
                />
                <Checkbox
                  isChecked={hasAgreedToWalletDisclaimer}
                  onChange={() =>
                    setWalletDisclaimer(!hasAgreedToWalletDisclaimer)
                  } 
                  className="mt-8"
                >
                  {__('bookings_checkout_step_wallet_disclaimer')}
                </Checkbox>
              </div>
            )}
          </div>
          <div>
            <HeadingRow>
              <span className="mr-2">🛠</span>
              <span>{__('bookings_checkout_step_utility_title')}</span>
            </HeadingRow>
            <div className="flex justify-between items-center mt-3">
              <p> {__('bookings_summary_step_utility_total')}</p>
              <p className="font-bold">{priceFormat(utilityFiat)}</p>
            </div>
            <p className="text-right text-xs">
              {__('bookings_summary_step_utility_description')}
            </p>
          </div>
          <CheckoutTotal total={booking.total} />
          {booking.total.val > 0 ? (
            <CheckoutPayment
              bookingId={booking._id}
              buttonDisabled={
                useTokens &&
                (!hasAgreedToWalletDisclaimer || isNotEnoughBalance)
              }
              useTokens={useTokens}
              totalToPayInFiat={booking.total as any}
              dailyTokenValue={dailyRentalToken?.val}
              startDate={start}
              totalNights={duration}
              user={user}
              settings={settings}
            />
          ) : (
            <Button className="booking-btn" onClick={handleNext}>
              {__('buttons_booking_request')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

Checkout.getInitialProps = async ({ query }: { query: ParsedUrlQuery }) => {
  try {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${query.slug}`);

    const [
      {
        data: { results: settings },
      },
      optionalEvent,
      optionalListing,
    ] = await Promise.all([
      api.get('/config/booking'),
      booking.eventId && api.get(`/event/${booking.eventId}`),
      booking.listing && api.get(`/listing/${booking.listing}`),
    ]);
    const event = optionalEvent?.data?.results;
    const listing = optionalListing?.data?.results;

    return { booking, listing, settings, event, error: null };
  } catch (err) {
    console.log(err);
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
      settings: null,
    };
  }
};

export default Checkout;
