import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import BookingDates from '../../../components/BookingDates/BookingDates';
import BookingGuests from '../../../components/BookingGuests';
import CurrencySwitch from '../../../components/CurrencySwitch';
import PageError from '../../../components/PageError';
import Switch from '../../../components/Switch';
import TicketOptions from '../../../components/TicketOptions';
import BackButton from '../../../components/ui/BackButton';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import HeadingRow from '../../../components/ui/HeadingRow';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import { ParsedUrlQuery } from 'querystring';

import PageNotFound from '../../404';
import {
  BOOKING_STEPS,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { Event, TicketOption } from '../../../types';
import { BookingConfig, VolunteerOpportunity } from '../../../types/api';
import { CloserCurrencies } from '../../../types/currency';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __, getMaxBookingHorizon } from '../../../utils/helpers';

interface Props {
  error?: string;
  ticketOptions?: TicketOption[];
  volunteer?: VolunteerOpportunity;
  futureEvents?: Event[];
  event?: Event;
  bookingConfig: BookingConfig | null;
}

const DatesSelector = ({
  error,
  bookingConfig,
  ticketOptions,
  volunteer,
  futureEvents,
  event,
}: Props) => {
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const router = useRouter();

  const conditions = {
    memberMaxDuration: bookingConfig?.memberMaxDuration,
    memberMaxBookingHorizon: bookingConfig?.memberMaxBookingHorizon,
    guestMaxDuration: bookingConfig?.guestMaxDuration,
    guestMaxBookingHorizon: bookingConfig?.guestMaxBookingHorizon,
  };
  const { user, isAuthenticated } = useAuth();
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

  const isHourlyBooking = savedStartDate === savedEndDate;

  const [blockedDateRanges, setBlockedDateRanges] = useState<any[]>([]);

  const memoizedBlockedDateRanges = useMemo(() => {
    return getBlockedDateRanges();
  }, [futureEvents, savedStartDate, savedEndDate]);

  function getBlockedDateRanges() {
    const dateRanges: any[] = [];
    futureEvents?.forEach((event: Event) => {
      if (event.blocksBookingCalendar) {
        dateRanges.push({
          from: new Date(event.start),
          to: new Date(event.end),
        });
      }
    });
    dateRanges.push({ before: new Date() });
    dateRanges.push({
      after: new Date().setDate(
        new Date().getDate() + getMaxBookingHorizon(bookingConfig, isMember)[0],
      ),
    });
    return dateRanges;
  }

  useEffect(() => {
    if (eventId) {
      setBlockedDateRanges((ranges) => [
        ...ranges,
        { before: new Date(event?.start as string) },
        { after: new Date(event?.end as string) },
      ]);
    }
    if (volunteerId) {
      setBlockedDateRanges((ranges) => [
        ...ranges,
        { before: new Date(volunteer?.start as string) },
        { after: new Date(volunteer?.end as string) },
      ]);
    }

    if (!eventId && !volunteerId) {
      setBlockedDateRanges(memoizedBlockedDateRanges);
    }
  }, []);

  const [start, setStartDate] = useState<string | null | Date>();
  const [end, setEndDate] = useState<string | null | Date>();
  const [adults, setAdults] = useState<number>(Number(savedAdults) || 1);
  const [kids, setKids] = useState<number>(Number(savedKids) || 0);
  const [infants, setInfants] = useState<number>(Number(savedInfants) || 0);
  const [pets, setPets] = useState<number>(Number(savedPets) || 0);
  const [handleNextError, setHandleNextError] = useState<string | null>(null);
  const [currency, selectCurrency] = useState<CloserCurrencies>(
    (savedCurrency as CloserCurrencies) || DEFAULT_CURRENCY,
  );
  const [selectedTicketOption, selectTicketOption] = useState<any>(
    ticketOptions?.[0],
  );
  const [discountCode, setDiscountCode] = useState('');
  const [doesNeedPickup, setDoesNeedPickup] = useState(false);
  const [doesNeedSeparateBeds, setDoesNeedSeparateBeds] = useState(false);

  useEffect(() => {
    setStartDate(savedStartDate as string);
    setEndDate(savedEndDate as string);
  }, [savedStartDate, savedEndDate]);

  const getUrlParams = () => {
    const dateFormat = 'YYYY-MM-DD';
    const params = {
      start: dayjs(savedStartDate as string).format(dateFormat),
      end: dayjs(savedEndDate as string).format(dateFormat),
      adults: String(adults),
      ...(kids && { kids: String(kids) }),
      ...(infants && { infants: String(infants) }),
      ...(pets && { pets: String(pets) }),
      ...(eventId && { eventId: eventId as string }),
      ...(volunteerId && { volunteerId: volunteerId as string }),
    };
    const urlParams = new URLSearchParams(params);

    return urlParams;
  };

  const redirectToSignup = () => {
    router.push(`/signup?back=bookings/create/dates&${getUrlParams()}`);
  };

  const handleNext = async () => {
    setHandleNextError(null);
    try {
      const data = {
        start: String(dayjs(start as string).format('YYYY-MM-DD')) || '',
        end: String(dayjs(end as string).format('YYYY-MM-DD')) || '',
        adults: String(adults),
        kids: String(kids),
        infants: String(infants),
        pets: String(pets),
        currency,
        ...(eventId && { eventId: eventId as string }),
        ...(volunteerId && { volunteerId: volunteerId as string }),
        ticketOption: selectedTicketOption?.name,
        discountCode: discountCode,
        doesNeedPickup: String(doesNeedPickup),
        doesNeedSeparateBeds: String(doesNeedSeparateBeds),
      };

      if (data.start === data.end || selectedTicketOption?.isDayTicket) {
        if (!isAuthenticated) {
          redirectToSignup();
          return;
        }
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
          doesNeedPickup,
          doesNeedSeparateBeds,
          isHourlyBooking,
        });
        router.push(`/bookings/${newBooking._id}/questions`);
      } else {
        const urlParams = new URLSearchParams(data);
        router.push(`/bookings/create/accomodation?${urlParams}`);
      }
    } catch (err: any) {
      setHandleNextError(err.response?.data?.error || err.message);
    }
  };

  const goBack = () => {
    if (volunteerId) {
      router.push(`/volunteer/${volunteer?.slug}`);
      return;
    }
    if (eventId) {
      router.push(`/events/${event?.slug}`);
      return;
    }
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>
        <Heading className="pb-4 mt-8">
          <span className="mr-2">🏡</span>
          <span>{__('bookings_summary_step_dates_title')}</span>
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />

        <div className="mt-16 flex flex-col gap-8">
          {process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' && (
            <div>
              <HeadingRow>
                <span className="mr-2">💰</span>
                <span>{__('bookings_dates_step_payment_title')}</span>
              </HeadingRow>
              <CurrencySwitch
                selectedCurrency={currency}
                onSelect={selectCurrency}
                currencies={CURRENCIES}
              />
            </div>
          )}
          {eventId && ticketOptions && ticketOptions.length > 0 && (
            <TicketOptions
              items={ticketOptions}
              selectedTicketOption={selectedTicketOption}
              selectTicketOption={selectTicketOption}
              volunteer={volunteer}
              discountCode={discountCode}
              setDiscountCode={setDiscountCode}
              eventId={eventId as string}
            />
          )}
          {selectedTicketOption?.isDayTicket !== true && (
            <BookingDates
              conditions={conditions}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              isMember={isMember}
              blockedDateRanges={blockedDateRanges}
              savedStartDate={savedStartDate as string}
              savedEndDate={savedEndDate as string}
              eventStartDate={event?.start ? event?.start : volunteer?.start}
              eventEndDate={event?.end ? event?.end : volunteer?.end}
            />
          )}
          <BookingGuests
            adults={adults}
            kids={kids}
            infants={infants}
            pets={pets}
            setAdults={setAdults}
            setKids={setKids}
            setInfants={setInfants}
            setPets={setPets}
            doesNeedSeparateBeds={doesNeedSeparateBeds}
            setDoesNeedSeparateBeds={setDoesNeedSeparateBeds}
          />

          <div>
            <HeadingRow>
              <span className="mr-2">➕</span>
              <span>{__('bookings_heading_extras')}</span>
            </HeadingRow>
            <div className="my-10 flex flex-row justify-between flex-wrap">
              <label htmlFor="separateBeds" className="text-md">
                {__('bookings_pickup')}
                <span className="w-full text-xs ml-2">
                  ({__('bookings_pickup_disclaimer')})
                </span>
              </label>
              <Switch
                disabled={false}
                name="pickup"
                label=""
                onChange={setDoesNeedPickup}
                checked={doesNeedPickup}
              />
            </div>
          </div>

          {handleNextError && (
            <div className="error-box">{handleNextError}</div>
          )}
          <Button
            onClick={handleNext}
            isEnabled={
              !!(
                (eventId &&
                  (!ticketOptions?.length || selectedTicketOption) &&
                  start &&
                  end) ||
                (volunteerId && start && end) ||
                (!eventId && !volunteerId && start && end)
              )
            }
          >
            {__('generic_search')}
          </Button>
        </div>
      </div>
    </>
  );
};

DatesSelector.getInitialProps = async ({
  query,
}: {
  query: ParsedUrlQuery;
}) => {
  try {
    const { eventId, volunteerId } = query;

    const {
      data: {
        results: { value: settings },
      },
    } = await api.get('/config/booking');

    if (eventId) {
      const [ticketsAvailable, event] = await Promise.all([
        api.get(`/bookings/event/${eventId}/availability`),
        api.get(`/event/${eventId}`),
      ]);

      return {
        bookingConfig: settings as any,
        ticketOptions: ticketsAvailable.data.ticketOptions,
        event: event.data.results,
      };
    }
    if (volunteerId) {
      const volunteer = await api.get(`/volunteer/${volunteerId}`);
      return {
        bookingConfig: settings as any,
        volunteer: volunteer.data.results,
      };
    }
    if (!eventId && !volunteerId) {
      const res = await api.get(
        `/event?&where=${JSON.stringify({
          end: {
            $gt: new Date(),
          },
        })}`,
      );

      return {
        bookingConfig: settings,
        futureEvents: res.data.results,
      };
    }
    return {
      bookingConfig: settings,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
    };
  }
};

export default DatesSelector;
