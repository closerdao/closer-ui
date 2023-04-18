import { useRouter } from 'next/router';

import { useContext, useMemo, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingWallet from '../../../components/BookingWallet';
import Checkbox from '../../../components/Checkbox';
import CheckoutPayment from '../../../components/CheckoutPayment';
import CheckoutTotal from '../../../components/CheckoutTotal';
import PageError from '../../../components/PageError';
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
import { BaseBookingParams, Booking, Listing } from '../../../types';
import { BookingSettings } from '../../../types/api';
import api from '../../../utils/api';
import { estimateNeededStakeForNewBooking } from '../../../utils/blockchain';
import { parseMessageFromError } from '../../../utils/common';
import { __, getPriceWithDiscount, priceFormat } from '../../../utils/helpers';

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
    event,
    volunteer
  } = booking || {};

  const eventCostWithDiscount = getPriceWithDiscount(
    Number(event?.eventPrice.val),
    event?.eventDiscount,
    event?.ticketOption.name,
  );

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

  console.log(
    'getPriceWithDiscount(Number(eventPrice.val), eventDiscount, ticketOption.name)',
    eventCostWithDiscount,
  );

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
            {event && event.eventPrice && (
              <>
                <Heading level={2} className="mb-8">
                  🎉 {__('bookings_checkout_ticket_cost')}
                </Heading>
                <div className="mb-10">
                  <Row
                    rowKey={event.ticketOption.name}
                    value={`${priceFormat(eventCostWithDiscount, event.eventPrice.cur)}`}
                  />
                </div>
              </>
            )}

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
    // const {
    //   data: { results: booking },
    // } = await api.get(`/booking/${query.slug}`);
    const booking = bookingHardcoded;
    const [
      {
        data: { results: listing },
      },
      {
        data: { results: settings },
      },
    ] = await Promise.all([
      api.get(`/listing/${booking.listing}`),
      api.get('/bookings/settings'),
      // api.get('/config/booking'),
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
