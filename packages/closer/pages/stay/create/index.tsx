import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import { type BookingCoGuestUser } from '../../../components/BookingCoGuests/BookingCoGuests';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import Modal from '../../../components/Modal';
import PageError from '../../../components/PageError';
import Slider from '../../../components/Slider';
import StaySearchBar, {
  StaySearchBarParams,
} from '../../../components/StaySearchBar';
import Switch from '../../../components/Switch';
import TicketOptions from '../../../components/TicketOptions';
import StayEventBlockedNotice from '../../../components/booking/stayEventBlockedNotice';
import StayListingAccommodationPrice from '../../../components/booking/stayListingAccommodationPrice';
import StayListingUnitsCard from '../../../components/booking/stayListingUnitsCard';
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
import { Event, Project, TicketOption } from '../../../types';
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
  userCanCreateTeamBooking,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { normalizeDiscountCode } from '../../../utils/discountCode';
import {
  CalendarBlockingEvent,
  getCalendarBlockingEventsInRange,
} from '../../../utils/events.helpers';
import { buildCreateStayGuestsPayload } from '../../../utils/bookingCoGuests.helpers';
import { getSiteUrl } from '../../../utils/siteUrl';
import {
  clearStayCoGuestsDraft,
  readStayCoGuestsDraft,
  writeStayCoGuestsDraft,
} from '../../../utils/stayCoGuestsDraft';
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
  /** Projects named by ?projectId on a residence booking — they scope the dates. */
  residenceProjects?: Project[];
  error?: string;
  messages?: any;
}

const SITE_URL = getSiteUrl();

const formatDate = (d: Date | string | null) =>
  d ? dayjs(d).format('YYYY-MM-DD') : '';

const readQueryParam = (value: string | string[] | undefined) =>
  typeof value === 'string'
    ? value
    : Array.isArray(value)
    ? value[0]
    : undefined;

const areSearchParamsEqual = (
  a: StaySearchBarParams | null,
  b: StaySearchBarParams | null,
) =>
  !!a &&
  !!b &&
  a.start === b.start &&
  a.end === b.end &&
  a.adults === b.adults &&
  a.children === b.children &&
  a.infants === b.infants &&
  a.pets === b.pets;

const splitProjectIds = (value: string | undefined) =>
  value
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean) || [];

const StayCreatePage = ({
  bookingSettings,
  generalConfig,
  volunteerConfig,
  defaultGuestFoodOptionId,
  event: eventProp,
  ticketOptions: ticketOptionsProp,
  calendarBlockingEvents,
  residenceProjects,
  error,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
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
    projectId: projectIdQuery,
    isTeamBooking: isTeamBookingQuery,
  } = router.query || {};

  const readParam = readQueryParam;

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
  const wantsTeamBookingFromUrl = readParam(isTeamBookingQuery) === 'true';
  const projectIdParam = readParam(projectIdQuery);
  const projectIds = useMemo(
    () => splitProjectIds(projectIdParam),
    [projectIdParam],
  );

  const availableTickets = useMemo(
    () => (ticketOptionsProp || []).filter((option) => option.available > 0),
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

  /** Residents stay for the duration of the project, so the project run is the
   *  only bookable window. With several projects picked it spans all of them. */
  const projects = useMemo(
    () =>
      bookingType === 'residence' && residenceProjects?.length
        ? residenceProjects
        : [],
    [bookingType, residenceProjects],
  );

  const projectNames = projects
    .map((project) => project.name)
    .filter(Boolean)
    .join(', ');

  const projectWindow = useMemo(() => {
    const starts = projects
      .map((project) => dayjs(project.start))
      .filter((date) => date.isValid());
    const ends = projects
      .map((project) => dayjs(project.end))
      .filter((date) => date.isValid());
    if (!starts.length || !ends.length) return null;
    const start = starts.reduce((a, b) => (b.isBefore(a) ? b : a));
    const end = ends.reduce((a, b) => (b.isAfter(a) ? b : a));
    if (!end.isAfter(start)) return null;
    const today = dayjs().startOf('day');
    // A project already underway can only be joined from today onwards.
    const bookableStart = start.isBefore(today) ? today : start.startOf('day');
    if (!end.isAfter(bookableStart)) return null;
    return {
      start: bookableStart.format('YYYY-MM-DD'),
      end: end.startOf('day').format('YYYY-MM-DD'),
    };
  }, [projects]);

  const defaultDateRange = useMemo(() => {
    if (isEventBooking && eventProp?.start && eventProp?.end) {
      return {
        start: dayjs(eventProp.start).format('YYYY-MM-DD'),
        end: dayjs(eventProp.end).format('YYYY-MM-DD'),
      };
    }
    const nights = Math.max(minNights, 1);
    if (projectWindow) {
      const windowStart = dayjs(projectWindow.start);
      const windowEnd = dayjs(projectWindow.end);
      const preferred = dayjs().add(14, 'day').startOf('day');
      // Start at the usual two weeks out only when the minimum stay still fits
      // before the project ends, otherwise open at the start of the window.
      const start =
        preferred.isAfter(windowStart) &&
        !preferred.add(nights, 'day').isAfter(windowEnd)
          ? preferred
          : windowStart;
      const end = start.add(nights, 'day');
      return {
        start: start.format('YYYY-MM-DD'),
        end: (end.isAfter(windowEnd) ? windowEnd : end).format('YYYY-MM-DD'),
      };
    }
    const start = dayjs().add(14, 'day').startOf('day');
    const end = start.add(nights, 'day');
    return {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
    };
  }, [
    minNights,
    isEventBooking,
    eventProp?.start,
    eventProp?.end,
    projectWindow,
  ]);

  /** Dates carried in the URL are ignored when they fall outside the project run. */
  const urlDatesFitProjectWindow =
    !projectWindow ||
    (!dayjs(String(savedStart)).isBefore(dayjs(projectWindow.start)) &&
      !dayjs(String(savedEnd)).isAfter(dayjs(projectWindow.end)));

  const hasUrlDates =
    Boolean(savedStart && savedEnd) && urlDatesFitProjectWindow;

  // Collected in the guests popover and posted with the booking: a draft stay
  // rejects edits, so this is the only chance to send them. Restored from the
  // session because an unauthenticated guest is sent through /signup first.
  const [coGuests, setCoGuests] = useState<BookingCoGuestUser[]>([]);

  useEffect(() => {
    const stored = readStayCoGuestsDraft();
    if (stored.length > 0) setCoGuests(stored);
  }, []);

  useEffect(() => {
    writeStayCoGuestsDraft(coGuests);
  }, [coGuests]);

  const [activeParams, setActiveParams] = useState<StaySearchBarParams | null>(
    () => {
      if (hasUrlDates) {
        return {
          start: formatDate(String(savedStart)),
          end: formatDate(String(savedEnd)),
          adults: initialAdults,
          children: initialChildren,
          infants: initialInfants,
          pets: initialPets,
        };
      }
      return null;
    },
  );

  /** What the search bar currently holds — may be ahead of the last search. */
  const [pendingParams, setPendingParams] =
    useState<StaySearchBarParams | null>(null);

  const [searchDuration, setSearchDuration] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState<string | null>(null);
  const [isCreatingDayTicket, setIsCreatingDayTicket] = useState(false);
  const [results, setResults] = useState<StaySearchListing[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [didSearchOnce, setDidSearchOnce] = useState(false);
  const [selectedTicketOption, selectTicketOption] =
    useState<TicketOption | null>(null);
  const [discountCode, setDiscountCode] = useState(() =>
    normalizeDiscountCode(readParam(discountCodeQuery)),
  );
  const [dismissedEventBlockKey, setDismissedEventBlockKey] = useState<
    string | null
  >(null);
  /**
   * Staff booking for the team. Kept in the URL so it survives the /signup
   * detour and a shared link, and re-read on every search because a team stay
   * ignores the event calendar blocks a guest stay respects.
   */
  const [wantsTeamBooking, setWantsTeamBooking] = useState(
    wantsTeamBookingFromUrl,
  );
  /** True when the shown listing came from /listing rather than the search — its availability is unproven. */
  const [usedListingFallback, setUsedListingFallback] = useState(false);

  useEffect(() => {
    if (!isDayTicketOnlyEvent) {
      selectTicketOption(null);
      return;
    }
    selectTicketOption((prev) => {
      if (
        prev &&
        availableTickets.some((option) => option.name === prev.name)
      ) {
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

  /** The server ignores the flag from anyone else, so the notice and the results
   *  would otherwise disagree for a non-staff caller carrying it in the URL. */
  const canCreateTeamBooking = userCanCreateTeamBooking(user?.roles);
  const isTeamBooking = canCreateTeamBooking && wantsTeamBooking;
  const canPickTeamBooking =
    canCreateTeamBooking && !isVolunteerApplication && !isDayTicketOnlyEvent;

  const canSelectDates = eventProp?.canSelectDates !== false;
  const hasValidDayTicket =
    !isDayTicketOnlyEvent || Boolean(selectedTicketOption);

  /**
   * Events flagged `blocksBookingCalendar` make /stays/search return every
   * listing as unavailable, so guests otherwise face a grid of greyed out
   * options with no reason given. Stays booked for an event, volunteer stays
   * and team stays are exempt from the block, so the notice never applies to
   * them.
   */
  const blockingEventsForRange = useMemo(
    () =>
      isEventBooking || isVolunteerApplication || isTeamBooking
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
      isTeamBooking,
    ],
  );

  /**
   * The dates or guests were edited after the last search, so the listings on
   * screen — and the prices on them — are for a stay the guest no longer wants.
   */
  const hasPendingChanges =
    !!activeParams &&
    !!pendingParams &&
    !areSearchParamsEqual(activeParams, pendingParams);

  const hasBookableResult =
    !usedListingFallback &&
    Boolean(results?.some((listing) => listing.available !== false));

  const showEventBlockNotice =
    didSearchOnce &&
    !isSearching &&
    !hasPendingChanges &&
    !!results &&
    !hasBookableResult &&
    blockingEventsForRange.length > 0;

  const searchedRangeKey = activeParams
    ? `${activeParams.start}_${activeParams.end}`
    : '';

  const isEventBlockModalOpen =
    showEventBlockNotice && dismissedEventBlockKey !== searchedRangeKey;

  /** Keeps the picked project through the detour to the application form. */
  const applyUrl = `/volunteer/apply?bookingType=${bookingType}${
    projectIds.length
      ? `&projectId=${encodeURIComponent(projectIds.join(','))}`
      : ''
  }`;

  const buildQueryParams = (
    params: StaySearchBarParams,
    teamBooking: boolean = isTeamBooking,
  ) => {
    const out: Record<string, string> = {
      start: params.start,
      end: params.end,
      adults: String(params.adults),
    };
    if (teamBooking) out.isTeamBooking = 'true';
    if (params.children) out.children = String(params.children);
    if (params.infants) out.infants = String(params.infants);
    if (params.pets) out.pets = String(params.pets);
    if (listingId) out.listingId = listingId;
    if (bookingType) out.bookingType = bookingType;
    if (projectIds.length) out.projectId = projectIds.join(',');
    if (eventId) out.eventId = eventId;
    if (isDayTicketOnlyEvent && selectedTicketOption?.name) {
      out.ticketOption = selectedTicketOption.name;
    }
    if (isDayTicketOnlyEvent && discountCode) {
      out.discountCode = normalizeDiscountCode(discountCode);
    }
    return out;
  };

  const syncUrl = (
    params: StaySearchBarParams,
    teamBooking: boolean = isTeamBooking,
  ) => {
    router.replace(
      {
        pathname: '/stay/create',
        query: buildQueryParams(params, teamBooking),
      },
      undefined,
      { shallow: true },
    );
  };

  const runSearch = async (
    rawParams: StaySearchBarParams,
    // The toggle searches with the value it just set, which the state does not
    // hold yet on this render.
    teamBookingOverride?: boolean,
  ) => {
    const teamBooking =
      canCreateTeamBooking && (teamBookingOverride ?? wantsTeamBooking);
    // Normalised so the comparison against the search bar's selection, which is
    // always YYYY-MM-DD, never reports a change that did not happen.
    const params: StaySearchBarParams = {
      ...rawParams,
      start: formatDate(rawParams.start),
      end: formatDate(rawParams.end),
    };
    if (isDayTicketOnlyEvent) {
      setActiveParams(params);
      syncUrl(params, teamBooking);
      setResults([]);
      setDidSearchOnce(true);
      setSearchError(null);
      return;
    }
    setSearchError(null);
    setIsSearching(true);
    setActiveParams(params);
    setDismissedEventBlockKey(null);
    syncUrl(params, teamBooking);
    try {
      const searchResponse = await searchStays({
        start: params.start,
        end: params.end,
        adults: params.adults,
        children: params.children,
        ...(bookingType ? { bookingType } : {}),
        ...(eventId ? { eventId } : {}),
        ...(teamBooking ? { isTeamBooking: true } : {}),
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

  const handleTeamBookingChange = (nextValue: boolean) => {
    setWantsTeamBooking(nextValue);
    const params = pendingParams || activeParams;
    if (!params) return;
    void runSearch(params, nextValue);
  };

  const redirectToSignup = (params: StaySearchBarParams) => {
    const qs = new URLSearchParams(
      buildQueryParams(params) as Record<string, string>,
    );
    const back = encodeURIComponent(`/stay/create?${qs.toString()}`);
    router.push(`/signup?back=${back}`);
  };

  const coGuestPayload = () => buildCreateStayGuestsPayload(coGuests);

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
    const params: StaySearchBarParams = pendingParams ||
      activeParams || {
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
      // No listingId: a day ticket grants event access, not a space.
      const stay = await createStay({
        start: day,
        end: day,
        adults: params.adults,
        infants: params.infants,
        pets: params.pets,
        children: params.children,
        eventId,
        ticketOption: selectedTicketOption.name,
        eventDiscount: normalizeDiscountCode(discountCode) || undefined,
        isDayTicket: true,
        ...coGuestPayload(),
        ...eventFoodPayload,
      });
      clearStayCoGuestsDraft();
      router.push(`/stay/create/${stay._id}`);
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
        router.push(applyUrl);
        return;
      }
      volunteerPayload = {
        volunteerInfo: buildVolunteerInfo({
          bookingType: bookingType as 'volunteer' | 'residence',
          skills: draft.volunteerInfo.skills,
          diet: draft.volunteerInfo.diet,
          suggestions: draft.volunteerInfo.suggestions,
          projectId: draft.volunteerInfo.projectId?.length
            ? draft.volunteerInfo.projectId
            : projectIds,
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
        ...coGuestPayload(),
        ...volunteerPayload,
        ...(eventId ? { eventId } : {}),
        ...(isTeamBooking ? { isTeamBooking: true } : {}),
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
      clearStayCoGuestsDraft();
      router.push(`/stay/create/${stay._id}`);
    } catch (err) {
      setSearchError(parseMessageFromError(err));
      setIsCreatingDraft(null);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (didSearchOnce) return;
    // The flag only counts for staff, so the first search has to wait for the
    // roles rather than search once as a guest and once as a team.
    if (wantsTeamBookingFromUrl && isAuthLoading) return;
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
    if (hasUrlDates) {
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
    wantsTeamBookingFromUrl,
    isAuthLoading,
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
  const canonicalUrl = SITE_URL ? `${SITE_URL}/stay/create` : '';

  const goBack = () => {
    if (isEventBooking && eventProp?.slug) {
      router.push(`/events/${eventProp.slug}`);
      return;
    }
    if (isVolunteerApplication) {
      router.push(applyUrl);
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
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
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
              : projectNames
              ? t('stay_create_residence_project_subtitle', {
                  project: projectNames,
                })
              : isVolunteerApplication
              ? t('volunteer_application_accommodation_subtitle')
              : t('stay_create_subtitle')}
          </p>
          {projectWindow && (
            <p className="text-sm text-gray-600 mt-2">
              {t('stay_create_residence_project_dates_hint', {
                start: dayjs(projectWindow.start).format('MMM D, YYYY'),
                end: dayjs(projectWindow.end).format('MMM D, YYYY'),
              })}
            </p>
          )}
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
            onParamsChange={setPendingParams}
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
            coGuests={coGuests}
            onCoGuestsChange={setCoGuests}
            minDate={projectWindow?.start}
            maxDate={projectWindow?.end}
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
          {canPickTeamBooking && (
            <div className="mt-4 flex flex-row items-center justify-end gap-3 [&_.switch]:mb-0">
              <span id="stay-search-team-booking-label" className="text-sm">
                {t('stay_create_search_team_booking')}
              </span>
              <Switch
                name="stay-search-team-booking"
                label=""
                labelledBy="stay-search-team-booking-label"
                checked={wantsTeamBooking}
                disabled={isSearching}
                onChange={handleTeamBookingChange}
              />
            </div>
          )}
          {canPickTeamBooking && wantsTeamBooking && (
            <p className="mt-1 text-sm text-gray-600 text-right">
              {t('stay_create_search_team_booking_hint')}
            </p>
          )}
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

            {!isSearching && hasPendingChanges && (
              <div
                className="text-center py-12 border border-dashed rounded-xl"
                role="status"
              >
                <Heading level={2} className="text-lg mb-2">
                  {t('stay_create_stale_search_title')}
                </Heading>
                <p className="text-gray-600 max-w-md mx-auto">
                  {t('stay_create_stale_search_description')}
                </p>
              </div>
            )}

            {showEventBlockNotice && (
              <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50/60 p-4 md:p-6">
                <StayEventBlockedNotice events={blockingEventsForRange} />
              </div>
            )}

            {!isSearching &&
              didSearchOnce &&
              !hasPendingChanges &&
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

            {!isSearching &&
              !hasPendingChanges &&
              results &&
              results.length > 0 && (
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
  html
    ?.replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim() || '';

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
        layoutFocused
          ? 'shadow-md md:flex-row md:items-stretch md:max-h-none'
          : ''
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
    const eventId = readQueryParam(context.query?.eventId);

    // A residence booking is scoped to the project it is for: its name goes in
    // the intro and its run limits the calendar.
    const projectIds =
      readQueryParam(context.query?.bookingType) === 'residence'
        ? splitProjectIds(readQueryParam(context.query?.projectId)).slice(0, 10)
        : [];
    const residenceProjects: Project[] = projectIds.length
      ? (
          await Promise.all(
            projectIds.map((id) => api.get(`/project/${id}`).catch(() => null)),
          )
        )
          .map((res) => res?.data?.results as Project | undefined)
          .filter((project): project is Project => Boolean(project))
      : [];

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
        api.get(`/stays/event/${eventId}/availability`).catch(() => null),
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
        residenceProjects,
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
      residenceProjects,
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
      residenceProjects: [],
    };
  }
};

export default StayCreatePage;
