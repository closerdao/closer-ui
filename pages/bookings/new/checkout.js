import { useRouter } from 'next/router';

import { useState } from 'react';

import { BookingBackButton } from '../../../components/BookingBackButton';
import { CheckoutAccomodation } from '../../../components/CheckoutAccomodation';
import { CheckoutDates } from '../../../components/CheckoutDates';
import Layout from '../../../components/Layout';
import { Progress } from '../../../components/Progress';

import { useBookingActions, useBookingState } from '../../../contexts/booking';
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

  const [selectedCurrency, selectCurrency] = useState(
    useToken ? totalCostToken.cur : totalCostFiat.cur,
  );

  const { pathname } = useRouter();
  const currentStep = steps.find((step) => step.path === pathname);
  const currentStepIndex = steps.indexOf(currentStep);

  const { saveStepData, goToNextStep, startNewBooking } = useBookingActions();

  const [isLoading, setIsLoading] = useState(false);

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
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
