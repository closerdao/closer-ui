import { useRouter } from 'next/router';

import { useContext, useMemo, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingWallet from '../../../components/BookingWallet';
import Checkbox from '../../../components/Checkbox';
import CheckoutPayment from '../../../components/CheckoutPayment';
import CheckoutTotal from '../../../components/CheckoutTotal';
import PageError from '../../../components/PageError';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';
import Row from '../../../components/ui/Row';

import dayjs from 'dayjs';
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
import { estimateNeededStakeForNewBooking } from '../../../utils/blockchain';
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
    end,
    dailyRentalToken,
    duration,
    volunteerId,
    ticketOption,
    eventPrice,
  } = booking || {};

  const accomodationCost = useTokens
    ? rentalToken.val
    : volunteerId
    ? 0
    : rentalFiat?.val;

  const { balanceAvailable, bookedDates } = useContext(WalletState);

  const totalToPayInToken = useMemo(() => {
    if (!useTokens || bookedDates === undefined) return null;
    return estimateNeededStakeForNewBooking({
      bookedDates,
      bookingYear: dayjs(start).year(),
      totalBookingTokenCost: rentalToken.val,
    });
  }, [bookedDates]);

  const isNotEnoughBalance = totalToPayInToken
    ? balanceAvailable < totalToPayInToken
    : false;
  const { user, isAuthenticated } = useAuth();

  const listingName = listing?.name;
  const [hasAgreedToWalletDisclaimer, setWalletDisclaimer] = useState(
    totalToPayInToken && !(totalToPayInToken > 0),
  );

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
        <h1 className="step-title font-normal pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">💰</span>
          <span>{__('bookings_checkout_step_title')}</span>
        </h1>
        <ProgressBar steps={BOOKING_STEPS} />
        <div className="mt-16 flex flex-col gap-16">
          <div>
            {eventPrice && (
              <div>
                <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2">
                  🎉 {__('bookings_checkout_ticket_cost')}
                </h2>
                <div className="mb-16 mt-4">
                  <Row
                    rowKey={ticketOption?.name}
                    value={`${priceFormat(eventPrice.val, eventPrice.cur)}`}
                  />
                </div>
              </div>
            )}

            <Heading className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2">
              <span className="mr-1">🏡</span>
              <span>{__('bookings_checkout_step_accomodation')}</span>
            </Heading>
            <div className="flex justify-between items-center mt-3">
              <p>{listingName}</p>
              <p className="font-bold">{priceFormat(accomodationCost)}</p>
            </div>
            <p className="text-right text-xs">
              {__('bookings_checkout_step_accomodation_description')}
            </p>

            {process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' && (
              <div className="mt-4">
                <BookingWallet
                  toPay={totalToPayInToken}
                  switchToEUR={switchToEUR}
                />
                {totalToPayInToken && totalToPayInToken > 0 && (
                  <Checkbox
                    checked={hasAgreedToWalletDisclaimer || false}
                    onChange={() =>
                      setWalletDisclaimer(!hasAgreedToWalletDisclaimer)
                    }
                    className="mt-8"
                    label={__('bookings_checkout_step_wallet_disclaimer')}
                  />
                )}
              </div>
            )}
          </div>
          <div>
            <Heading
              level={2}
              className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3"
            >
              <span className="mr-1">🛠</span>
              <span>{__('bookings_checkout_step_utility_title')}</span>
            </Heading>
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
              endDate={end}
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
