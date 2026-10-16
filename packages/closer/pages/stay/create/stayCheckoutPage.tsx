import Head from 'next/head';
import { useRouter } from 'next/router';

import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import Conditions from '../../../components/Conditions';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
import PageError from '../../../components/PageError';
import Switch from '../../../components/Switch';
import TicketOptions from '../../../components/TicketOptions';
import { StayPaymentSummary } from '../../../components/booking/StayPaymentSummary';
import { StayTokenCreditHint } from '../../../components/booking/StayTokenCreditHint';
import BookingSurface from '../../../components/booking/bookingSurface';
import BookingUnitsNote from '../../../components/booking/bookingUnitsNote';
import { ErrorMessage, Information } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Checkbox from '../../../components/ui/Checkbox';
import Heading from '../../../components/ui/Heading';
import Select from '../../../components/ui/Select/Dropdown';
import Spinner from '../../../components/ui/Spinner';
import { Textarea } from '../../../components/ui/textarea';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import { SHARED_ACCOMMODATION_PREFERENCES } from '../../../constants/shared.constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import {
  BookingSettings,
  GeneralConfig,
  VolunteerConfig,
} from '../../../types/api';
import { Listing } from '../../../types/booking';
import { Event, TicketOption } from '../../../types/event';
import { FoodOption } from '../../../types/food';
import { Stay } from '../../../types/stay';
import { cdn } from '../../../utils/api';
import {
  FoodBookingContext,
  getDefaultSelectedFoodOptionId,
  getFoodOption,
  getFoodOptionsForBookingContext,
  userCanCreateTeamBooking,
} from '../../../utils/booking.helpers';
import { normalizeIsFriendsBooking } from '../../../utils/bookingUtils';
import { parseMessageFromError } from '../../../utils/common';
import { getDietOptions, toSingleDiet } from '../../../utils/dietOptions';
import { normalizeDiscountCode } from '../../../utils/discountCode';
import { fetchEvent } from '../../../utils/events';
import { fetchFoodOptions } from '../../../utils/food';
import { priceFormat } from '../../../utils/helpers';
import { fetchListing } from '../../../utils/listings';
import { linkedMetricFields, logMetric } from '../../../utils/metrics';
import { patchUserAndSyncAuthStore } from '../../../utils/platformUserSync';
import {
  canEditStayPreparation,
  getStayCheckoutPath,
} from '../../../utils/stayPaymentRouting.helpers';
import { buildStayCreateHrefFromStay } from '../../../utils/stayRouting.helpers';
import {
  type SendStayToFriendsResult,
  applyOptimisticTeamBookingToStay,
  claimStayAsFriend,
  fetchEventAvailability,
  getStay,
  isStayCheckoutDraft,
  isVolunteerStay,
  sendStayToFriends,
  submitStay,
  updateStayOptions,
} from '../../../utils/stays.api';

dayjs.extend(dayOfYear);

const formatModalTwoDecimals = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : '0.00';

const readQueryParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const StayCheckoutFoodPhotoPreview = ({
  option,
  photoSlideByOptionId,
  setPhotoSlideByOptionId,
  cdnUrl,
}: {
  option: FoodOption;
  photoSlideByOptionId: Record<string, number>;
  setPhotoSlideByOptionId: Dispatch<SetStateAction<Record<string, number>>>;
  cdnUrl: string | undefined;
}) => {
  const photos = option.photos ?? [];
  const currentPhotoIndex = photoSlideByOptionId[option._id] ?? 0;
  const setCurrentPhotoIndex = (next: number) => {
    setPhotoSlideByOptionId((prev) => ({ ...prev, [option._id]: next }));
  };
  const base = cdnUrl ?? '';
  return (
    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-dark/10 relative">
      <img
        src={`${base}${photos[currentPhotoIndex]}-post-md.jpg`}
        alt=""
        className="w-full h-full object-cover"
      />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-0 top-1/2 -translate-y-1/2 p-0.5 bg-white/80 rounded-r text-neutral-dark hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPhotoIndex(
                currentPhotoIndex === 0
                  ? photos.length - 1
                  : currentPhotoIndex - 1,
              );
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 bg-white/80 rounded-l text-neutral-dark hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPhotoIndex(
                currentPhotoIndex >= photos.length - 1
                  ? 0
                  : currentPhotoIndex + 1,
              );
            }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="absolute bottom-0.5 right-0.5 bg-white/80 text-[10px] px-1 rounded">
            {currentPhotoIndex + 1}/{photos.length}
          </span>
        </>
      )}
    </div>
  );
};

interface Props {
  bookingSettings: BookingSettings | null;
  generalConfig: GeneralConfig | null;
  volunteerConfig: VolunteerConfig | null;
  foodOptions: FoodOption[] | null;
  error?: string;
}

const StayCheckoutPage = ({
  bookingSettings,
  generalConfig,
  volunteerConfig,
  foodOptions,
  error,
}: Props) => {
  const router = useRouter();
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const idParam = router.query.slug ?? router.query.id;
  const stayId = typeof idParam === 'string' ? idParam : idParam?.[0];
  // Invite emails link here as /stay/create/<stayId>?isFriend=true.
  const isFriend = normalizeIsFriendsBooking(router.query.isFriend);

  const isBookingEnabled =
    !!bookingSettings && process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [stay, setStay] = useState<Stay | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [friendClaimDenied, setFriendClaimDenied] = useState(false);
  useEffect(() => {
    if (!router.isReady || !stayId || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setPageError(null);
      setFriendClaimDenied(false);
      try {
        let next: Stay;
        if (isFriend) {
          // Read first: the stay is only readable once the caller is in
          // managedBy, so a 401 here just means they have not claimed yet.
          // Claiming is idempotent, so a second visit is harmless.
          const existing = await getStay(stayId).catch(() => null);
          if (existing) {
            next = existing;
          } else {
            try {
              await claimStayAsFriend(stayId);
            } catch {
              // 403: this account's email is not on the invite list.
              if (!cancelled) setFriendClaimDenied(true);
              return;
            }
            next = await getStay(stayId);
          }
        } else {
          next = await getStay(stayId);
        }
        if (cancelled) return;
        setStay(next);
        if (next.listing) {
          try {
            const nextListing = await fetchListing(next.listing);
            if (!cancelled) setListing(nextListing ?? null);
          } catch (err) {
            console.warn('Could not load listing', err);
          }
        }
      } catch (err) {
        if (!cancelled) setPageError(parseMessageFromError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, stayId, isFriend, isAuthenticated]);

  const isEditor = Boolean(
    stay &&
    (stay.createdBy === user?._id ||
      user?.roles?.some((role) => ['admin', 'space-host'].includes(role))),
  );
  const isEditMode =
    router.query.edit === 'true' &&
    isEditor &&
    !!stay &&
    canEditStayPreparation(stay);
  const destination = stay ? getStayCheckoutPath(stay) : null;
  const needsRedirect =
    !!stay &&
    !isStayCheckoutDraft(stay) &&
    !isEditMode &&
    !(isFriend && destination === `/stay/${stay._id}/payment`);
  useEffect(() => {
    if (needsRedirect && destination) void router.replace(destination);
  }, [needsRedirect, destination, router]);

  if (error) return <PageError error={error} />;
  if (!isBookingEnabled) return <FeatureNotEnabled feature="booking" />;

  const pageTitle = `${t(
    'stay_create_checkout_meta_title',
  )} - ${PLATFORM_NAME}`;

  const SeoHead = (
    <Head>
      <title>{pageTitle}</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta
        name="description"
        content={t('stay_create_checkout_meta_description')}
      />
    </Head>
  );

  if (!isAuthenticated) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="w-full max-w-screen-sm mx-auto p-4 md:p-6 text-center"
        >
          <Heading level={1} className="text-2xl md:text-3xl">
            {t('stay_create_login_required_title')}
          </Heading>
          <p className="mt-3 mb-6 text-muted-foreground">
            {t('stay_create_login_required_description')}
          </p>
          <Button
            onClick={() => router.push('/login')}
            isFullWidth={false}
            className="min-h-[44px]"
          >
            {t('login_title')}
          </Button>
        </main>
      </>
    );
  }

  if (isLoading || needsRedirect) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="flex justify-center py-24"
          role="status"
          aria-label={t('stay_create_loading')}
        >
          <Spinner />
          <span className="sr-only">{t('stay_create_loading')}</span>
        </main>
      </>
    );
  }

  if (friendClaimDenied) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="w-full max-w-screen-sm mx-auto p-4 md:p-6 text-center"
        >
          <Heading level={1} className="text-2xl md:text-3xl">
            {t('stay_friend_claim_not_invited_title')}
          </Heading>
          <p className="mt-3 mb-6 text-muted-foreground">
            {t('stay_friend_claim_not_invited_description')}
          </p>
          <Button
            onClick={() => router.push('/login')}
            isFullWidth={false}
            className="min-h-[44px]"
          >
            {t('stay_friend_claim_switch_account')}
          </Button>
        </main>
      </>
    );
  }

  if (pageError || !stay) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="w-full max-w-screen-sm mx-auto p-4 md:p-6"
        >
          <div role="alert" aria-live="assertive">
            <ErrorMessage error={pageError || t('stay_create_not_found')} />
          </div>
          <Button
            onClick={() => router.push('/stay/create')}
            isFullWidth={false}
            className="mt-4 min-h-[44px]"
          >
            {t('stay_create_back_to_search')}
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      {SeoHead}

      <StayCheckoutContent
        stay={stay}
        listing={listing}
        bookingSettings={bookingSettings}
        volunteerConfig={volunteerConfig}
        foodOptions={foodOptions ?? []}
        isFriend={isFriend}
        isEditMode={isEditMode}
      />
    </>
  );
};

interface ContentProps {
  stay: Stay;
  listing: Listing | null;
  bookingSettings: BookingSettings | null;
  volunteerConfig: VolunteerConfig | null;
  foodOptions: FoodOption[];
  /** Claimed friend paying someone else's stay: they may pay, but not edit,
   * cancel, change options, or token-stake. */
  isFriend: boolean;
  isEditMode: boolean;
}

const StayCheckoutContent = ({
  stay,
  listing,
  bookingSettings,
  volunteerConfig,
  foodOptions,
  isFriend,
  isEditMode,
}: ContentProps) => {
  const router = useRouter();
  const t = useTranslations();
  const { VISITORS_GUIDE, APP_NAME } = useConfig() || {};
  const { user: authUser, refetchUser, setUser } = useAuth();
  const { platform }: any = usePlatform();

  const canCreateTeamBooking = userCanCreateTeamBooking(authUser?.roles);

  const [currentStay, setCurrentStay] = useState<Stay>(stay);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isSavingOptions, setIsSavingOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInvitingFriends, setIsInvitingFriends] = useState(false);
  const [friendsInvite, setFriendsInvite] =
    useState<SendStayToFriendsResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const submitInFlight = useRef(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingStayMessage, setIsSavingStayMessage] = useState(false);
  const [userPreferences, setUserPreferences] = useState<{
    diet: string;
    sharedAccomodation: string;
  }>({ diet: '', sharedAccomodation: '' });
  const [stayMessage, setStayMessage] = useState(stay.message || '');
  const [stayEvent, setStayEvent] = useState<Event | null>(null);
  const [eventTicketOptions, setEventTicketOptions] = useState<TicketOption[]>(
    [],
  );
  const [selectedTicketOption, setSelectedTicketOption] =
    useState<TicketOption | null>(null);
  const [eventDiscountCode, setEventDiscountCode] = useState('');
  const [isLoadingEventTickets, setIsLoadingEventTickets] = useState(false);
  const [foodPhotoSlideByOptionId, setFoodPhotoSlideByOptionId] = useState<
    Record<string, number>
  >({});

  const draftFoodDefaultAppliedRef = useRef<string | null>(null);
  const preTeamPriceLockRef = useRef<Stay['priceLock'] | null>(null);
  const [isSavingTeamBooking, setIsSavingTeamBooking] = useState(false);

  useEffect(() => {
    draftFoodDefaultAppliedRef.current = null;
    preTeamPriceLockRef.current = null;
  }, [stay._id]);

  useEffect(() => {
    draftFoodDefaultAppliedRef.current = null;
  }, [currentStay.isTeamBooking]);

  useEffect(() => {
    setCurrentStay(stay);
  }, [stay._id]);

  useEffect(() => {
    if (!authUser?.preferences) return;
    setUserPreferences({
      diet: toSingleDiet(authUser.preferences.diet),
      sharedAccomodation: authUser.preferences.sharedAccomodation || '',
    });
  }, [authUser?._id, authUser?.preferences]);

  useEffect(() => {
    setStayMessage(currentStay.message || '');
  }, [currentStay._id, currentStay.message]);

  useEffect(() => {
    const eventId = currentStay.eventId;
    if (!eventId) {
      setStayEvent(null);
      setEventTicketOptions([]);
      setSelectedTicketOption(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoadingEventTickets(true);
      try {
        const [eventRes, availabilityRes] = await Promise.all([
          fetchEvent(eventId),
          fetchEventAvailability(eventId).catch(() => null),
        ]);
        if (cancelled) return;
        const event = eventRes ?? null;
        setStayEvent(event);
        const rawOptions: TicketOption[] =
          availabilityRes?.ticketOptions || event?.ticketOptions || [];
        // A stay that holds a listing is an overnight stay, so a day ticket
        // would not match it. A stay without one buys event access only and
        // can carry either kind — a day ticket, or a full ticket for a guest
        // whose own booking already covers the nights.
        const relevant = rawOptions.filter(
          (option) =>
            option.available > 0 &&
            (currentStay.listing ? !option.isDayTicket : true),
        );
        setEventTicketOptions(relevant);
        const savedName = currentStay.ticketOption?.name;
        const matched = savedName
          ? relevant.find((option) => option.name === savedName) || null
          : null;
        setSelectedTicketOption((prev) => {
          if (matched) return matched;
          if (prev && relevant.some((option) => option.name === prev.name)) {
            return prev;
          }
          return null;
        });
      } catch {
        if (!cancelled) {
          setStayEvent(null);
          setEventTicketOptions([]);
          setSelectedTicketOption(null);
        }
      } finally {
        if (!cancelled) setIsLoadingEventTickets(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentStay.eventId, currentStay.listing]);

  const stayMetricFields = useMemo(
    () => linkedMetricFields('Stay', currentStay?._id),
    [currentStay?._id],
  );

  const stayCheckoutViewMetricRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentStay?._id) return;
    const idKey = String(currentStay._id);
    if (stayCheckoutViewMetricRef.current === idKey) return;
    stayCheckoutViewMetricRef.current = idKey;
    const pt =
      Math.round(
        Number(currentStay.duration ?? currentStay.adults ?? 0) || 0,
      ) || 1;
    void logMetric({
      event: 'stay-checkout-view',
      category: 'co-housing',
      value: 'view',
      point: pt,
      ...stayMetricFields,
    });
  }, [currentStay._id, currentStay.duration, currentStay.adults]);

  const isMember = Boolean(authUser?.roles?.includes('member'));
  const isVolunteerApplication = isVolunteerStay(currentStay);

  const cancellationPolicyForConditions = useMemo(() => {
    if (!bookingSettings) return null;
    return {
      lastday: bookingSettings.cancellationPolicyLastday,
      lastweek: bookingSettings.cancellationPolicyLastweek,
      lastmonth: bookingSettings.cancellationPolicyLastmonth,
      default: bookingSettings.cancellationPolicyDefault,
    };
  }, [bookingSettings]);

  const dietOptions = useMemo(() => getDietOptions(), []);

  const stayEventId = currentStay.eventId;
  const queryTicketName = readQueryParam(router.query.ticketOption);
  const queryDiscountCode = normalizeDiscountCode(
    readQueryParam(router.query.discountCode) || '',
  );
  /**
   * A ticket named in the URL is only worth trusting while it could still be
   * bought — a sold out or renamed option has to fall back to the picker rather
   * than leave the guest with a ticket that no longer exists.
   */
  const isQueryTicketUsable =
    Boolean(queryTicketName) &&
    (isLoadingEventTickets ||
      eventTicketOptions.some((option) => option.name === queryTicketName));
  /** Chosen in the event page ticket modal, and carried here on the stay or,
   * for a stay created before the ticket could be written to it, in the URL. */
  const preChosenTicketName =
    currentStay.ticketOption?.name ||
    (isQueryTicketUsable ? queryTicketName : undefined);
  // Re-asking for a ticket the guest already picked is the same interaction
  // twice, so the picker only appears when nothing is on the stay yet.
  const showEventTicketSelection =
    !isFriend &&
    Boolean(stayEventId) &&
    Boolean(stayEvent?.paid) &&
    !preChosenTicketName;
  const hasValidEventTicket =
    !stayEvent?.paid ||
    Boolean(selectedTicketOption?.name || preChosenTicketName);
  const appliedEventDiscountCode =
    normalizeDiscountCode(currentStay.eventDiscount) ||
    normalizeDiscountCode(eventDiscountCode) ||
    queryDiscountCode ||
    null;
  const eventFoodOptionSet = Boolean(
    stayEvent?.foodOption === 'food_package'
      ? stayEvent?.foodOptionId
      : stayEvent?.foodOptionId && stayEvent?.foodOptionId !== 'no_food',
  );
  const isFoodAvailable =
    stayEvent?.foodOption !== undefined
      ? stayEvent.foodOption !== 'no_food'
      : stayEvent?.foodOptionId !== 'no_food';

  const foodBookingContext: FoodBookingContext = useMemo(() => {
    return stayEventId && stayEvent?.foodOption === 'default'
      ? 'guests'
      : stayEventId
        ? 'events'
        : currentStay.volunteerInfo?.bookingType === 'volunteer' ||
            currentStay.volunteerInfo?.bookingType === 'residence'
          ? 'volunteer'
          : currentStay.isTeamBooking
            ? 'team'
            : 'guests';
  }, [
    stayEventId,
    stayEvent?.foodOption,
    currentStay.volunteerInfo?.bookingType,
    currentStay.isTeamBooking,
  ]);

  const selectableFoodOptions = useMemo(
    () => getFoodOptionsForBookingContext(foodOptions, foodBookingContext),
    [foodOptions, foodBookingContext],
  );

  const isGuestSelectMode =
    isFoodAvailable &&
    Boolean(stayEventId && stayEvent?.foodOption === 'default') &&
    selectableFoodOptions.length > 0;

  const fixedFoodOption = useMemo(
    () =>
      getFoodOption({
        eventId: stayEventId,
        event: stayEvent || undefined,
        foodOptions,
      }),
    [stayEventId, stayEvent, foodOptions],
  );

  const defaultSelectableId = useMemo(
    () => getDefaultSelectedFoodOptionId(selectableFoodOptions),
    [selectableFoodOptions],
  );

  const defaultFoodIdForDraftAutoSelect = useMemo(() => {
    const pool =
      selectableFoodOptions.length > 0 ? selectableFoodOptions : foodOptions;
    return getDefaultSelectedFoodOptionId(pool);
  }, [selectableFoodOptions, foodOptions]);

  const staySelectedFoodId =
    currentStay.foodOptionId &&
    selectableFoodOptions.some((o) => o._id === currentStay.foodOptionId)
      ? currentStay.foodOptionId
      : null;

  const resolvedGuestFoodId = isGuestSelectMode
    ? currentStay.foodOption === 'food_package'
      ? (staySelectedFoodId ?? defaultSelectableId)
      : null
    : null;

  const selectedFoodOption =
    isGuestSelectMode && resolvedGuestFoodId
      ? selectableFoodOptions.find((o) => o._id === resolvedGuestFoodId)
      : null;

  const activeFoodOption = isGuestSelectMode
    ? (selectedFoodOption ?? fixedFoodOption)
    : getFoodOption({
        eventId: stayEventId,
        event: stayEvent || undefined,
        foodOptions:
          selectableFoodOptions.length > 0
            ? selectableFoodOptions
            : foodOptions,
      });

  const foodPricePerNight =
    currentStay.volunteerInfo?.bookingType === 'residence'
      ? 0
      : activeFoodOption?.price;

  const durationNights = currentStay.duration || 0;

  const stayBookingGuestCount =
    (currentStay.adults ?? 0) +
    (currentStay.children ?? 0) +
    (currentStay.infants ?? 0);

  const foodTotalForStay =
    (foodPricePerNight ?? 0) * (currentStay.adults ?? 0) * durationNights;

  const shouldSkipFood = Boolean(
    stayEventId && stayEvent?.foodOption === 'no_food',
  );

  const showFoodSection =
    !isFriend && !!bookingSettings?.foodOptionEnabled && !shouldSkipFood;

  const handleToggleOption = async (
    payload: Parameters<typeof updateStayOptions>[1],
  ) => {
    setActionError(null);
    setIsSavingOptions(true);
    try {
      const updated = await updateStayOptions(currentStay._id, payload);
      setCurrentStay(updated);
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
      setIsSavingOptions(false);
    }
  };

  const persistEventTicketOptions = async (payload: {
    ticketOption?: string | null;
    eventDiscount?: string | null;
  }) => {
    setActionError(null);
    setIsSavingOptions(true);
    try {
      const updated = await updateStayOptions(currentStay._id, payload);
      setCurrentStay(updated);
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
      setIsSavingOptions(false);
    }
  };

  /**
   * The stay is created before the guest lands here, so a ticket chosen on the
   * event page can arrive in the URL without ever being written to the stay.
   * Save it once the options confirm it is real, so checkout prices the ticket
   * the guest actually picked.
   */
  const healedTicketRef = useRef<string | null>(null);
  useEffect(() => {
    if (!stayEventId || isFriend) return;
    if (currentStay.ticketOption?.name) return;
    if (!queryTicketName || isLoadingEventTickets) return;
    const match = eventTicketOptions.find(
      (option) => option.name === queryTicketName,
    );
    if (!match) return;
    const key = `${currentStay._id}_${queryTicketName}`;
    if (healedTicketRef.current === key) return;
    healedTicketRef.current = key;
    setSelectedTicketOption(match);
    if (queryDiscountCode) setEventDiscountCode(queryDiscountCode);
    void persistEventTicketOptions({
      ticketOption: queryTicketName,
      ...(queryDiscountCode ? { eventDiscount: queryDiscountCode } : {}),
    });
  }, [
    stayEventId,
    isFriend,
    currentStay._id,
    currentStay.ticketOption?.name,
    queryTicketName,
    queryDiscountCode,
    isLoadingEventTickets,
    eventTicketOptions,
  ]);

  const handleSelectTicketOption = (ticket: object) => {
    const next = ticket as TicketOption;
    setSelectedTicketOption(next);
    void persistEventTicketOptions({
      ticketOption: next.name,
      eventDiscount: normalizeDiscountCode(eventDiscountCode) || null,
    });
  };

  const handleEventDiscountValidated = (code: string) => {
    const normalizedCode = normalizeDiscountCode(code);
    setEventDiscountCode(normalizedCode);
    if (!selectedTicketOption?.name) return;
    void persistEventTicketOptions({
      ticketOption: selectedTicketOption.name,
      eventDiscount: normalizedCode || null,
    });
  };

  const handleTeamBookingToggle = async (nextValue: boolean) => {
    if (isSavingTeamBooking) return;

    const previousStay = currentStay;
    if (!preTeamPriceLockRef.current && !previousStay.isTeamBooking) {
      preTeamPriceLockRef.current = previousStay.priceLock ?? null;
    }

    setActionError(null);
    setIsSavingTeamBooking(true);
    setCurrentStay(
      applyOptimisticTeamBookingToStay(
        previousStay,
        nextValue,
        preTeamPriceLockRef.current,
      ),
    );

    try {
      const updated = await updateStayOptions(previousStay._id, {
        isTeamBooking: nextValue,
      });
      setCurrentStay(updated);
      if (!updated.isTeamBooking) {
        preTeamPriceLockRef.current = null;
      }
    } catch (err) {
      setCurrentStay(previousStay);
      setActionError(parseMessageFromError(err));
    } finally {
      setIsSavingTeamBooking(false);
    }
  };

  useEffect(() => {
    if (
      !shouldSkipFood ||
      !currentStay._id ||
      isFriend ||
      currentStay.status !== 'draft'
    )
      return;
    const alreadyNoFood =
      currentStay.foodOption === 'no_food' &&
      (currentStay.foodOptionId == null || currentStay.foodOptionId === '');
    if (alreadyNoFood) return;
    let cancelled = false;
    void (async () => {
      setIsSavingOptions(true);
      try {
        const updated = await updateStayOptions(currentStay._id, {
          foodOption: 'no_food',
          foodOptionId: null,
        });
        if (!cancelled) setCurrentStay(updated);
      } catch (err) {
        if (!cancelled) setActionError(parseMessageFromError(err));
      } finally {
        if (!cancelled) setIsSavingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    shouldSkipFood,
    currentStay._id,
    currentStay.foodOption,
    currentStay.foodOptionId,
  ]);

  useEffect(() => {
    if (!showFoodSection || shouldSkipFood) return;
    if (currentStay.status !== 'draft') return;
    if (!defaultFoodIdForDraftAutoSelect) return;

    const pool =
      selectableFoodOptions.length > 0 ? selectableFoodOptions : foodOptions;
    const hasValidPackage =
      currentStay.foodOption === 'food_package' &&
      Boolean(currentStay.foodOptionId) &&
      pool.some((o) => o._id === currentStay.foodOptionId);

    if (hasValidPackage) {
      draftFoodDefaultAppliedRef.current = currentStay._id;
      return;
    }

    if (draftFoodDefaultAppliedRef.current === currentStay._id) return;

    let cancelled = false;
    void (async () => {
      setIsSavingOptions(true);
      try {
        const updated = await updateStayOptions(currentStay._id, {
          foodOption: 'food_package',
          foodOptionId: defaultFoodIdForDraftAutoSelect,
        });
        if (!cancelled) {
          setCurrentStay(updated);
          draftFoodDefaultAppliedRef.current = currentStay._id;
        }
      } catch (err) {
        if (!cancelled) setActionError(parseMessageFromError(err));
      } finally {
        if (!cancelled) setIsSavingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    showFoodSection,
    shouldSkipFood,
    currentStay.status,
    currentStay._id,
    currentStay.foodOption,
    currentStay.foodOptionId,
    defaultFoodIdForDraftAutoSelect,
    selectableFoodOptions,
    foodOptions,
  ]);

  const patchUserPreference = async (
    attribute: 'diet' | 'sharedAccomodation',
    value: string | string[],
  ) => {
    if (!authUser?._id || !platform?.user?.patch) return;
    setPreferencesError(null);
    setIsSavingPreferences(true);
    try {
      await patchUserAndSyncAuthStore({
        platform,
        userId: authUser._id,
        patchBody: {
          preferences: {
            ...authUser.preferences,
            [attribute]: value,
          },
        },
        setUser,
        refetchUser,
      });
    } catch (err) {
      setPreferencesError(parseMessageFromError(err));
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleStayMessageBlur = async () => {
    const trimmed = stayMessage.trim();
    const prev = (currentStay.message || '').trim();
    if (trimmed === prev) return;
    setPreferencesError(null);
    setIsSavingStayMessage(true);
    try {
      const updated = await updateStayOptions(currentStay._id, {
        message: trimmed,
      });
      setCurrentStay(updated);
    } catch (err) {
      setPreferencesError(parseMessageFromError(err));
    } finally {
      setIsSavingStayMessage(false);
    }
  };

  const preparationBusy =
    isProcessing ||
    isInvitingFriends ||
    isSavingOptions ||
    isSavingTeamBooking ||
    isSavingStayMessage ||
    isSavingPreferences ||
    isLoadingEventTickets;
  const canContinue =
    hasAcceptedTerms && hasValidEventTicket && !preparationBusy;

  const handleContinue = async () => {
    if (!canContinue || submitInFlight.current) return;
    submitInFlight.current = true;
    setIsProcessing(true);
    setActionError(null);
    try {
      let next = currentStay;
      if (!isFriend && stayMessage.trim() !== (next.message || '').trim()) {
        next = await updateStayOptions(next._id, {
          message: stayMessage.trim(),
        });
      }
      if (!isFriend && isStayCheckoutDraft(next))
        next = await submitStay(next._id);
      setCurrentStay(next);
      await router.push(getStayCheckoutPath(next));
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
      submitInFlight.current = false;
      setIsProcessing(false);
    }
  };

  const isFriendsBookingOwner = !!currentStay.isFriendsBooking && !isFriend;

  const handleSendToFriends = async () => {
    if (!canContinue || submitInFlight.current) return;
    submitInFlight.current = true;
    setActionError(null);
    setIsInvitingFriends(true);
    try {
      let workingStay = currentStay;
      // The server refuses to invite friends to a draft.
      if (isStayCheckoutDraft(workingStay)) {
        workingStay = await submitStay(workingStay._id);
        setCurrentStay(workingStay);
      }
      const result = await sendStayToFriends(workingStay._id);
      setFriendsInvite(result);
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
      submitInFlight.current = false;
      setIsInvitingFriends(false);
    }
  };

  const cover =
    listing?.photos && listing.photos.length > 0
      ? `${cdn}${listing.photos[0]}-post-md.jpg`
      : null;

  return (
    <main
      id="main-content"
      className="w-full max-w-screen-sm mx-auto p-4 md:p-6 pb-24 md:pb-12"
    >
      <div className="relative flex items-center min-h-[2.75rem] mb-4">
        {/* Back leads into the owner's edit flow, which a friend cannot use. */}
        {!isFriend && (
          <BookingBackButton
            onClick={() =>
              router.push(
                isEditMode
                  ? getStayCheckoutPath(currentStay)
                  : buildStayCreateHrefFromStay(currentStay),
              )
            }
            name={t('buttons_back')}
            className="relative z-10"
          />
        )}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
          <Heading
            level={1}
            className="text-2xl md:text-3xl pb-0 mt-0 text-center"
          >
            <span>
              {isEditMode
                ? t('stay_payment_edit_details')
                : t('stay_create_checkout_request_title')}
            </span>
          </Heading>
        </div>
      </div>

      <FriendsBookingBlock
        isFriendsBooking={isFriendsBookingOwner}
        friendEmails={currentStay.friendEmails}
      />

      <div className="mt-6 flex flex-col gap-6">
        <BookingSurface
          as="section"
          tone="elevated"
          padding="lg"
          aria-labelledby="trip-summary-heading"
        >
          <Heading id="trip-summary-heading" level={2} className="text-lg mb-4">
            {t('stay_create_your_trip')}
          </Heading>
          <div className="flex flex-col gap-5">
            <div className="flex gap-4 flex-1 min-w-0">
              {cover && (
                <img
                  src={cover}
                  alt={
                    listing?.name
                      ? t('stay_create_listing_image_alt', {
                          name: listing.name,
                        })
                      : ''
                  }
                  loading="lazy"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 break-words">
                  {listing?.name || t('stay_create_listing_unknown')}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <time dateTime={currentStay.start}>
                    {dayjs(currentStay.start).format('MMM D, YYYY')}
                  </time>{' '}
                  –{' '}
                  <time dateTime={currentStay.end}>
                    {dayjs(currentStay.end).format('MMM D, YYYY')}
                  </time>
                </p>
                <p className="text-sm text-gray-600">
                  {t('stay_create_guests_summary', {
                    adults: currentStay.adults,
                    children: currentStay.children || 0,
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {t('bookings_dates_nights_selected', {
                    count: currentStay.duration,
                  })}
                </p>
                <BookingUnitsNote
                  numberOfUnits={currentStay.numberOfUnits}
                  listingPrivate={listing?.private}
                  adults={currentStay.adults}
                  childCount={currentStay.children}
                  className="text-sm text-gray-600 mt-1"
                />
              </div>
            </div>
            {!isFriend &&
              (bookingSettings?.pickUpEnabled ||
                stayBookingGuestCount >= 2 ||
                (canCreateTeamBooking && isStayCheckoutDraft(currentStay))) && (
                <div className="w-full border-t border-foreground/[0.08] pt-5">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    {t('stay_create_options_title')}
                  </p>
                  <div className="flex flex-col gap-3">
                    {bookingSettings?.pickUpEnabled && (
                      <Checkbox
                        isChecked={!!currentStay.doesNeedPickup}
                        onChange={() =>
                          handleToggleOption({
                            doesNeedPickup: !currentStay.doesNeedPickup,
                          })
                        }
                        isEnabled={!isSavingOptions}
                        id="opt-pickup"
                      >
                        {t('stay_create_option_pickup')}
                      </Checkbox>
                    )}
                    {stayBookingGuestCount >= 2 && (
                      <Checkbox
                        isChecked={!!currentStay.doesNeedSeparateBeds}
                        onChange={() =>
                          handleToggleOption({
                            doesNeedSeparateBeds:
                              !currentStay.doesNeedSeparateBeds,
                          })
                        }
                        isEnabled={!isSavingOptions}
                        id="opt-separate"
                      >
                        {t('stay_create_option_separate_beds')}
                      </Checkbox>
                    )}
                    {canCreateTeamBooking &&
                      isStayCheckoutDraft(currentStay) && (
                        <div className="flex flex-row justify-between items-center gap-3 [&_.switch]:mb-0">
                          <span id="opt-team-booking-label" className="text-sm">
                            {t('stay_create_option_team_booking')}
                          </span>
                          <Switch
                            disabled={isSavingTeamBooking}
                            name="stay-checkout-team-booking"
                            label=""
                            labelledBy="opt-team-booking-label"
                            onChange={(nextValue) => {
                              void handleTeamBookingToggle(nextValue);
                            }}
                            checked={!!currentStay.isTeamBooking}
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}
          </div>
        </BookingSurface>

        {/* The ticket is already decided — shown, not asked for again. */}
        {!isFriend &&
          Boolean(stayEventId) &&
          Boolean(stayEvent?.paid) &&
          preChosenTicketName && (
            <BookingSurface as="section" tone="elevated" padding="lg">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">
                  {t('bookings_dates_step_tickets_title')}
                </span>
                <strong className="text-sm">
                  {preChosenTicketName.split('_').join(' ')}
                </strong>
              </div>
            </BookingSurface>
          )}

        {showEventTicketSelection && (
          <BookingSurface as="section" tone="elevated" padding="lg">
            {isLoadingEventTickets ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : eventTicketOptions.length > 0 ? (
              <TicketOptions
                items={eventTicketOptions}
                selectTicketOption={handleSelectTicketOption}
                selectedTicketOption={selectedTicketOption}
                discountCode={eventDiscountCode}
                setDiscountCode={setEventDiscountCode}
                eventId={stayEventId}
                onDiscountValidated={handleEventDiscountValidated}
              />
            ) : (
              <p className="text-sm text-gray-600">
                {t('bookings_error_no_ticket_option')}
              </p>
            )}
            {!isLoadingEventTickets &&
              eventTicketOptions.length > 0 &&
              !hasValidEventTicket && (
                <p className="mt-3 text-sm text-error">
                  {t('bookings_error_no_ticket_option')}
                </p>
              )}
          </BookingSurface>
        )}

        {/* Volunteers already gave diet and host notes in the application
            form, so re-asking here would collect the same answers twice. */}
        {!isVolunteerApplication && (
          <BookingSurface
            as="section"
            tone="elevated"
            padding="lg"
            aria-labelledby="preferences-heading"
          >
            <Heading
              id="preferences-heading"
              level={2}
              className="text-lg mb-2"
            >
              {t('stay_create_preferences_section_title')}
            </Heading>
            <p className="text-sm text-gray-600 mb-4">
              {t('stay_create_preferences_section_intro')}
            </p>
            {preferencesError && (
              <div className="mb-4">
                <ErrorMessage error={preferencesError} />
              </div>
            )}
            <Select
              label={t('settings_dietary_preferences')}
              value={toSingleDiet(userPreferences.diet)}
              onChange={(value: string) => {
                setUserPreferences((prev) => ({ ...prev, diet: value }));
                void patchUserPreference('diet', value);
              }}
              options={dietOptions}
              className="mb-4"
            />
            {APP_NAME && APP_NAME?.toLowerCase() !== 'moos' && (
              <Select
                label={t('settings_shared_accommodation_preference')}
                value={userPreferences.sharedAccomodation}
                options={SHARED_ACCOMMODATION_PREFERENCES}
                className="mb-4"
                onChange={(value) => {
                  setUserPreferences((prev) => ({
                    ...prev,
                    sharedAccomodation: value,
                  }));
                  void patchUserPreference('sharedAccomodation', value);
                }}
                isRequired
                isDisabled={isSavingPreferences}
              />
            )}
            {/* The dietary/accommodation selects above patch the friend's own
                user record, but host notes are a stay option they cannot
                write. */}
            {!isFriend && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="stay-host-notes"
                  className="font-medium text-complimentary-light text-sm"
                >
                  {t('stay_create_preferences_host_notes_label')}
                </label>
                <Textarea
                  id="stay-host-notes"
                  value={stayMessage}
                  onChange={(e) => setStayMessage(e.target.value)}
                  onBlur={() => void handleStayMessageBlur()}
                  placeholder={t(
                    'stay_create_preferences_host_notes_placeholder',
                  )}
                  disabled={isSavingStayMessage || isSavingOptions}
                  className="border-2 border-neutral text-complimentary-core text-sm rounded-lg min-h-[88px]"
                />
              </div>
            )}
          </BookingSurface>
        )}

        {showFoodSection && (
          <BookingSurface
            as="section"
            tone="elevated"
            padding="lg"
            aria-labelledby="stay-food-heading"
          >
            <Heading id="stay-food-heading" level={2} className="text-lg mb-4">
              {t('bookings_food_step_title')}
            </Heading>
            <div className="flex flex-col gap-6">
              {isGuestSelectMode && (
                <div className="flex flex-col gap-4">
                  {selectableFoodOptions.map((option) => {
                    const isSelected = resolvedGuestFoodId === option._id;
                    const optionPricePerNight =
                      currentStay.volunteerInfo?.bookingType === 'residence'
                        ? 0
                        : option.price;
                    const optionTotal =
                      optionPricePerNight *
                      (currentStay.adults ?? 0) *
                      durationNights;
                    const photos = option.photos ?? [];
                    const currentPhotoIndex =
                      foodPhotoSlideByOptionId[option._id] ?? 0;
                    const setCurrentPhotoIndex = (next: number) => {
                      setFoodPhotoSlideByOptionId((prev) => ({
                        ...prev,
                        [option._id]: next,
                      }));
                    };
                    return (
                      <div
                        key={option._id}
                        className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 flex gap-4"
                      >
                        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-200 relative">
                          {photos.length > 0 ? (
                            <>
                              <img
                                src={`${cdn}${photos[currentPhotoIndex]}-post-md.jpg`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {photos.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 p-0.5 bg-white/80 rounded-r text-gray-800 hover:bg-white"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentPhotoIndex(
                                        currentPhotoIndex === 0
                                          ? photos.length - 1
                                          : currentPhotoIndex - 1,
                                      );
                                    }}
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 bg-white/80 rounded-l text-gray-800 hover:bg-white"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentPhotoIndex(
                                        currentPhotoIndex >= photos.length - 1
                                          ? 0
                                          : currentPhotoIndex + 1,
                                      );
                                    }}
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="absolute bottom-0.5 right-0.5 bg-white/80 text-[10px] px-1 rounded">
                                    {currentPhotoIndex + 1}/{photos.length}
                                  </span>
                                </>
                              )}
                            </>
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p
                                id={`stay-food-option-label-${option._id}`}
                                className="font-medium text-gray-900"
                              >
                                {option.name}
                              </p>
                              {option.description && (
                                <div
                                  className="text-sm text-gray-600 mt-0.5 line-clamp-2"
                                  dangerouslySetInnerHTML={{
                                    __html: option.description,
                                  }}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2 [&_.switch]:mb-0 shrink-0">
                              <span
                                className={`text-sm font-medium ${
                                  isSelected ? 'text-success' : 'text-gray-700'
                                }`}
                              >
                                {isSelected
                                  ? `✓ ${t('bookings_food_included')}`
                                  : `✗ ${t('bookings_food_not_included')}`}
                              </span>
                              <Switch
                                disabled={isSavingOptions}
                                name={`stay-food-${option._id}`}
                                labelledBy={`stay-food-option-label-${option._id}`}
                                onChange={() => {
                                  void handleToggleOption(
                                    isSelected
                                      ? {
                                          foodOption: 'no_food',
                                          foodOptionId: null,
                                        }
                                      : {
                                          foodOption: 'food_package',
                                          foodOptionId: option._id,
                                        },
                                  );
                                }}
                                checked={isSelected}
                                label=""
                              />
                            </div>
                          </div>
                          {isSelected &&
                            optionPricePerNight > 0 &&
                            durationNights > 0 &&
                            !currentStay.isTeamBooking && (
                              <div className="text-sm mt-0.5 flex flex-col gap-0.5 text-gray-700">
                                <p>
                                  {t('bookings_food_price_per_day_x_days', {
                                    price: priceFormat(optionPricePerNight),
                                    days: durationNights,
                                  })}
                                </p>
                                <p>
                                  {t('bookings_food_total_for_stay')}:{' '}
                                  {priceFormat(optionTotal)}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isGuestSelectMode &&
                activeFoodOption &&
                activeFoodOption.name !== 'no_food' &&
                eventFoodOptionSet && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 flex gap-4">
                    {(activeFoodOption.photos ?? []).length > 0 && (
                      <StayCheckoutFoodPhotoPreview
                        option={activeFoodOption}
                        photoSlideByOptionId={foodPhotoSlideByOptionId}
                        setPhotoSlideByOptionId={setFoodPhotoSlideByOptionId}
                        cdnUrl={cdn}
                      />
                    )}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {activeFoodOption.name}
                          </p>
                          {activeFoodOption.description && (
                            <div
                              className="text-sm text-gray-600 mt-0.5 line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html: activeFoodOption.description,
                              }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 [&_.switch]:mb-0 shrink-0">
                          <span
                            className={`text-sm font-medium ${
                              currentStay.foodOption === 'food_package'
                                ? 'text-success'
                                : 'text-gray-700'
                            }`}
                          >
                            {currentStay.foodOption === 'food_package'
                              ? `✓ ${t('bookings_food_included')}`
                              : `✗ ${t('bookings_food_not_included')}`}
                          </span>
                          <Switch
                            disabled={isSavingOptions}
                            name="stay-food-fixed"
                            onChange={() => {
                              const nextOn =
                                currentStay.foodOption !== 'food_package';
                              void handleToggleOption(
                                nextOn
                                  ? {
                                      foodOption: 'food_package',
                                      foodOptionId: activeFoodOption._id,
                                    }
                                  : {
                                      foodOption: 'no_food',
                                      foodOptionId: null,
                                    },
                              );
                            }}
                            checked={currentStay.foodOption === 'food_package'}
                            label=""
                          />
                        </div>
                      </div>
                      {currentStay.foodOption !== 'food_package' &&
                        isFoodAvailable &&
                        foodTotalForStay > 0 &&
                        !currentStay.isTeamBooking && (
                          <p className="text-sm text-gray-700">
                            {t('bookings_food_save_by_opting_out', {
                              amount: priceFormat(foodTotalForStay),
                            })}
                          </p>
                        )}
                      {isFoodAvailable &&
                        currentStay.foodOption === 'food_package' &&
                        durationNights > 0 &&
                        !currentStay.isTeamBooking &&
                        (foodPricePerNight ?? 0) > 0 && (
                          <div className="text-sm mt-0.5 flex flex-col gap-0.5 text-gray-700">
                            <p>
                              {t('bookings_food_price_per_day_x_days', {
                                price: priceFormat(foodPricePerNight || 0),
                                days: durationNights,
                              })}
                            </p>
                            <p>
                              {t('bookings_food_total_for_stay')}:{' '}
                              {priceFormat(foodTotalForStay)}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                )}

              {!isGuestSelectMode &&
                isFoodAvailable &&
                !(
                  activeFoodOption &&
                  activeFoodOption.name !== 'no_food' &&
                  eventFoodOptionSet
                ) &&
                activeFoodOption &&
                activeFoodOption.name !== 'no_food' && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 flex gap-4">
                    {(activeFoodOption.photos ?? []).length > 0 && (
                      <StayCheckoutFoodPhotoPreview
                        option={activeFoodOption}
                        photoSlideByOptionId={foodPhotoSlideByOptionId}
                        setPhotoSlideByOptionId={setFoodPhotoSlideByOptionId}
                        cdnUrl={cdn}
                      />
                    )}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p
                            id={`stay-food-option-label-${activeFoodOption._id}`}
                            className="font-medium text-gray-900"
                          >
                            {t('booking_add_food')} {activeFoodOption.name}
                          </p>
                          {activeFoodOption.description && (
                            <div
                              className="text-sm text-gray-600 mt-0.5 line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html: activeFoodOption.description,
                              }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 [&_.switch]:mb-0 shrink-0">
                          <span
                            className={`text-sm font-medium ${
                              currentStay.foodOption === 'food_package'
                                ? 'text-success'
                                : 'text-gray-700'
                            }`}
                          >
                            {currentStay.foodOption === 'food_package'
                              ? `✓ ${t('bookings_food_included')}`
                              : `✗ ${t('bookings_food_not_included')}`}
                          </span>
                          <Switch
                            disabled={isSavingOptions}
                            name="stay-food-optional"
                            labelledBy={`stay-food-option-label-${activeFoodOption._id}`}
                            onChange={() => {
                              const nextOn =
                                currentStay.foodOption !== 'food_package';
                              void handleToggleOption(
                                nextOn
                                  ? {
                                      foodOption: 'food_package',
                                      foodOptionId: activeFoodOption._id,
                                    }
                                  : {
                                      foodOption: 'no_food',
                                      foodOptionId: null,
                                    },
                              );
                            }}
                            checked={currentStay.foodOption === 'food_package'}
                            label=""
                          />
                        </div>
                      </div>
                      {currentStay.foodOption !== 'food_package' &&
                        foodTotalForStay > 0 &&
                        !currentStay.isTeamBooking && (
                          <p className="text-sm text-gray-700">
                            {t('bookings_food_save_by_opting_out', {
                              amount: priceFormat(foodTotalForStay),
                            })}
                          </p>
                        )}
                      {currentStay.foodOption === 'food_package' &&
                        durationNights > 0 &&
                        !currentStay.isTeamBooking &&
                        (foodPricePerNight ?? 0) > 0 && (
                          <div className="text-sm mt-0.5 flex flex-col gap-0.5 text-gray-700">
                            <p>
                              {t('bookings_food_price_per_day_x_days', {
                                price: priceFormat(foodPricePerNight || 0),
                                days: durationNights,
                              })}
                            </p>
                            <p>
                              {t('bookings_food_total_for_stay')}:{' '}
                              {priceFormat(foodTotalForStay)}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                )}

              {!isFoodAvailable && (
                <p className="text-sm text-gray-700">
                  {t('food_no_food_available')}
                </p>
              )}

              {(currentStay.foodOption !== 'food_package' ||
                !isFoodAvailable) && (
                <Information className="hidden sm:flex">
                  {t('food_no_food_disclaimer')}
                </Information>
              )}
            </div>
          </BookingSurface>
        )}

        <BookingSurface as="section" tone="elevated" padding="lg">
          <StayPaymentSummary
            stay={currentStay}
            eventTicketOptions={stayEvent?.ticketOptions}
            awaitingApprovalNote={
              isMember
                ? t('stay_payment_next_step_note')
                : t('stay_create_request_no_card_hint')
            }
          >
            {!isFriend && (
              <StayTokenCreditHint stay={currentStay} isMember={isMember} />
            )}
          </StayPaymentSummary>
        </BookingSurface>

        <BookingSurface
          as="section"
          tone="elevated"
          padding="lg"
          aria-labelledby="review-heading"
        >
          <Heading id="review-heading" level={2} className="text-lg mb-4">
            {t('stay_create_request_review_title')}
          </Heading>
          <Conditions
            wrapperClassName="mt-5"
            cancellationPolicy={cancellationPolicyForConditions}
            visitorsGuide={VISITORS_GUIDE || ''}
            setComply={setHasAcceptedTerms}
          />

          <div role="alert" aria-live="assertive" className="empty:hidden">
            {actionError && (
              <div className="mt-3">
                <ErrorMessage error={actionError} />
              </div>
            )}
            {/* Friends cannot pick a ticket, so without this the CTA would be
                disabled with nothing on screen explaining why. */}
            {isFriend && !hasValidEventTicket && (
              <div className="mt-3">
                <ErrorMessage error={t('bookings_error_no_ticket_option')} />
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button
              isEnabled={canContinue}
              isLoading={isProcessing}
              onClick={() => void handleContinue()}
              className="min-h-[48px]"
            >
              {isEditMode
                ? t('stay_payment_save_continue')
                : isFriend || !isStayCheckoutDraft(currentStay) || isMember
                  ? t('stay_payment_continue')
                  : t('buttons_booking_request')}
            </Button>
            {isFriendsBookingOwner && (
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  isEnabled={canContinue && !friendsInvite}
                  isLoading={isInvitingFriends}
                  onClick={handleSendToFriends}
                  className="min-h-[48px]"
                >
                  {t('friends_booking_send_to_friend_summary')}
                </Button>
                {friendsInvite && (
                  <p role="status" className="text-sm text-green-700">
                    {t('friends_booking_checkout_sent')}
                  </p>
                )}
                {!!friendsInvite?.invalidEmails?.length && (
                  <p className="text-sm text-amber-700">
                    {t('friends_booking_invalid_emails_skipped', {
                      emails: friendsInvite.invalidEmails.join(', '),
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </BookingSurface>
      </div>
    </main>
  );
};

StayCheckoutPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const foodRes = await fetchFoodOptions().catch(() => null);
    const bookingSettings = config.booking as BookingSettings;
    const generalConfig = (config.general || null) as GeneralConfig | null;
    const volunteerConfig = (config.volunteering ||
      null) as VolunteerConfig | null;
    const foodOptions = foodRes ?? null;
    return {
      bookingSettings,
      generalConfig,
      volunteerConfig,
      foodOptions,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingSettings: null,
      generalConfig: null,
      volunteerConfig: null,
      foodOptions: null,
    };
  }
};

export default StayCheckoutPage;
