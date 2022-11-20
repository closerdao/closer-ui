import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { BookingBackButton } from '../../../components/BookingBackButton';
import { CheckoutAccomodation } from '../../../components/CheckoutAccomodation';
import { CheckoutDates } from '../../../components/CheckoutDates';
import { CheckoutTotal } from '../../../components/CheckoutTotal';
import { CheckoutUtility } from '../../../components/CheckoutUtility';
import Layout from '../../../components/Layout';
import { Progress } from '../../../components/Progress';

import { useBookingActions, useBookingState } from '../../../contexts/booking';
import { CURRENCIES } from '../../../utils/const';
import { __ } from '../../../utils/helpers';

const Checkout = () => {
  const { steps } = useBookingState();

  const dates = steps.find((step) => step.path === '/bookings/new/dates');
  const { startDate, endDate, totalNights } = dates.data;
  const guests = steps.find(
    (step) => step.path === '/bookings/new/guests',
  ).data;
  const totalGuests = guests.totalGuests;
  const {
    listingName,
    useToken,
    totalCostFiat,
    totalCostToken,
    totalCostUtility,
  } = steps.find((step) => step.path === '/bookings/new/accomodation').data;

  const savedCurrency =
    totalCostToken && (useToken ? totalCostToken.cur : totalCostFiat.cur);
  const [selectedCurrency, selectCurrency] = useState(
    savedCurrency || CURRENCIES[1],
  );

  const router = useRouter();
  const currentStep = steps.find((step) => step.path === router.pathname);
  const currentStepIndex = steps.indexOf(currentStep);

  const { saveStepData, goToNextStep, startNewBooking } = useBookingActions();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // check if any step has undefined data
    // redirect to the previous to that step if so
    const hasPreviousUndefinedStep = !startDate || !totalGuests || !listingName;
    if (hasPreviousUndefinedStep) {
      startNewBooking();
    }
  }, []);

  if (!startDate || !totalGuests || !listingName) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto p-8">
        <BookingBackButton />
        <h1 className="font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">💰</span>
          <span>{__('bookings_checkout_step_title')}</span>
        </h1>
        <Progress progress={currentStepIndex + 1} total={steps.length} />
        <div className="mt-16 flex flex-col gap-16">
          <CheckoutDates
            startDate={startDate}
            endDate={endDate}
            totalGuests={totalGuests}
            totalNights={totalNights}
          />
          <CheckoutAccomodation
            selectedCurrency={selectedCurrency}
            selectCurrency={selectCurrency}
            listingName={listingName}
            totalCostFiat={totalCostFiat}
            totalCostToken={totalCostToken}
          />
          <CheckoutUtility totalCostUtility={totalCostUtility} />
          <CheckoutTotal
            totalCostFiat={totalCostFiat}
            totalCostToken={totalCostToken}
            totalCostUtility={totalCostUtility}
            selectedCurrency={selectedCurrency}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
