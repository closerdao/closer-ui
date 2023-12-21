import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingWallet from '../../../components/BookingWallet';
import CheckoutPayment from '../../../components/CheckoutPayment';
import CheckoutTotal from '../../../components/CheckoutTotal';
import PageError from '../../../components/PageError';
import RedeemCredits from '../../../components/RedeemCredits';
import { ErrorMessage } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Checkbox from '../../../components/ui/Checkbox';
import Heading from '../../../components/ui/Heading';
import HeadingRow from '../../../components/ui/HeadingRow';
import ProgressBar from '../../../components/ui/ProgressBar';
import Row from '../../../components/ui/Row';

import { NextApiRequest } from 'next';
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

const Checkout = ({ booking, listing, settings, error, event }: Props) => {
  const {
    utilityFiat,
    rentalToken,
    rentalFiat,
    eventFiat,
    useTokens,
    useCredits,
    start,
    dailyRentalToken,
    duration,
    ticketOption,
    eventPrice,
    total,
  } = booking || {};

  const { balanceAvailable } = useContext(WalletState);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [canApplyCredits, setCanApplyCredits] = useState(false);

  const isNotEnoughBalance = rentalToken?.val
    ? balanceAvailable < rentalToken.val
    : false;

  useEffect(() => {
    (async () => {
      try {
        const creditsBalance = (await api.get('/carrots/balance')).data
          .results as number;
        console.log('creditsBalance=', creditsBalance);
        const hasEnoughCredits = Boolean(
          rentalToken?.val &&
            creditsBalance &&
            creditsBalance >= (rentalToken?.val as number),
        );
        setCanApplyCredits(hasEnoughCredits);
      } catch (error) {
        setCanApplyCredits(false);
      }
    })();
  }, []);

  const listingName = listing?.name;

  const [hasAgreedToWalletDisclaimer, setWalletDisclaimer] = useState(false);
  const [updatedRentalFiat, setUpdatedRentalFiat] = useState(rentalFiat);
  const [updatedTotal, setUpdatedTotal] = useState(total);
  const [hasAppliedCredits, setHasAppliedCredits] = useState(false);
  const [creditsError, setCreditsError] = useState(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const goBack = () => {
    router.push(`/bookings/${booking._id}/summary`);
  };

  const handleFreeBooking = async () => {
    try {
      await api.post('/bookings/payment', {
        type: 'booking',
        ticketOption,
        total,
        _id: booking._id,
        email: user?.email,
        name: user?.screenname,
      });
    } catch (error) {
      setPaymentError(parseMessageFromError(error));
    }

    router.push(
      `/bookings/${booking._id}`,
    );
  };

  const applyCredits = async () => {
    try {
      setCreditsError(null);
      const res = await api.post(`/bookings/${booking._id}/update-payment`, {
        useCredits: true,
      });
      setUpdatedTotal(res.data.results.total);
      setUpdatedRentalFiat(res.data.results.rentalFiat);
      setHasAppliedCredits(true);
    } catch (error) {
      setCreditsError(parseMessageFromError(error));
    }
  };

  const { platform }: any = usePlatform();

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
        <Heading level={1} className="pb-4 mt-8">
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
                    value={`${priceFormat(eventFiat.val, eventFiat.cur)}`}
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
              {useTokens && rentalToken ? (
                <p className="font-bold">{priceFormat(rentalToken)}</p>
              ) : (
                <p className="font-bold">{priceFormat(updatedRentalFiat)}</p>
              )}
            </div>
            <p className="text-right text-xs">
              {__('bookings_checkout_step_accomodation_description')}
            </p>

            {process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true' &&
            canApplyCredits &&
            !useTokens ? (
              <RedeemCredits
                rentalFiat={rentalFiat}
                rentalToken={rentalToken || { val: 0, cur: 'TDF' }}
                applyCredits={applyCredits}
                hasAppliedCredits={hasAppliedCredits}
                creditsError={creditsError}
                className="my-12"
              />
            ) : null}

            {process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' &&
              rentalToken &&
              rentalToken.val > 0 &&
              useTokens && (
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
          <CheckoutTotal total={updatedTotal} />

          {booking.total.val > 0 ? (
            <CheckoutPayment
              bookingId={booking._id}
              buttonDisabled={
                useTokens &&
                (!hasAgreedToWalletDisclaimer || isNotEnoughBalance)
              }
              useTokens={useTokens}
              useCredits={useCredits}
              totalToPayInFiat={updatedTotal}
              dailyTokenValue={dailyRentalToken?.val || 0}
              startDate={start}
              totalNights={duration}
              user={user}
              settings={settings}
              eventId={event?._id}
            />
          ) : (
            <Button className="booking-btn" onClick={handleFreeBooking}>
              {user?.roles.includes('member') ? __('buttons_confirm_booking') : __('buttons_booking_request')}
            </Button>
          )}

          {paymentError && <ErrorMessage error={paymentError} />}
        </div>
      </div>
    </>
  );
};

Checkout.getInitialProps = async ({
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

    const [
      {
        data: { results: settings },
      },
      optionalEvent,
      optionalListing,
    ] = await Promise.all([
      api.get('/config/booking', {
        headers: req?.cookies?.access_token && {
          Authorization: `Bearer ${req?.cookies?.access_token}`,
        },
      }),
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
