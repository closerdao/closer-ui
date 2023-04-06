import { useRouter } from 'next/router';

import { useState } from 'react';
import React from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingDates from '../../../components/BookingDates/BookingDates';
import BookingGuests from '../../../components/BookingGuests';
import CurrencySwitch from '../../../components/CurrencySwitch';
import PageError from '../../../components/PageError';
import TicketOptions from '../../../components/TicketOptions';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs, { Dayjs } from 'dayjs';
import { NextPage } from 'next';

import PageNotFound from '../../404';
import {
  BOOKING_STEPS,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { BookingSettings } from '../../../types/api';
import { CloserCurrencies } from '../../../types/currency';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

interface Props {
  error?: string;
  settings?: BookingSettings;
  ticketOptions?: any;
  volunteer?: any;
}

const DatesSelector: NextPage<Props> = ({
  error,
  settings,
  ticketOptions,
  volunteer,
}) => {
  const router = useRouter();
  const {
    start: savedStartDate,
    end: savedEndDate,
    adults: savedAdults,
    kids: savedKids,
    infants: savedInfants,
    pets: savedPets,
    currency: savedCurrency,
    eventId,
  } = router.query || {};

  const initialStartDate = savedStartDate
    ? dayjs(savedStartDate as string, 'YYYY-MM-DD')
    : dayjs().add(3, 'days');

  const initialEndDate = savedEndDate
    ? dayjs(savedEndDate as string, 'YYYY-MM-DD')
    : dayjs().add(6, 'days');

  const { user } = useAuth();
  const isMember = user?.roles.includes('member');
  const [start, setStartDate] = useState<Dayjs>(initialStartDate);
  const [end, setEndDate] = useState<Dayjs>(initialEndDate);
  const [adults, setAdults] = useState<number>(Number(savedAdults) || 1);
  const [kids, setKids] = useState<number>(Number(savedKids) || 0);
  const [infants, setInfants] = useState<number>(Number(savedInfants) || 0);
  const [pets, setPets] = useState<number>(Number(savedPets) || 0);
  const [currency, selectCurrency] = useState<CloserCurrencies>(
    (savedCurrency as CloserCurrencies) || DEFAULT_CURRENCY,
  );
  const [selectedTicketName, selectTicketName] = useState<string>();
  const handleNext = () => {
    const data = {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
      adults: String(adults),
      kids: String(kids),
      infants: String(infants),
      pets: String(pets),
      currency,
      eventId: eventId as string,
    };
    const urlParams = new URLSearchParams(data);
    router.push(`/bookings/create/accomodation?${urlParams}`);
  };

  const goBack = () => {
    router.back();
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full">
        <BookingBackButton onClick={goBack} />
        <h1 className="step-title pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🏡</span>
          <span>{__('bookings_dates_step_title')}</span>
        </h1>
        <ProgressBar steps={BOOKING_STEPS} />
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
          {ticketOptions && (
            <TicketOptions
              items={ticketOptions}
              selectedTicketName={selectedTicketName}
              selectTicketName={selectTicketName}
            />
          )}
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
          <button
            className="booking-btn"
            onClick={handleNext}
            disabled={eventId ? !selectedTicketName : false}
          >
            {__('generic_search')}
          </button>
        </div>
      </div>
    </>
  );
};

DatesSelector.getInitialProps = async ({ query }) => {
  try {
    const { eventId, volunteerId } = query;
    const {
      data: { results },
    } = await api.get('/bookings/settings');
    if (eventId) {
      console.log('eventId', eventId);
      const ticketsAvailable = await api.get(
        `/bookings/event/${eventId}/availability`,
      );
      return {
        settings: results as BookingSettings,
        ticketOptions: ticketsAvailable.data.ticketOptions,
      };
    }
    if (volunteerId) {
      const volunteer = await api.get(`/volunteers/${volunteerId}`);
      return {
        settings: results as BookingSettings,
        volunteer: volunteer.data.results,
      };
    }
    return {
      settings: results as BookingSettings,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default DatesSelector;
