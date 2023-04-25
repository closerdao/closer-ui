import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingDates from '../../../components/BookingDates/BookingDates';
import BookingGuests from '../../../components/BookingGuests';
import CurrencySwitch from '../../../components/CurrencySwitch';
import PageError from '../../../components/PageError';
import TicketOptions from '../../../components/TicketOptions';
import BackButton from '../../../components/ui/BackButton';
import Button from '../../../components/ui/Button';
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
import { TicketOption } from '../../../types';
import { BookingSettings, VolunteerOpportunity } from '../../../types/api';
import { CloserCurrencies } from '../../../types/currency';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

interface Props {
  error?: string;
  settings?: BookingSettings;
  ticketOptions?: TicketOption[];
  volunteer?: VolunteerOpportunity;
}

const DatesSelector: NextPage<Props> = ({
  error,
  settings,
  ticketOptions,
  volunteer,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const isMember = user?.roles.includes('member');
  const {
    start: savedStartDate,
    end: savedEndDate,
    adults: savedAdults,
    kids: savedKids,
    infants: savedInfants,
    pets: savedPets,
    currency: savedCurrency,
    eventId,
    volunteerId,
  } = router.query || {};

  const initialStartDate = savedStartDate
    ? dayjs(savedStartDate as string, 'YYYY-MM-DD').set('hour', 16)
    : dayjs().add(3, 'days').set('hour', 16);
  const initialEndDate = savedEndDate
    ? dayjs(savedEndDate as string, 'YYYY-MM-DD').set('hour', 11)
    : dayjs().add(6, 'days').set('hour', 11);

  useEffect(() => {
    // Always do navigations after the first render
    const isEndTheSameDay = initialEndDate.isSame(initialStartDate, 'day');
    const newEndDate = initialStartDate.add(1, 'day').set('hour', 11);
    if (isEndTheSameDay) {
      setEndDate(newEndDate);
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            start: savedStartDate,
            end: newEndDate.format('YYYY-MM-DD'),
          },
        },
        undefined,
        { shallow: true },
      );
    }
  }, []);

  const [start, setStartDate] = useState<Dayjs>(initialStartDate);
  const [end, setEndDate] = useState<Dayjs>(initialEndDate);
  const [adults, setAdults] = useState<number>(Number(savedAdults) || 1);
  const [kids, setKids] = useState<number>(Number(savedKids) || 0);
  const [infants, setInfants] = useState<number>(Number(savedInfants) || 0);
  const [pets, setPets] = useState<number>(Number(savedPets) || 0);
  const [handleNextError, setHandleNextError] = useState<string>(null);
  const [currency, selectCurrency] = useState<CloserCurrencies>(
    (savedCurrency as CloserCurrencies) || DEFAULT_CURRENCY,
  );
  const [selectedTicketOption, selectTicketOption] = useState<string>('');
  const [discountCode, setDiscountCode] = useState('');


  const handleNext = async () => {
    setHandleNextError(null);
    try {
      const data = {
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD'),
        adults: String(adults),
        kids: String(kids),
        infants: String(infants),
        pets: String(pets),
        currency,
        ...(eventId && { eventId: eventId as string }),
        ...(volunteerId && { volunteerId: volunteerId as string }),
        ticketOption: selectedTicketOption,
        discountCode: discountCode
      };

      if (data.start === data.end) {
        // Single day ticket - no accomodation needed.
        const {
          data: { results: newBooking },
        } = await api.post('/bookings/request', {
          // useTokens,
          start,
          end,
          adults,
          infants,
          pets,
          eventId: data.eventId,
          ticketOption: data.ticketOption,
          discountCode: data.discountCode,
          isDayTicket: true,
          children: kids,
        });
        router.push(`/bookings/${newBooking._id}/questions`);
      } else {
        const urlParams = new URLSearchParams(data);
        router.push(`/bookings/create/accomodation?${urlParams}`);
      }
    } catch (err) {
      setHandleNextError(err.response?.data?.error || err.message);
    }
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
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>
        <h1 className="step-title pb-2 flex space-x-1 items-center mt-8">
          🏡 {__('bookings_summary_step_dates_title')}
        </h1>
        <ProgressBar steps={BOOKING_STEPS} />

        <div className="mt-16 flex flex-col gap-16">
          {process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' && (
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
          )}

          {eventId && (
            <TicketOptions
              items={ticketOptions}
              selectedTicketOption={selectedTicketOption}
              selectTicketOption={selectTicketOption}
              volunteer={volunteer}
              discountCode={discountCode}
              setDiscountCode={setDiscountCode}
            />
          )}

          <BookingDates
            conditions={settings?.conditions}
            startDate={start}
            endDate={end}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            isMember={isMember}
            eventId={eventId as string}
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
          { handleNextError &&
            <div className="error-box">{ handleNextError }</div>
          }
          <Button
            onClick={handleNext}
            isEnabled={
              (eventId && selectedTicketOption) ||
              volunteerId ||
              (!eventId && !volunteerId)
                ? true
                : false
            }
          >
            {__('generic_search')}
          </Button>
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
      const ticketsAvailable = await api.get(
        `/bookings/event/${eventId}/availability`,
      );

      return {
        settings: results as BookingSettings,
        ticketOptions: ticketsAvailable.data.ticketOptions,
      };
    }
    if (volunteerId) {
      const volunteer = await api.get(`/volunteer/${volunteerId}`);
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
