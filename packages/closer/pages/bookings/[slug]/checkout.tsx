import { useRouter } from 'next/router';

import { useContext, useMemo, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingWallet from '../../../components/BookingWallet';
import Checkbox from '../../../components/Checkbox';
import CheckoutPayment from '../../../components/CheckoutPayment';
import CheckoutTotal from '../../../components/CheckoutTotal';
import PageError from '../../../components/PageError';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import { ParsedUrlQuery } from 'querystring';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { WalletState } from '../../../contexts/wallet';
import { BaseBookingParams, Booking, Listing } from '../../../types';
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
}

const Checkout = ({ booking, listing, settings, error }: Props) => {
  const {
    _id: bookingId,
    utilityFiat,
    dailyRentalToken,
    useTokens,
    rentalToken,
    rentalFiat,
    duration,
    start,
    end,
  } = booking || {};


console.log('booking=', booking);

  const accomodationCost = useTokens ? rentalToken : rentalFiat;
  const totalToPayInFiat = useTokens
    ? utilityFiat?.val
    : rentalFiat?.val + utilityFiat?.val;
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

  if (!booking || !user || !listing || !settings) {
    return null;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} name={__('buttons_back')} />
        <h1 className="step-title font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">💰</span>
          <span>{__('bookings_checkout_step_title')}</span>
        </h1>
        <ProgressBar steps={BOOKING_STEPS} />
        <div className="mt-16 flex flex-col gap-16">
          <div>
            <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2">
              <span className="mr-1">🏡</span>
              <span>{__('bookings_checkout_step_accomodation')}</span>
            </h2>
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
            <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3">
              <span className="mr-1">🛠</span>
              <span>{__('bookings_checkout_step_utility_title')}</span>
            </h2>
            <div className="flex justify-between items-center mt-3">
              <p> {__('bookings_summary_step_utility_total')}</p>
              <p className="font-bold">{priceFormat(utilityFiat)}</p>
            </div>
            <p className="text-right text-xs">
              {__('bookings_summary_step_utility_description')}
            </p>
          </div>
          <CheckoutTotal totalToPayInFiat={totalToPayInFiat} />
          <CheckoutPayment
            bookingId={bookingId}
            buttonDisabled={
              useTokens && (!hasAgreedToWalletDisclaimer || isNotEnoughBalance)
            }
            useTokens={useTokens}
            totalToPayInFiat={totalToPayInFiat}
            dailyTokenValue={dailyRentalToken.val}
            startDate={start}
            endDate={end}
            totalNights={duration}
            user={user}
            settings={settings}
          />
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
        data: { results: listing },
      },
      {
        data: { results: settings },
      },
    ] = await Promise.all([
      api.get(`/listing/${booking.listing}`),
      // api.get('/bookings/settings'),
      api.get('/config/booking'),
    ]);

    return { booking, listing, settings, error: null };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      listing: null,
      settings: null,
    };
  }
};

export default Checkout;

