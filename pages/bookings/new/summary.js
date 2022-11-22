import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { BookingBackButton } from '../../../components/BookingBackButton';
import Layout from '../../../components/Layout';
import { Progress } from '../../../components/Progress';
import { SummaryCosts } from '../../../components/SummaryCosts';
import { SummaryDates } from '../../../components/SummaryDates';

import { useBookingActions, useBookingState } from '../../../contexts/booking';
import { __ } from '../../../utils/helpers';

const Summary = () => {
  const { steps } = useBookingState();

  const dates = steps.find((step) => step.path === '/bookings/new/dates').data;
  const { startDate, endDate } = dates;
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

  const router = useRouter();
  const currentStep = steps.find((step) => step.path === router.pathname);
  const currentStepIndex = steps.indexOf(currentStep);

  const { goToNextStep, startNewBooking } = useBookingActions();

  useEffect(() => {
    const hasUndefinedDataFromPreviousSteps =
      !startDate || !totalGuests || !listingName;
    if (hasUndefinedDataFromPreviousSteps) {
      startNewBooking();
    }
  }, []);

  const handleNext = () => {
    goToNextStep();
  };

  if (!startDate || !totalGuests || !listingName) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto p-8">
        <BookingBackButton />
        <h1 className="font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">📑</span>
          <span>{__('bookings_summary_step_title')}</span>
        </h1>
        <Progress progress={currentStepIndex + 1} total={steps.length} />
        <div className="mt-16 flex flex-col gap-16">
          <SummaryDates
            totalGuests={totalGuests}
            startDate={startDate}
            endDate={endDate}
            listingName={listingName}
          />
          <SummaryCosts
            selectedCurrency={savedCurrency}
            listingName={listingName}
            totalCostFiat={totalCostFiat}
            totalCostToken={totalCostToken}
            totalCostUtility={totalCostUtility}
          />
          <button className="w-full btn uppercase" onClick={handleNext}>
            {__('buttons_checkout')}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Summary;
