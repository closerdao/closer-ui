import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import BookingDates from '../../../components/BookingDates/BookingDates';
import BookingGuests from '../../../components/BookingGuests';
import CurrencySwitch from '../../../components/CurrencySwitch';
import PageError from '../../../components/PageError';
import Switch from '../../../components/Switch';
import TicketOptions from '../../../components/TicketOptions';
import { ErrorMessage } from '../../../components/ui';
import BackButton from '../../../components/ui/BackButton';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import HeadingRow from '../../../components/ui/HeadingRow';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import {
  BOOKING_STEPS,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { Event, TicketOption } from '../../../types';
import { BookingConfig, VolunteerConfig } from '../../../types/api';
import { CloserCurrencies } from '../../../types/currency';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { getMaxBookingHorizon } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  error?: string;
  ticketOptions?: TicketOption[];
  futureEvents?: Event[];
  event?: Event;
  bookingConfig: BookingConfig | null;
  messages?: any;
  volunteerConfig: VolunteerConfig | null;
}

const DatesSelector = ({
  error,
  bookingConfig,
  ticketOptions,
  futureEvents,
  event,
  volunteerConfig,
}: Props) => {
  const t = useTranslations();
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
    skills,
    diet,
    suggestions,
    bookingType,
    projectId,
  } = router.query || {};

  const isHourlyBooking = false;

  const [blockedDateRanges, setBlockedDateRanges] = useState<any[]>([]);

  const [start, setStartDate] = useState<string | null | Date>(
    (savedStartDate as string) || null,
  );
  const [end, setEndDate] = useState<string | null | Date>(
    (savedEndDate as string) || null,
  );
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
  const [bookingError, setBookingError] = useState<null | string>(null);

  const hasEventIdAndValidTicket = Boolean(
    eventId && (!ticketOptions?.length || selectedTicketOption),
  );

  const decodedBookingType = bookingType
    ? decodeURIComponent(bookingType as string)
    : '';
  const isResidenceApplication = decodedBookingType === 'residence';
  const isVolunteerApplication = decodedBookingType === 'volunteer';

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
    !isVolunteerApplication &&
      !isResidenceApplication &&
      dateRanges.push({
        after: new Date().setDate(
          new Date().getDate() +
            getMaxBookingHorizon(bookingConfig, isMember)[0],
        ),
      });
    return dateRanges;
  }

  const memoizedBlockedDateRanges = useMemo(() => {
    return getBlockedDateRanges();
  }, [futureEvents, savedStartDate, savedEndDate]);

  const hasValidDates =
    Boolean(start && end) || Boolean(savedStartDate && savedEndDate);
  const isGeneralCase =
    !eventId &&
    !volunteerId &&
    bookingType !== 'volunteer' &&
    bookingType !== 'residence' &&
    hasValidDates &&
    !bookingError;
  const startDate = dayjs(start).startOf('day');
  const endDate = dayjs(end).startOf('day');
  const diffInDays = endDate.diff(startDate, 'day');

  const isMinVolunteeringStayMatched =
    diffInDays >= (volunteerConfig?.volunteeringMinStay || 1);

  const isMinResidenceStayMatched =
    diffInDays >= (volunteerConfig?.residenceMinStay || 1);

  const isMinDurationMatched = Boolean(
    (bookingConfig && diffInDays >= bookingConfig?.minDuration) || eventId,
  );

  const canProceed = !!(
    ((hasEventIdAndValidTicket && hasValidDates) ||
      ((isResidenceApplication || isVolunteerApplication) &&
        hasValidDates &&
        (isMinVolunteeringStayMatched || isMinResidenceStayMatched)) ||
      isGeneralCase) &&
    isMinDurationMatched
  );

  const isTokenPaymentSelected = currency === CURRENCIES[1];
  const isStartToday = start && dayjs(start).isSame(dayjs(), 'day');
  const isTodayAndToken = Boolean(isStartToday && isTokenPaymentSelected);

  useEffect(() => {
    if (eventId) {
      setBlockedDateRanges((ranges) => [
        ...ranges,
        { before: new Date(event?.start as string) },
        { after: new Date(event?.end as string) },
      ]);
    }
    if (isVolunteerApplication || isResidenceApplication) {
      setBlockedDateRanges((ranges) => [...ranges, { before: new Date() }]);
    }

    if (!eventId && !isVolunteerApplication && !isResidenceApplication) {
      setBlockedDateRanges(memoizedBlockedDateRanges);
    }
  }, []);

  useEffect(() => {
    setBookingError(null);
    if (start && end) {
      if (!isMinDurationMatched) {
        setBookingError(
          t('bookings_dates_min_duration_error', {
            var: bookingConfig?.minDuration,
          }),
        );
      }

      if (!isMinVolunteeringStayMatched && isVolunteerApplication) {
        setBookingError(
          t('bookings_dates_min_residence_stay_error', {
            var: volunteerConfig?.volunteeringMinStay,
          }),
        );
      }
      if (!isMinResidenceStayMatched && isResidenceApplication) {
        setBookingError(
          t('bookings_dates_min_residence_stay_error', {
            var: volunteerConfig?.residenceMinStay,
          }),
        );
      }
    }
  }, [start, end]);

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
      ...((isVolunteerApplication || isResidenceApplication) && {
        skills: skills as string,
      }),
      ...(projectId && { projectId: projectId as string }),
      ...((isVolunteerApplication || isResidenceApplication) && {
        diet: diet as string,
      }),
      ...((isVolunteerApplication || isResidenceApplication) && {
        suggestions: suggestions as string,
      }),
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
        ticketOption: selectedTicketOption?.name,
        discountCode: discountCode,
        doesNeedPickup: String(doesNeedPickup),
        doesNeedSeparateBeds: String(doesNeedSeparateBeds),
        ...(skills && { skills: skills as string }),
        ...(diet && { diet: diet as string }),
        ...(projectId && { projectId: projectId as string }),
        ...(suggestions && { suggestions: suggestions as string }),
        bookingType: (bookingType as string) || '',
      };

      if (selectedTicketOption?.isDayTicket) {
        if (!isAuthenticated) {
          redirectToSignup();
          return;
        }
        // Single day ticket - no accomodation needed.
        const {
          data: { results: newBooking },
        } = await api.post('/bookings/request', {
          // useTokens,
          start: selectedTicketOption?.isDayTicket ? savedStartDate : start,
          end: selectedTicketOption?.isDayTicket ? savedStartDate : end,
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
          isResidenceApplication,
          isVolunteerApplication,
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
    if (isResidenceApplication) {
      router.push('/projects/apply');
      return;
    }
    if (isVolunteerApplication) {
      router.push('/volunteer/apply');
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
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>
        <Heading className="pb-4 mt-8">
          <span className="mr-2">🏡</span>
          <span>
            {selectedTicketOption?.isDayTicket
              ? t('bookings_summary_step_dates_event')
              : t('bookings_summary_step_dates_title')}
          </span>
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />

        <div className="mt-16 flex flex-col gap-8">
          {process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true' && (
            <div>
              <HeadingRow>
                <span className="mr-2">💰</span>
                <span>{t('bookings_dates_step_payment_title')}</span>
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
              discountCode={discountCode}
              setDiscountCode={setDiscountCode}
              eventId={eventId as string}
            />
          )}
          {selectedTicketOption?.isDayTicket !== true && (
            <>
              <BookingDates
                conditions={conditions}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                isMember={isMember}
                blockedDateRanges={blockedDateRanges}
                savedStartDate={savedStartDate as string}
                savedEndDate={savedEndDate as string}
                eventStartDate={event?.start && event?.start}
                eventEndDate={event?.end && event?.end}
              />
              {bookingError && <ErrorMessage error={bookingError} />}
              {isTodayAndToken && (
                <ErrorMessage error={t('booking_token_same_day_error')} />
              )}
            </>
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

          {bookingConfig?.pickUpEnabled &&
            bookingConfig?.pickUpEnabled === true && (
              <div>
                <HeadingRow>
                  <span className="mr-2">➕</span>
                  <span>{t('bookings_heading_extras')}</span>
                </HeadingRow>
                <div className="mt-10 flex flex-row justify-between flex-wrap">
                  <label htmlFor="separateBeds" className="text-md">
                    {t('bookings_pickup')}
                    <span className="w-full text-xs ml-2">
                      ({t('bookings_pickup_disclaimer')})
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
            )}

          {handleNextError && (
            <div className="error-box">{handleNextError}</div>
          )}
          <Button
            onClick={handleNext}
            isEnabled={canProceed && !isTodayAndToken}
          >
            {selectedTicketOption?.isDayTicket
              ? t('booking_button_continue')
              : t('generic_search')}
          </Button>
        </div>
      </div>
    </>
  );
};

DatesSelector.getInitialProps = async (
  context: NextPageContext,
): Promise<Props> => {
  try {
    const { query } = context;
    const { eventId, volunteerId, bookingType } = query;

    const [bookingConfigRes, volunteerConfigRes, messages] = await Promise.all([
      api.get('/config/booking').catch(() => null),
      api.get('/config/volunteering').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const bookingConfig = bookingConfigRes?.data?.results?.value;
    const volunteerConfig = volunteerConfigRes?.data?.results?.value;
    if (eventId) {
      const [ticketsAvailable, event] = await Promise.all([
        api.get(`/bookings/event/${eventId}/availability`).catch(() => null),
        api.get(`/event/${eventId}`).catch(() => null),
      ]);

      return {
        bookingConfig,
        volunteerConfig,
        ticketOptions: ticketsAvailable?.data?.ticketOptions,
        event: event?.data?.results,
        messages,
      };
    }
    if (
      !eventId &&
      !volunteerId &&
      bookingType !== 'volunteer' &&
      bookingType !== 'residence'
    ) {
      const res = await api
        .get(
          `/event?&where=${JSON.stringify({
            end: {
              $gt: new Date(),
            },
          })}`,
        )
        .catch(() => null);

      return {
        bookingConfig,
        volunteerConfig,
        futureEvents: res?.data?.results,
        messages,
      };
    }
    return {
      bookingConfig,
      volunteerConfig,
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
      messages: null,
      volunteerConfig: null,
    };
  }
};

export default DatesSelector;
