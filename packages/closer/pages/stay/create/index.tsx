import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import StayEventBlockedNotice from '../../../components/booking/stayEventBlockedNotice';
import StayListingAccommodationPrice from '../../../components/booking/stayListingAccommodationPrice';
import StayListingUnitsCard from '../../../components/booking/stayListingUnitsCard';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import Modal from '../../../components/Modal';
import PageError from '../../../components/PageError';
import Slider from '../../../components/Slider';
import StaySearchBar, {
  StaySearchBarParams,
} from '../../../components/StaySearchBar';
import TicketOptions from '../../../components/TicketOptions';
import BackButton from '../../../components/ui/BackButton';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { Event, TicketOption } from '../../../types';
import {
  BookingSettings,
  GeneralConfig,
  VolunteerConfig,
} from '../../../types/api';
import type { StaySearchListing } from '../../../types/durationDiscount';
import { FoodOption } from '../../../types/food';
import api, { cdn } from '../../../utils/api';
import {
  getDefaultSelectedFoodOptionId,
  getFoodOptionsForBookingContext,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { normalizeDiscountCode } from '../../../utils/discountCode';
import {
  CalendarBlockingEvent,
  getCalendarBlockingEventsInRange,
} from '../../../utils/events.helpers';
import { createStay, searchStays } from '../../../utils/stays.api';
import { buildVolunteerInfo } from '../../../utils/volunteerApplication.helpers';
import {
  clearVolunteerApplicationDraft,
  readVolunteerApplicationDraft,
} from '../../../utils/volunteerApplicationDraft';

interface Props {
  bookingSettings: BookingSettings | null;
  generalConfig: GeneralConfig | null;
  volunteerConfig: VolunteerConfig | null;
  defaultGuestFoodOptionId?: string | null;
  event?: Event | null;
  ticketOptions?: TicketOption[];
  /** Future events that block the booking calendar, used to explain greyed out results. */
  calendarBlockingEvents?: CalendarBlockingEvent[];
  error?: string;
  messages?: any;
}

const PLATFORM_URL =
  process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const formatDate = (d: Date | string | null) =>
  d ? dayjs(d).format('YYYY-MM-DD') : '';

const StayCreatePage = ({
  bookingSettings,
  generalConfig,
  volunteerConfig,
  defaultGuestFoodOptionId,
  event: eventProp,
  ticketOptions: ticketOptionsProp,
  calendarBlockingEvents,
  error,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const isBookingEnabled =
    !!bookingSettings && process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const {
    start: savedStart,
    end: savedEnd,
    adults: savedAdults,
    children: savedChildren,
    kids: savedKids,
    infants: savedInfants,
    pets: savedPets,
    listingId: listingIdQuery,
    bookingType: bookingTypeQuery,
    eventId: eventIdQuery,
    ticketOption: ticketOptionQuery,
    discountCode: discountCodeQuery,
  } = router.query || {};

  const readParam = (value: string | string[] | undefined) =>
    typeof value === 'string'
      ? value
      : Array.isArray(value)
        ? value[0]
        : undefined;

  const listingId = readParam(listingIdQuery);
  const eventId = readParam(eventIdQuery);
  const bookingType =
    readParam(bookingTypeQuery) === 'residence'
      ? 'residence'
      : readParam(bookingTypeQuery) === 'volunteer'
        ? 'volunteer'
        : undefined;
  const isVolunteerApplication = Boolean(bookingType);
  const isEventBooking = Boolean(eventId);

  const availableTickets = useMemo(
    () =>
      (ticketOptionsProp || []).filter((option) => option.available > 0),
    [ticketOptionsProp],
  );

  const isDayTicketOnlyEvent = useMemo(() => {
    if (!isEventBooking || !eventProp?.paid) return false;
    if (availableTickets.length === 0) return false;
    return availableTickets.every((option) => option.isDayTicket);
  }, [isEventBooking, eventProp?.paid, availableTickets]);

  const initialAdults = Number(savedAdults) || 1;
  const initialChildren = Number(savedChildren || savedKids) || 0;
  const initialInfants = Number(savedInfants) || 0;
  const initialPets = Number(savedPets) || 0;

  const isMember = !!user?.roles?.includes('member');
  const volunteerMinNights = useMemo(() => {
    if (!isVolunteerApplication) return null;
    return bookingType === 'residence'
      ? volunteerConfig?.residenceMinStay || null
      : volunteerConfig?.volunteeringMinStay || null;
  }, [isVolunteerApplication, bookingType, volunteerConfig]);

  const minNights = useMemo(() => {
    if (isEventBooking) return 0;
    if (volunteerMinNights) return volunteerMinNights;
    if (!bookingSettings) return 1;
    return isMember
      ? bookingSettings.memberMinDuration || 1
      : bookingSettings.minDuration || 1;
  }, [bookingSettings, isMember, volunteerMinNights, isEventBooking]);

  const defaultDateRange = useMemo(() => {
    if (isEventBooking && eventProp?.start && eventProp?.end) {
      return {
        start: dayjs(eventProp.start).format('YYYY-MM-DD'),
        end: dayjs(eventProp.end).format('YYYY-MM-DD'),
      };
    }
    const start = dayjs().add(14, 'day').startOf('day');
    const end = start.add(Math.max(minNights, 1), 'day');
    return {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
    };
  }, [minNights, isEventBooking, eventProp?.start, eventProp?.end]);

  const hasUrlDates = Boolean(savedStart && savedEnd);

  const [activeParams, setActiveParams] = useState<StaySearchBarParams | null>(
    () => {
      if (savedStart && savedEnd) {
        return {
          start: String(savedStart),
          end: String(savedEnd),
          adults: initialAdults,
          children: initialChildren,
          infants: initialInfants,
          pets: initialPets,
        };
      }
      return null;
    },
  );

  const [searchDuration, setSearchDuration] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState<string | null>(null);
  const [isCreatingDayTicket, setIsCreatingDayTicket] = useState(false);
  const [results, setResults] = useState<StaySearchListing[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [didSearchOnce, setDidSearchOnce] = useState(false);
  const [selectedTicketOption, selectTicketOption] = useState<
    TicketOption | null
  >(null);
  const [discountCode, setDiscountCode] = useState(
    () => normalizeDiscountCode(readParam(discountCodeQuery)),
  );
  const [dismissedEventBlockKey, setDismissedEventBlockKey] = useState<
    string | null
  >(null);
  /** True when the shown listing came from /listing rather than the search — its availability is unproven. */
  const [usedListingFallback, setUsedListingFallback] = useState(false);

  useEffect(() => {
    if (!isDayTicketOnlyEvent) {
      selectTicketOption(null);
      return;
    }
    selectTicketOption((prev) => {
      if (prev && availableTickets.some((option) => option.name === prev.name)) {
        return prev;
      }
      const fromQuery = readParam(ticketOptionQuery);
      if (fromQuery) {
        return (
          availableTickets.find((option) => option.name === fromQuery) ||
          availableTickets[0] ||
          null
        );
      }
      return availableTickets[0] || null;
    });
  }, [isDayTicketOnlyEvent, availableTickets, ticketOptionQuery]);

  const canSelectDates = eventProp?.canSelectDates !== false;
  const hasValidDayTicket =
    !isDayTicketOnlyEvent || Boolean(selectedTicketOption);

  /**
   * Events flagged `blocksBookingCalendar` make /stays/search return every
   * listing as unavailable, so guests otherwise face a grid of greyed out
   * options with no reason given. Stays booked for an event and volunteer
   * stays are exempt from the block, so the notice never applies to them.
   */
  const blockingEventsForRange = useMemo(
    () =>
      isEventBooking || isVolunteerApplication
        ? []
        : getCalendarBlockingEventsInRange(
            calendarBlockingEvents,
            activeParams?.start,
            activeParams?.end,
          ),
    [
      calendarBlockingEvents,
      activeParams?.start,
      activeParams?.end,
      isEventBooking,
      isVolunteerApplication,
    ],
  );

  const hasBookableResult =
    !usedListingFallback &&
    Boolean(results?.some((listing) => listing.available !== false));

  const showEventBlockNotice =
    didSearchOnce &&
    !isSearching &&
    !!results &&
    !hasBookableResult &&
    blockingEventsForRange.length > 0;

  const searchedRangeKey = activeParams
    ? `${activeParams.start}_${activeParams.end}`
    : '';

  const isEventBlockModalOpen =
    showEventBlockNotice && dismissedEventBlockKey !== searchedRangeKey;

  const buildQueryParams = (params: StaySearchBarParams) => {
    const out: Record<string, string> = {
      start: params.start,
      end: params.end,
      adults: String(params.adults),
    };
    if (params.children) out.children = String(params.children);
    if (params.infants) out.infants = String(params.infants);
    if (params.pets) out.pets = String(params.pets);
    if (listingId) out.listingId = listingId;
    if (bookingType) out.bookingType = bookingType;
    if (eventId) out.eventId = eventId;
    if (isDayTicketOnlyEvent && selectedTicketOption?.name) {
      out.ticketOption = selectedTicketOption.name;
    }
    if (isDayTicketOnlyEvent && discountCode) {
      out.discountCode = normalizeDiscountCode(discountCode);
    }
    return out;
  };

  const syncUrl = (params: StaySearchBarParams) => {
    router.replace(
      { pathname: '/stay/create', query: buildQueryParams(params) },
      undefined,
      { shallow: true },
    );
  };

  const runSearch = async (params: StaySearchBarParams) => {
    if (isDayTicketOnlyEvent) {
      setActiveParams(params);
      syncUrl(params);
      setResults([]);
      setDidSearchOnce(true);
      setSearchError(null);
      return;
    }
    setSearchError(null);
    setIsSearching(true);
    setActiveParams(params);
    setDismissedEventBlockKey(null);
    syncUrl(params);
    try {
      const searchResponse = await searchStays({
        start: params.start,
        end: params.end,
        adults: params.adults,
        children: params.children,
        ...(bookingType ? { bookingType } : {}),
        ...(eventId ? { eventId } : {}),
      });
      const apiDuration = Number(searchResponse.duration) || 0;
      setSearchDuration(apiDuration);
      let listings = searchResponse.results || [];
      let didFallBackToListing = false;
      if (listingId) {
        const match = listings.find((l) => l._id === listingId);
        if (match) {
          listings = [match];
        } else {
          try {
            const { data } = await api.get(`/listing/${listingId}`);
            if (data?.results) {
              listings = [data.results as StaySearchListing];
              didFallBackToListing = true;
            } else {
              listings = [];
            }
          } catch {
            listings = [];
          }
        }
      }
      setUsedListingFallback(didFallBackToListing);
      setResults(listings);
      setDidSearchOnce(true);
    } catch (err) {
      setSearchError(parseMessageFromError(err));
      setSearchDuration(0);
      setResults([]);
      setUsedListingFallback(false);
      setDidSearchOnce(true);
    } finally {
      setIsSearching(false);
    }
  };

  const redirectToSignup = (params: StaySearchBarParams) => {
    const qs = new URLSearchParams(
      buildQueryParams(params) as Record<string, string>,
    );
    const back = encodeURIComponent(`/stay/create?${qs.toString()}`);
    router.push(`/signup?back=${back}`);
  };

  const eventFoodPayload = eventProp?.foodOption
    ? {
        foodOption: eventProp.foodOption,
        foodOptionId:
          eventProp.foodOption === 'food_package'
            ? eventProp.foodOptionId ?? null
            : null,
      }
    : {};

  const handleDayTicketContinue = async () => {
    const params: StaySearchBarParams = activeParams || {
      start: formatDate(
        (savedStart as string) || eventProp?.start || defaultDateRange.start,
      ),
      end: formatDate(
        (savedEnd as string) || eventProp?.end || defaultDateRange.end,
      ),
      adults: initialAdults,
      children: initialChildren,
      infants: initialInfants,
      pets: initialPets,
    };

    if (!selectedTicketOption) {
      setSearchError(t('bookings_error_no_ticket_option'));
      return;
    }
    if (!isAuthenticated) {
      redirectToSignup(params);
      return;
    }

    setIsCreatingDayTicket(true);
    setSearchError(null);
    try {
      const day = params.start;
      const {
        data: { results: newBooking },
      } = await api.post('/bookings/request', {
        start: day,
        end: day,
        adults: params.adults,
        infants: params.infants,
        pets: params.pets,
        children: params.children,
        eventId,
        ticketOption: selectedTicketOption.name,
        discountCode: normalizeDiscountCode(discountCode) || undefined,
        isDayTicket: true,
        ...eventFoodPayload,
      });
      router.push(`/bookings/${newBooking._id}/food`);
    } catch (err) {
      setSearchError(parseMessageFromError(err));
      setIsCreatingDayTicket(false);
    }
  };

  const handlePickListing = async (listing: StaySearchListing) => {
    if (!activeParams) return;
    if (listing.available === false) return;
    if (!isAuthenticated) {
      redirectToSignup(activeParams);
      return;
    }
    let volunteerPayload = {};
    if (isVolunteerApplication) {
      const draft = readVolunteerApplicationDraft(user?._id, bookingType);
      if (!draft?.volunteerInfo?.application?.agreement?.acceptedAt) {
        router.push(`/volunteer/apply?bookingType=${bookingType}`);
        return;
      }
      volunteerPayload = {
        volunteerInfo: buildVolunteerInfo({
          bookingType: bookingType as 'volunteer' | 'residence',
          skills: draft.volunteerInfo.skills,
          diet: draft.volunteerInfo.diet,
          suggestions: draft.volunteerInfo.suggestions,
          projectId: draft.volunteerInfo.projectId,
          application: draft.volunteerInfo.application,
        }),
      };
    }

    setIsCreatingDraft(listing._id);
    setSearchError(null);
    try {
      const stay = await createStay({
        listingId: listing._id,
        start: activeParams.start,
        end: activeParams.end,
        adults: activeParams.adults,
        children: activeParams.children,
        infants: activeParams.infants,
        pets: activeParams.pets,
        ...volunteerPayload,
        ...(eventId ? { eventId } : {}),
        ...(isEventBooking && eventProp?.foodOption
          ? eventFoodPayload
          : bookingSettings?.foodOptionEnabled &&
              defaultGuestFoodOptionId &&
              !isVolunteerApplication
            ? {
                foodOption: 'food_package',
                foodOptionId: defaultGuestFoodOptionId,
              }
            : {}),
      });
      if (isVolunteerApplication) {
        clearVolunteerApplicationDraft(user?._id, bookingType);
      }
      router.push(`/stay/create/${stay._id}`);
    } catch (err) {
      setSearchError(parseMessageFromError(err));
      setIsCreatingDraft(null);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (didSearchOnce) return;
    if (isDayTicketOnlyEvent) {
      const params: StaySearchBarParams = {
        start: String(savedStart || defaultDateRange.start),
        end: String(savedEnd || defaultDateRange.end),
        adults: initialAdults,
        children: initialChildren,
        infants: initialInfants,
        pets: initialPets,
      };
      setActiveParams(params);
      setDidSearchOnce(true);
      return;
    }
    if (savedStart && savedEnd) {
      void runSearch({
        start: String(savedStart),
        end: String(savedEnd),
        adults: initialAdults,
        children: initialChildren,
        infants: initialInfants,
        pets: initialPets,
      });
      return;
    }
    if (listingId || isEventBooking) {
      void runSearch({
        start: defaultDateRange.start,
        end: defaultDateRange.end,
        adults: initialAdults,
        children: initialChildren,
        infants: initialInfants,
        pets: initialPets,
      });
    }
  }, [
    router.isReady,
    listingId,
    didSearchOnce,
    savedStart,
    savedEnd,
    isEventBooking,
    isDayTicketOnlyEvent,
  ]);

  if (error) return <PageError error={error} />;
  if (eventId && !eventProp) {
    return <PageError error={t('events_slug_edit_error')} />;
  }
  if (!isBookingEnabled) return <FeatureNotEnabled feature="booking" />;

  const pageTitle = isEventBooking
    ? `${eventProp?.name || t('stay_create_event_title')} - ${PLATFORM_NAME}`
    : `${t('stay_create_meta_title')} - ${PLATFORM_NAME}`;
  const pageDescription = isEventBooking
    ? t('stay_create_event_meta_description')
    : t('stay_create_meta_description');
  const canonicalUrl = `${PLATFORM_URL}/stay/create`;

  const goBack = () => {
    if (isEventBooking && eventProp?.slug) {
      router.push(`/events/${eventProp.slug}`);
      return;
    }
    if (isVolunteerApplication) {
      router.push(`/volunteer/apply?bookingType=${bookingType}`);
      return;
    }
    router.push('/stay');
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content={`${PLATFORM_NAME}, accommodations, booking, stay, search, regenerative communities, ecovillage`}
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <main
        id="main-content"
        className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-12"
      >
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>
        </div>

        <div className="text-center mb-6 md:mb-8">
          <Heading level={1} className="text-3xl md:text-5xl mb-3">
            {isEventBooking
              ? eventProp?.name || t('stay_create_event_title')
              : isVolunteerApplication
                ? t('volunteer_application_accommodation_title')
                : t('stay_create_title')}
          </Heading>
          <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto">
            {isEventBooking
              ? t('stay_create_event_subtitle')
              : isVolunteerApplication
                ? t('volunteer_application_accommodation_subtitle')
                : t('stay_create_subtitle')}
          </p>
          {isEventBooking && eventProp?.requireApproval && (
            <p className="text-sm text-gray-600 mt-2">
              {t('bookings_event_requires_approval')}
            </p>
          )}
        </div>

        {isDayTicketOnlyEvent && availableTickets.length > 0 && (
          <div className="mb-8 md:mb-10 max-w-2xl mx-auto">
            <TicketOptions
              items={availableTickets}
              selectTicketOption={selectTicketOption as any}
              selectedTicketOption={selectedTicketOption}
              discountCode={discountCode}
              setDiscountCode={setDiscountCode}
              eventId={eventId}
            />
          </div>
        )}

        <div className="mb-8 md:mb-10">
          <StaySearchBar
            bookingSettings={bookingSettings}
            initialStart={
              hasUrlDates ? String(savedStart) : defaultDateRange.start
            }
            initialEnd={hasUrlDates ? String(savedEnd) : defaultDateRange.end}
            initialAdults={initialAdults}
            initialChildren={initialChildren}
            initialInfants={initialInfants}
            initialPets={initialPets}
            isSearching={isSearching}
            externalError={searchError}
            onSearch={runSearch}
            skipMinDuration={isEventBooking}
            canSelectDates={!isEventBooking || canSelectDates}
            eventStartDate={
              isEventBooking && eventProp?.start
                ? String(eventProp.start)
                : undefined
            }
            eventEndDate={
              isEventBooking && eventProp?.end
                ? String(eventProp.end)
                : undefined
            }
            hideSearchButton={isDayTicketOnlyEvent}
            minNightsOverride={isEventBooking ? null : volunteerMinNights}
            minNightsErrorMessage={
              volunteerMinNights
                ? t(
                    bookingType === 'residence'
                      ? 'bookings_dates_min_residence_stay_error'
                      : 'bookings_dates_min_volunteering_stay_error',
                    { var: volunteerMinNights },
                  )
                : undefined
            }
          />
        </div>

        {isDayTicketOnlyEvent && (
          <div className="mb-8 max-w-md mx-auto">
            <Button
              onClick={handleDayTicketContinue}
              isEnabled={hasValidDayTicket && !isCreatingDayTicket}
              isLoading={isCreatingDayTicket}
            >
              {t('booking_button_continue')}
            </Button>
          </div>
        )}

        {!isDayTicketOnlyEvent && (
          <section
            aria-label={t('stay_create_results_region_label')}
            aria-live="polite"
            aria-busy={isSearching}
          >
            {isSearching && (
              <div
                className="flex justify-center py-12"
                role="status"
                aria-label={t('stay_create_searching')}
              >
                <Spinner />
                <span className="sr-only">{t('stay_create_searching')}</span>
              </div>
            )}

            {showEventBlockNotice && (
              <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50/60 p-4 md:p-6">
                <StayEventBlockedNotice events={blockingEventsForRange} />
              </div>
            )}

            {!isSearching &&
              didSearchOnce &&
              !showEventBlockNotice &&
              results &&
              results.length === 0 && (
                <div
                  className="text-center py-12 border border-dashed rounded-xl"
                  role="status"
                >
                  <Heading level={2} className="text-lg mb-2">
                    {t('stay_create_no_results_title')}
                  </Heading>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {t('stay_create_no_results_description')}
                  </p>
                </div>
              )}

            {!isSearching && results && results.length > 0 && (
              <>
                {listingId && results.length === 1 && (
                  <Heading
                    level={2}
                    className="text-xl mb-4 md:mb-6 text-center md:text-left"
                  >
                    {t('stay_create_focused_results_heading', {
                      name: results[0].name,
                    })}
                  </Heading>
                )}
                {listingId && results.length === 1 && (
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-center md:text-left">
                    {t('stay_create_focused_results_intro')}
                  </p>
                )}
                {!listingId && (
                  <Heading
                    level={2}
                    className="text-lg mb-4 md:mb-6 text-center md:text-left"
                  >
                    {t('stay_create_results_title', {
                      count: results.length,
                    })}
                  </Heading>
                )}
                <ul
                  className={
                    listingId && results.length === 1
                      ? 'max-w-2xl mx-auto flex flex-col gap-6 list-none p-0 w-full'
                      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 list-none p-0'
                  }
                >
                  {results.map((listing) => (
                    <li key={listing._id} className="contents">
                      <ListingResultCard
                        listing={listing}
                        duration={searchDuration}
                        onPick={handlePickListing}
                        isCreating={isCreatingDraft === listing._id}
                        layoutFocused={Boolean(
                          listingId && results.length === 1,
                        )}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </main>

      {isEventBlockModalOpen && (
        <Modal closeModal={() => setDismissedEventBlockKey(searchedRangeKey)}>
          <StayEventBlockedNotice
            events={blockingEventsForRange}
            onDismiss={() => setDismissedEventBlockKey(searchedRangeKey)}
          />
        </Modal>
      )}
    </>
  );
};

const stripHtml = (html: string): string =>
  html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || '';

interface ListingResultCardProps {
  listing: StaySearchListing;
  duration: number;
  onPick: (listing: StaySearchListing) => void;
  isCreating: boolean;
  layoutFocused?: boolean;
}

const ListingResultCard = ({
  listing,
  duration,
  onPick,
  isCreating,
  layoutFocused = false,
}: ListingResultCardProps) => {
  const t = useTranslations();
  const photos = (listing.photos || []).map((id: string) => ({
    image: `${cdn}${id}-post-md.jpg`,
  }));

  const headingId = `listing-${listing._id}-name`;
  const descriptionPreview = listing.description
    ? stripHtml(listing.description).slice(0, 140)
    : '';
  const isUnavailable = listing.available === false;

  return (
    <article
      aria-labelledby={headingId}
      className={`group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg focus-within:shadow-lg focus-within:ring-2 focus-within:ring-accent transition-shadow ${
        layoutFocused ? 'shadow-md md:flex-row md:items-stretch md:max-h-none' : ''
      } ${isUnavailable ? 'opacity-75' : ''}`}
    >
      <div
        className={`bg-gray-100 overflow-hidden shrink-0 ${
          layoutFocused
            ? 'aspect-[16/10] md:w-[min(44%,420px)] md:aspect-auto md:min-h-[280px]'
            : 'aspect-[4/3]'
        }`}
      >
        {photos.length > 0 ? (
          <Slider slides={photos} reverse={false} isListingPreview />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-gray-300"
            aria-hidden="true"
          >
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              focusable="false"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div
        className={`flex flex-col gap-3 flex-1 ${
          layoutFocused ? 'p-5 md:p-6 md:justify-center' : 'p-4'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            id={headingId}
            className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug min-w-0 flex-1"
          >
            {listing.name}
          </h3>
          <StayListingUnitsCard listing={listing} />
        </div>

        {descriptionPreview && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {descriptionPreview}
          </p>
        )}

        <StayListingAccommodationPrice listing={listing} duration={duration} />

        <div className="mt-auto pt-2">
          <Button
            onClick={() => onPick(listing)}
            isLoading={isCreating}
            isEnabled={!isCreating && !isUnavailable}
            className="min-h-[44px]"
          >
            {isUnavailable
              ? t('listing_preview_not_available')
              : t('stay_create_reserve_button')}
          </Button>
        </div>
      </div>
    </article>
  );
};

StayCreatePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const bookingSettings = config.booking as BookingSettings;
    const generalConfig = (config.general || null) as GeneralConfig | null;
    const volunteerConfig = (config.volunteering ||
      null) as VolunteerConfig | null;
    const eventIdParam = context.query?.eventId;
    const eventId =
      typeof eventIdParam === 'string'
        ? eventIdParam
        : Array.isArray(eventIdParam)
          ? eventIdParam[0]
          : undefined;

    let defaultGuestFoodOptionId: string | null = null;
    if (bookingSettings?.foodOptionEnabled) {
      const foodRes = await api.get('/food').catch(() => null);
      const foodOptions: FoodOption[] = foodRes?.data?.results ?? [];
      const guestFiltered = getFoodOptionsForBookingContext(
        foodOptions,
        'guests',
      );
      const pool = guestFiltered.length > 0 ? guestFiltered : foodOptions;
      defaultGuestFoodOptionId = getDefaultSelectedFoodOptionId(pool);
    }

    if (eventId) {
      const [ticketsAvailable, event] = await Promise.all([
        api.get(`/bookings/event/${eventId}/availability`).catch(() => null),
        api.get(`/event/${eventId}`).catch(() => null),
      ]);

      return {
        bookingSettings,
        generalConfig,
        volunteerConfig,
        defaultGuestFoodOptionId,
        ticketOptions: ticketsAvailable?.data?.ticketOptions,
        event: event?.data?.results ?? null,
        calendarBlockingEvents: [],
      };
    }

    // Only needed to explain why a guest stay came back unavailable, so a
    // failure here just falls back to the generic no-results message.
    const futureEventsRes = await api
      .get(
        `/event?where=${JSON.stringify({
          end: { $gt: new Date() },
        })}&limit=100`,
      )
      .catch(() => null);
    const calendarBlockingEvents: CalendarBlockingEvent[] = (
      (futureEventsRes?.data?.results as Event[]) ?? []
    )
      .filter((event) => event?.blocksBookingCalendar)
      .map(({ _id, name, slug, start, end, paid, blocksBookingCalendar }) => ({
        _id,
        name,
        slug,
        start,
        end,
        paid,
        blocksBookingCalendar,
      }));

    return {
      bookingSettings,
      generalConfig,
      volunteerConfig,
      defaultGuestFoodOptionId,
      event: null,
      ticketOptions: [],
      calendarBlockingEvents,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingSettings: null,
      generalConfig: null,
      volunteerConfig: null,
      defaultGuestFoodOptionId: null,
      event: null,
      ticketOptions: [],
      calendarBlockingEvents: [],
    };
  }
};

export default StayCreatePage;
