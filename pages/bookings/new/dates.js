import { useRouter } from 'next/router';

import { useState } from 'react';

import { BookingBackButton } from '../../../components/BookingBackButton';
import { BookingDates } from '../../../components/BookingDates';
import { BookingGuests } from '../../../components/BookingGuests';
import { BookingProgress } from '../../../components/BookingProgress';
import { CurrencySwitch } from '../../../components/CurrencySwitch';
import Layout from '../../../components/Layout';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import blockchainConfig from '../../../config_blockchain.js';
import { useAuth } from '../../../contexts/auth';
import { useBookingActions, useBookingState } from '../../../contexts/booking';
import { CURRENCIES, DEFAULT_CURRENCY } from '../../../utils/const';
import { __ } from '../../../utils/helpers';

dayjs.extend(relativeTime);

const defaultStart = dayjs()
  .add(3, 'days')
  .set('hours', 18)
  .set('seconds', 0)
  .set('minutes', 0)
  .toDate();
const defaultEnd = dayjs()
  .add(6, 'days')
  .set('hours', 11)
  .set('seconds', 0)
  .set('minutes', 0)
  .toDate();

const DatesSelector = () => {
  const router = useRouter();
  const { user } = useAuth();
  const isMember = user?.roles.includes('member');

  const { steps, settings } = useBookingState();
  const currentStep = steps.find((step) => step.path === router.pathname).data;
  const {
    startDate: savedStartDate,
    endDate: savedEndDate,
    guests: savedGuests,
  } = currentStep || {};
  const { saveStepData, goToNextStep, startNewBooking } = useBookingActions();
  const [startDate, setStartDate] = useState(savedStartDate || defaultStart);
  const [endDate, setEndDate] = useState(savedEndDate || defaultEnd);
  const totalNights =
    Math.abs(Math.ceil(dayjs(startDate).diff(endDate, 'days'))) + 1;

  const [adults, setAdults] = useState(savedGuests?.adults || 1);
  const [kids, setKids] = useState(savedGuests?.kids || 0);
  const [infants, setInfants] = useState(savedGuests?.infants || 0);
  const [pets, setPets] = useState(savedGuests?.pets || 0);

  const [selectedCurrency, selectCurrency] = useState(DEFAULT_CURRENCY);

  const handleNext = () => {
    saveStepData({
      startDate,
      endDate,
      totalNights,
      guests: {
        adults,
        kids,
        infants,
        pets,
        totalGuests: adults,
      },
      useToken:
        selectedCurrency === blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol,
      savedCurrency: selectedCurrency,
    });
    goToNextStep();
  };

  if (!settings.conditions) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-screen-sm mx-auto p-8 h-full">
        <BookingBackButton />
        <h1 className="step-title pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🏡</span>
          <span>{__('bookings_dates_step_title')}</span>
        </h1>
        <BookingProgress />
        <div className="mt-16 flex flex-col gap-16">
          <BookingDates
            conditions={settings.conditions}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            isMember={isMember}
          />
          <BookingGuests
            adults={adults}
            kids={kids}
            infants={infants}
            pets={pets}
            setAdults={setAdults}
            setKids={setKids}
            setInfants={setInfants}
            setPets={setPets}
          />
          <div>
            <h2 className="text-2xl leading-10 font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center">
              <span className="mr-1">💰</span>
              <span>{__('bookings_dates_step_payment_title')}</span>
            </h2>
            <CurrencySwitch
              selectedCurrency={selectedCurrency}
              onSelect={selectCurrency}
              currencies={CURRENCIES}
            />
          </div>
          <button className="booking-btn" onClick={handleNext}>
            {__('generic_search')}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default DatesSelector;
