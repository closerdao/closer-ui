import { useRouter } from 'next/router';

import { useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingProgress from '../../../components/BookingProgress';
import BookingWallet from '../../../components/BookingWallet';
import Checkbox from '../../../components/Checkbox';
import CheckoutPayment from '../../../components/CheckoutPayment';
import CheckoutTotal from '../../../components/CheckoutTotal';
import Layout from '../../../components/Layout';
import PageError from '../../../components/PageError';

import PropTypes from 'prop-types';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useWallet } from '../../../hooks/useWallet';
import api from '../../../utils/api';
import { __, priceFormat } from '../../../utils/helpers';

const Checkout = ({ booking, listing, settings, error }) => {
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
  const accomodationCost = useTokens ? rentalToken : rentalFiat;
  const totalToPayInFiat = useTokens
    ? utilityFiat?.val
    : rentalFiat?.val + utilityFiat?.val;
  const totalToPayInToken = useTokens ? rentalToken?.val : 0;
  const listingName = listing?.name;
  const [hasAgreedToWalletDisclaimer, setWalletDisclaimer] = useState(false);
  const { balance } = useWallet();
  const isNotEnoughBalance = balance < totalToPayInToken;
  const { user, isAuthenticated } = useAuth();

  const router = useRouter();
  const goBack = () => {
    router.push(`/bookings/${booking._id}/summary`);
  };

  const { platform } = usePlatform();

  const switchToEUR = async () => {
    await platform.booking.patch(booking._id, { useTokens: false });
    router.push(`/bookings/${booking._id}/checkout`);
  };

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (!booking || !user || !listing || !settings) {
    return null;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <Layout>
      <div className="max-w-screen-sm mx-auto p-8">
        <BookingBackButton goBack={goBack} />
        <h1 className="step-title font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">💰</span>
          <span>{__('bookings_checkout_step_title')}</span>
        </h1>
        <BookingProgress />
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
            {totalToPayInToken > 0 && (
              <div className="mt-4">
                <BookingWallet
                  accomodationCost={accomodationCost.val}
                  switchToEUR={switchToEUR}
                />
                <Checkbox
                  checked={hasAgreedToWalletDisclaimer}
                  onChange={() =>
                    setWalletDisclaimer(!hasAgreedToWalletDisclaimer)
                  }
                  className="mt-8"
                  label={__('bookings_checkout_step_wallet_disclaimer')}
                />
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
    </Layout>
  );
};

Checkout.getInitialProps = async ({ query }) => {
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
      api.get('/bookings/settings'),
    ]);

    return { booking, listing, settings, error: null };
  } catch (err) {
    return {
      error: err.message,
      booking: null,
      listing: null,
      settings: null,
    };
  }
};

export default Checkout;

Checkout.propTypes = {
  booking: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    utilityFiat: PropTypes.shape({
      val: PropTypes.number.isRequired,
      cur: PropTypes.string.isRequired,
    }).isRequired,
    dailyRentalToken: PropTypes.shape({
      val: PropTypes.number.isRequired,
      cur: PropTypes.string.isRequired,
    }).isRequired,
    useTokens: PropTypes.bool.isRequired,
    rentalToken: PropTypes.shape({
      val: PropTypes.number.isRequired,
      cur: PropTypes.string.isRequired,
    }).isRequired,
    rentalFiat: PropTypes.shape({
      val: PropTypes.number.isRequired,
      cur: PropTypes.string.isRequired,
    }).isRequired,
    duration: PropTypes.number.isRequired,
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
  }).isRequired,
  listing: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }).isRequired,
  settings: PropTypes.shape({
    visitorsGuide: PropTypes.string,
  }),
  error: PropTypes.string,
};
