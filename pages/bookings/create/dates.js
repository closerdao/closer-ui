import { useRouter } from 'next/router';

import { useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingDates from '../../../components/BookingDates';
import BookingGuests from '../../../components/BookingGuests';
import BookingProgress from '../../../components/BookingProgress';
import CurrencySwitch from '../../../components/CurrencySwitch';
import Layout from '../../../components/Layout';
import PageError from '../../../components/PageError';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PropTypes from 'prop-types';

import { useAuth } from '../../../contexts/auth';
import { useBookingActions, useBookingState } from '../../../contexts/booking';
import api from '../../../utils/api';
import { CURRENCIES, DEFAULT_CURRENCY } from '../../../utils/const';
import { __ } from '../../../utils/helpers';

dayjs.extend(relativeTime);

const defaultStart = dayjs()
  .add(3, 'days')
  .set('hours', 18)
  .set('seconds', 0)
  .set('minutes', 0)
  .format('YYYY-MM-DD');

const defaultEnd = dayjs()
  .add(6, 'days')
  .set('hours', 11)
  .set('seconds', 0)
  .set('minutes', 0)
  .format('YYYY-MM-DD');

const DatesSelector = ({ error, settings }) => {
  const router = useRouter();
  const { user } = useAuth();
  const isMember = user?.roles.includes('member');
  const {
    data: { dates: savedDates },
  } = useBookingState();
  const {
    start: savedStartDate,
    end: savedEndDate,
    adults: savedAdults,
    kids: savedKids,
    infants: savedInfants,
    pets: savedPets,
    currency: savedCurrency,
  } = savedDates || {};
  const { saveStepData } = useBookingActions();
  const [start, setStartDate] = useState(savedStartDate || defaultStart);
  const [end, setEndDate] = useState(savedEndDate || defaultEnd);
  const [adults, setAdults] = useState(savedAdults || 1);
  const [kids, setKids] = useState(savedKids || 0);
  const [infants, setInfants] = useState(savedInfants || 0);
  const [pets, setPets] = useState(savedPets || 0);
  const [currency, selectCurrency] = useState(
    savedCurrency || DEFAULT_CURRENCY,
  );
  const totalNights = Math.abs(Math.ceil(dayjs(start).diff(end, 'days'))) + 1;

  const handleNext = () => {
    const data = {
      start,
      end,
      totalNights,
      adults,
      kids,
      infants,
      pets,
      currency,
    };
    saveStepData(data);
    const urlParams = new URLSearchParams(data);
    router.push(`/bookings/create/accomodation?${urlParams}`);
  };

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <Layout>
      <div className="max-w-screen-sm mx-auto p-8 h-full">
        <BookingBackButton url="/dashboard" />
        <h1 className="step-title pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🏡</span>
          <span>{__('bookings_dates_step_title')}</span>
        </h1>
        <BookingProgress />
        <div className="mt-16 flex flex-col gap-16">
          <div>
            <h2 className="mb-3 text-2xl leading-10 font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center">
              <span className="mr-1">💰</span>
              <span>{__('bookings_dates_step_payment_title')}</span>
            </h2>
            <CurrencySwitch
              selectedCurrency={currency}
              onSelect={selectCurrency}
              currencies={CURRENCIES}
            />
          </div>
          <BookingDates
            conditions={settings?.conditions}
            startDate={start}
            endDate={end}
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
          <button className="booking-btn" onClick={handleNext}>
            {__('generic_search')}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps = async () => {
  try {
    const {
      data: { results },
    } = await api.get('/bookings/settings');
    return {
      props: {
        settings: results,
      },
    };
  } catch (err) {
    return {
      props: {
        error: err.message,
        questions: null,
      },
    };
  }
};

DatesSelector.propTypes = {
  error: PropTypes.string,
  settings: PropTypes.shape({
    conditions: PropTypes.shape({
      member: PropTypes.shape({
        maxBookingHorizon: PropTypes.number,
        maxDuration: PropTypes.number,
      }),
      guest: PropTypes.shape({
        maxBookingHorizon: PropTypes.number,
        maxDuration: PropTypes.number,
      }),
    }),
  }),
};

export default DatesSelector;
