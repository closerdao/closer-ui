import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingProgress from '../../../components/BookingProgress';
import Checkbox from '../../../components/Checkbox';
import CheckoutPayment from '../../../components/CheckoutPayment';
import CheckoutTotal from '../../../components/CheckoutTotal';
import Layout from '../../../components/Layout';
import Wallet from '../../../components/Wallet';

import { useBookingActions, useBookingState } from '../../../contexts/booking';
import { useWallet } from '../../../hooks/useWallet';
import { __, priceFormat } from '../../../utils/helpers';

const Checkout = () => {
  const { steps } = useBookingState();
  const { startDate, endDate, totalNights, useToken } = steps.find(
    (step) => step.path === '/bookings/new/dates',
  ).data;

  const {
    bookingId,
    listingName,
    utilityFiat,
    dailyRentalToken,
    accomodationCost,
    totalToPayInToken,
    totalToPayInFiat,
  } = steps.find((step) => step.path === '/bookings/new/accomodation').data;

  const { startNewBooking, goBack } = useBookingActions();
  useEffect(() => {
    if (!bookingId || !listingName) {
      startNewBooking();
    }
  }, []);

  const [hasAgreedToWalletDisclaimer, setWalletDisclaimer] = useState(false);
  const { balance } = useWallet();
  const isNotEnoughBalance = balance < totalToPayInToken;

  if (!listingName) {
    return null;
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
              <p> {listingName}</p>
              <p className="font-bold">{priceFormat(accomodationCost)}</p>
            </div>
            <p className="text-right text-xs">
              {__('bookings_checkout_step_accomodation_description')}
            </p>
            {totalToPayInToken > 0 && (
              <div className="mt-4">
                <Wallet />
                {isNotEnoughBalance && (
                  <p className="text-red-500 mt-2">
                    {__(
                      'bookings_checkout_step_accomodation_not_enough_balance',
                    )}
                  </p>
                )}
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
              useToken && (!hasAgreedToWalletDisclaimer || isNotEnoughBalance)
            }
            useToken={useToken}
            totalToPayInFiat={totalToPayInFiat}
            dailyTokenValue={dailyRentalToken.val}
            startDate={startDate}
            endDate={endDate}
            totalNights={totalNights}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
