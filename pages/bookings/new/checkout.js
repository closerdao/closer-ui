import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { BookingBackButton } from '../../../components/BookingBackButton';
import { Checkbox } from '../../../components/Checkbox';
import CheckoutForm from '../../../components/CheckoutForm';
import { CheckoutTotal } from '../../../components/CheckoutTotal';
import Layout from '../../../components/Layout';
import { Progress } from '../../../components/Progress';
import { Wallet } from '../../../components/Wallet';

import config from '../../../config';
import { useAuth } from '../../../contexts/auth';
import { useBookingActions, useBookingState } from '../../../contexts/booking';
import { __, priceFormat } from '../../../utils/helpers';

const Checkout = () => {
  const { steps } = useBookingState();

  const dates = steps.find((step) => step.path === '/bookings/new/dates');
  const { startDate } = dates.data;
  const guests = steps.find(
    (step) => step.path === '/bookings/new/guests',
  ).data;
  const totalGuests = guests.totalGuests;
  const {
    bookingId,
    listingName,
    useToken,
    totalCostFiat,
    totalCostToken,
    totalCostUtility,
  } = steps.find((step) => step.path === '/bookings/new/accomodation').data;

  const router = useRouter();
  const currentStep = steps.find((step) => step.path === router.pathname);
  const currentStepIndex = steps.indexOf(currentStep);

  const { saveStepData, goToNextStep, startNewBooking } = useBookingActions();

  useEffect(() => {
    // check if any step has undefined data
    // redirect to the previous to that step if so
    const hasPreviousUndefinedStep =
      !startDate || !totalGuests || !listingName || !bookingId;
    if (hasPreviousUndefinedStep) {
      startNewBooking();
    }
  }, []);

  const stripe = loadStripe(config.STRIPE_PUB_KEY);
  const { user } = useAuth();
  const [hasAgreedToWalletDisclaimer, setWalletDisclaimer] = useState(false);

  if (!startDate || !totalGuests || !listingName) {
    return null;
  }

  const savedCurrency =
    totalCostToken && (useToken ? totalCostToken.cur : totalCostFiat.cur);
  const isTokenSelected = savedCurrency === totalCostToken.cur;
  const totalValue = isTokenSelected
    ? totalCostToken.val
    : totalCostFiat.val + totalCostUtility.val;

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto p-8">
        <BookingBackButton />
        <h1 className="step-title font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">💰</span>
          <span>{__('bookings_checkout_step_title')}</span>
        </h1>
        <Progress progress={currentStepIndex + 1} total={steps.length} />
        <div className="mt-16 flex flex-col gap-16">
          <div>
            <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2">
              <span className="mr-1">🏡</span>
              <span>{__('bookings_checkout_step_accomodation')}</span>
            </h2>
            <div className="flex justify-between items-center mt-3">
              <p> {listingName}</p>
              <p className="font-bold">
                {priceFormat({
                  val: totalValue,
                  cur: savedCurrency,
                })}
              </p>
            </div>
            <p className="text-right text-xs">
              {__('bookings_checkout_step_accomodation_description')}
            </p>
            <div className="mt-4">
              <Wallet />
              <Checkbox
                checked={hasAgreedToWalletDisclaimer}
                onChange={() =>
                  setWalletDisclaimer(!hasAgreedToWalletDisclaimer)
                }
                className="mt-8"
                label={__('bookings_checkout_step_wallet_disclaimer')}
              />
            </div>
          </div>
          <div>
            <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3">
              <span className="mr-1">🛠</span>
              <span>{__('bookings_checkout_step_utility_title')}</span>
            </h2>
            <div className="flex justify-between items-center mt-3">
              <p> {__('bookings_summary_step_utility_total')}</p>
              <p className="font-bold">{priceFormat(totalCostUtility)}</p>
            </div>
            <p className="text-right text-xs">
              {__('bookings_summary_step_utility_description')}
            </p>
          </div>
          <CheckoutTotal
            totalCostFiat={totalCostFiat}
            totalCostToken={totalCostToken}
            totalCostUtility={totalCostUtility}
            selectedCurrency={savedCurrency}
          />
          <div>
            <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3 flex items-center">
              <span>💲</span>
              <span>{__('bookings_checkout_step_payment_title')}</span>
            </h2>
            <Elements stripe={stripe}>
              <CheckoutForm
                type="booking"
                _id={bookingId}
                onSuccess={() => {
                  console.log('success payment');
                }}
                email={user.email}
                name={user.screenname}
                buttonText={__('bookings_checkout_step_payment_button')}
                submitButtonClassName="w-full btn uppercase mt-8"
                cardElementClassName="w-full h-14 rounded-2xl bg-background border border-neutral-200 px-4 py-4"
                buttonDisabled={false}
              />
            </Elements>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
