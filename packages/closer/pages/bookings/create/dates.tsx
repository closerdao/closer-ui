import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import BookingDates from '../../../components/BookingDates/BookingDates';
import BookingGuests from '../../../components/BookingGuests';
import CurrencySwitch from '../../../components/CurrencySwitch';
import PageError from '../../../components/PageError';
import TicketOptions from '../../../components/TicketOptions';
import BackButton from '../../../components/ui/BackButton';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import HeadingRow from '../../../components/ui/HeadingRow';
import ProgressBar from '../../../components/ui/ProgressBar';

import { NextPage } from 'next';

import PageNotFound from '../../404';
import {
  BOOKING_STEPS,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { Event, TicketOption } from '../../../types';
import { BookingSettings, VolunteerOpportunity } from '../../../types/api';
import { CloserCurrencies } from '../../../types/currency';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

const STAY_BOOKING_ALLOWED_PLANS = ['wanderer', 'pioneer', 'sheep'];

interface Props {
  error?: string;
  settings?: BookingSettings;
  ticketOptions?: TicketOption[];
  volunteer?: VolunteerOpportunity;
  futureEvents?: Event[];
}

const DatesSelector: NextPage<Props> = ({
  error,
  settings,
  ticketOptions,
  volunteer,
  futureEvents,
}) => {
  const router = useRouter();
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

  const [blockedDateRanges, setBlockedDateRanges] = useState<any[]>([]);

  const getMaxBookingHorizon = () => {
    if (settings) {
      if (isMember) {
        return settings?.conditions.member.maxBookingHorizon;
      }
      return settings?.conditions.guest.maxBookingHorizon;
    }
    return 0;
  };

  const memoizedBlockedDateRanges = useMemo(() => {
    return getBlockedDateRanges();
  }, [futureEvents, savedStartDate, savedEndDate]);

  function getBlockedDateRanges() {
    const blockedDateRanges: any[] = [];
    if (eventId) {
      blockedDateRanges.push({ before: new Date(savedStartDate as string) });
      blockedDateRanges.push({ after: new Date(savedEndDate as string) });
    }
    futureEvents?.forEach((event: Event) => {
      if (event.blocksBookingCalendar) {
        blockedDateRanges.push({
          from: new Date(event.start),
          to: new Date(event.end),
        });
      }
    });
    blockedDateRanges.push({ before: new Date() });
    blockedDateRanges.push({
      after: new Date().setDate(new Date().getDate() + getMaxBookingHorizon()),
    });
    return blockedDateRanges;
  }

  useEffect(() => {
    if (user) {
      if (
        (!user.subscription ||
          !user.subscription.plan ||
          !STAY_BOOKING_ALLOWED_PLANS.includes(user.subscription.plan)) &&
        !volunteerId &&
        !eventId
      ) {
        router.push('/bookings/unlock-stays');
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push({
        pathname: '/login',
        query: {
          back: router.asPath,
        },
      });
    }
    if (eventId) {
      setBlockedDateRanges([
        { before: new Date(savedStartDate as string) },
        { after: new Date(savedEndDate as string) },
      ]);
    }
    if (volunteerId) {
      setBlockedDateRanges([
        { before: new Date(savedStartDate as string) },
        { after: new Date(savedEndDate as string) },
      ]);
    }
    if (!eventId && !volunteerId) {
      setBlockedDateRanges(memoizedBlockedDateRanges);
    }
  }, []);

  const [start, setStartDate] = useState<string | null>();
  const [end, setEndDate] = useState<string | null>();
  const [adults, setAdults] = useState<number>(Number(savedAdults) || 1);
  const [kids, setKids] = useState<number>(Number(savedKids) || 0);
  const [infants, setInfants] = useState<number>(Number(savedInfants) || 0);
  const [pets, setPets] = useState<number>(Number(savedPets) || 0);
  const [handleNextError, setHandleNextError] = useState<string | null>(null);
  const [currency, selectCurrency] = useState<CloserCurrencies>(
    (savedCurrency as CloserCurrencies) || DEFAULT_CURRENCY,
  );
  const [selectedTicketOption, selectTicketOption] = useState<any>(null);
  const [discountCode, setDiscountCode] = useState('');

  const handleNext = async () => {
    setHandleNextError(null);
    try {
      const data = {
        start: start || '',
        end: end || '',
        adults: String(adults),
        kids: String(kids),
        infants: String(infants),
        pets: String(pets),
        currency,
        ...(eventId && { eventId: eventId as string }),
        ...(volunteerId && { volunteerId: volunteerId as string }),
        ticketOption: selectedTicketOption?.name,
        discountCode: discountCode,
      };

      if (data.start === data.end || selectedTicketOption?.isDayTicket) {
        if (!isAuthenticated) {
          router.push({
            pathname: '/login',
            query: {
              back: router.asPath,
            },
          });
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
        <Heading className="pb-4 mt-8">
          <span className="mr-2">🏡</span>
          <span>{__('bookings_summary_step_dates_title')}</span>
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />

        <div className="mt-16 flex flex-col gap-16">
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

          {eventId && (
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
              conditions={settings?.conditions}
              startDate={start}
              endDate={end}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              isMember={isMember}
              blockedDateRanges={blockedDateRanges}
              savedStartDate={savedStartDate as string}
              savedEndDate={savedEndDate as string}
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
          />
          {handleNextError && (
            <div className="error-box">{handleNextError}</div>
          )}

          <Button
            onClick={handleNext}
            isEnabled={
              !!(
                (eventId && selectedTicketOption && start && end) ||
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

DatesSelector.getInitialProps = async ({ query }) => {
  try {
    const { eventId, volunteerId } = query;

    const {
      data: {
        results: { value: settings },
      },
    } = await api.get('/config/booking');
    if (eventId) {
      const ticketsAvailable = await api.get(
        `/bookings/event/${eventId}/availability`,
      );
      return {
        settings: settings as BookingSettings,
        ticketOptions: ticketsAvailable.data.ticketOptions,
      };
    }
    if (volunteerId) {
      const volunteer = await api.get(`/volunteer/${volunteerId}`);
      return {
        settings: settings as BookingSettings,
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
        settings: settings as BookingSettings,
        futureEvents: res.data.results,
      };
    }
    return {
      settings: settings as BookingSettings,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default DatesSelector;
