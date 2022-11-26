import { useEffect } from 'react';

import { BookingBackButton } from '../../../components/BookingBackButton';
import { BookingProgress } from '../../../components/BookingProgress';
import Layout from '../../../components/Layout';
import { SummaryCosts } from '../../../components/SummaryCosts';
import { SummaryDates } from '../../../components/SummaryDates';

import { useBookingActions, useBookingState } from '../../../contexts/booking';
import { __ } from '../../../utils/helpers';

const Summary = () => {
  const { steps } = useBookingState();

  const dates = steps.find((step) => step.path === '/bookings/new/dates').data;
  const { startDate, endDate, guests, savedCurrency, useToken } = dates || {};
  const { listingName, accomodationCost, totalToPayInToken, totalToPayInFiat, utilityFiat } = steps.find(
    (step) => step.path === '/bookings/new/accomodation',
  ).data;

  const { goToNextStep, startNewBooking } = useBookingActions();

  useEffect(() => {
    if (!startDate || !listingName) {
      startNewBooking();
    }
  }, []);

  const handleNext = () => {
    goToNextStep();
  };

  if (!startDate || !guests || !listingName) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-screen-sm mx-auto p-8">
        <BookingBackButton />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">📑</span>
          <span>{__('bookings_summary_step_title')}</span>
        </h1>
        <BookingProgress />
        <div className="mt-16 flex flex-col gap-16">
          <SummaryDates
            totalGuests={guests?.totalGuests}
            startDate={startDate}
            endDate={endDate}
            listingName={listingName}
          />
          <SummaryCosts
            utilityFiat={utilityFiat}
            useToken={useToken}
            accomodationCost={accomodationCost}
            totalToPayInToken={totalToPayInToken}
            totalToPayInFiat={totalToPayInFiat}
          />
          <button className="booking-btn" onClick={handleNext}>
            {__('buttons_checkout')}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Summary;
