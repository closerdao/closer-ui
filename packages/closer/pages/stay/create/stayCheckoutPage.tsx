import Head from 'next/head';
import { useRouter } from 'next/router';

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import BookingBackButton from '../../../components/BookingBackButton';
import Conditions from '../../../components/Conditions';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageError from '../../../components/PageError';
import BookingSurface from '../../../components/booking/bookingSurface';
import { StayQuoteFiatDiscountPreview } from '../../../components/booking/stayQuoteFiatDiscountPreview';
import Modal from '../../../components/Modal';
import Switch from '../../../components/Switch';
import { ErrorMessage, Information } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Checkbox from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select/Dropdown';
import MultiSelect from '../../../components/ui/Select/MultiSelect';
import { Textarea } from '../../../components/ui/textarea';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { utils } from 'ethers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { MIN_CELO_FOR_GAS } from '../../../constants';
import { SHARED_ACCOMMODATION_PREFERENCES } from '../../../constants/shared.constants';
import config from '../../../configCached';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { WalletDispatch, WalletState } from '../../../contexts/wallet';
import { useBookingSmartContract } from '../../../hooks/useBookingSmartContract';
import { useConfig } from '../../../hooks/useConfig';
import {
  BookingSettings,
  GeneralConfig,
  VolunteerConfig,
} from '../../../types/api';
import { Listing } from '../../../types/booking';
import { Event } from '../../../types/event';
import { FoodOption } from '../../../types/food';
import {
  Stay,
  StayCheckoutResponse,
  StayTokenStakePlan,
} from '../../../types/stay';
import api, { cdn } from '../../../utils/api';
import {
  FoodBookingContext,
  getBookingPaymentCheckoutPath,
  getDefaultSelectedFoodOptionId,
  getFoodOption,
  getFoodOptionsForBookingContext,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { linkedMetricFields, logMetric } from '../../../utils/metrics';
import { formatStakeBookingErrorForUi } from '../../../utils/stakeBookingError.helpers';
import { priceFormat } from '../../../utils/helpers';
import { patchUserAndSyncAuthStore } from '../../../utils/platformUserSync';
import { stayRequiresFullCheckoutFlow } from '../../../utils/stayPaymentRouting.helpers';
import {
  buildStayTokenStakePlan,
  canAugmentTokenOrCreditsPayment,
  canChangeStayPaymentMethod,
  canShowStayTokenCreditPaymentOptions,
  checkoutStay,
  computeCreditsOwed,
  computeFiatOwed,
  computeTokensOwed,
  confirmStayCheckout,
  formatStayMoney,
  getStay,
  getStayAccommodationTokenTotal,
  inferPaymentChoiceFromStay,
  isStayAwaitingHostApproval,
  isStayAwaitingPayment,
  isStayCheckoutDraft,
  isStayPaid,
  isStayTerminal,
  setStayPaymentMethod,
  stakeStayTokens,
  stayUsesTokenAccommodation,
  submitStay,
  updateStayOptions,
} from '../../../utils/stays.api';
import {
  clearPendingStayTokenStake,
  readPendingStayTokenStake,
  writePendingStayTokenStake,
} from '../../../utils/stayTokenStakePendingStorage';

dayjs.extend(dayOfYear);

const stripePromise = process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY, {
      stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT,
    })
  : null;

const formatModalTwoDecimals = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : '0.00';

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
  const { platform }: any = usePlatform();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const idParam = router.query.slug ?? router.query.id;
  const stayId = typeof idParam === 'string' ? idParam : idParam?.[0];

  const isBookingEnabled =
    !!bookingSettings && process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [stay, setStay] = useState<Stay | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const refetchStay = useCallback(async () => {
    if (!stayId) return null;
    const next = await getStay(stayId);
    setStay(next);
    return next;
  }, [stayId]);

  useEffect(() => {
    if (!router.isReady || !stayId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setPageError(null);
      try {
        const next = await getStay(stayId);
        if (cancelled) return;
        setStay(next);
        if (next.listing) {
          try {
            const { data } = await api.get(`/listing/${next.listing}`);
            if (!cancelled) setListing(data?.results ?? null);
          } catch (err) {
            console.warn('Could not load listing', err);
          }
        }
        try {
          const balanceRes = await platform?.carrots?.getBalance();
          if (!cancelled) {
            setCreditsBalance(Number(balanceRes?.results) || 0);
          }
        } catch {
          if (!cancelled) setCreditsBalance(0);
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
  }, [router.isReady, stayId, platform]);

  if (error) return <PageError error={error} />;
  if (!isBookingEnabled) return <FeatureNotEnabled feature="booking" />;

  const pageTitle = `${t('stay_create_checkout_meta_title')} - ${PLATFORM_NAME}`;

  const SeoHead = (
    <Head>
      <title>{pageTitle}</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta name="description" content={t('stay_create_checkout_meta_description')} />
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

  if (isLoading) {
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

  if (isStayTerminal(stay)) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="w-full max-w-screen-sm mx-auto p-4 md:p-6"
        >
          <Heading level={1} className="text-2xl md:text-3xl">
            {t(`stay_status_${stay.status}_title`)}
          </Heading>
          <p className="mt-3 text-muted-foreground">
            {t(`stay_status_${stay.status}_description`)}
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      {SeoHead}
      <Elements stripe={stripePromise}>
        <StayCheckoutContent
          stay={stay}
          listing={listing}
          creditsBalance={creditsBalance ?? 0}
          userEmail={user?.email || ''}
          userName={user?.screenname || ''}
          refetchStay={refetchStay}
          bookingSettings={bookingSettings}
          volunteerConfig={volunteerConfig}
          foodOptions={foodOptions ?? []}
        />
      </Elements>
    </>
  );
};

interface ContentProps {
  stay: Stay;
  listing: Listing | null;
  creditsBalance: number;
  userEmail: string;
  userName: string;
  refetchStay: () => Promise<Stay | null>;
  bookingSettings: BookingSettings | null;
  volunteerConfig: VolunteerConfig | null;
  foodOptions: FoodOption[];
}

const StayCheckoutContent = ({
  stay,
  listing,
  creditsBalance,
  userEmail,
  userName,
  refetchStay,
  bookingSettings,
  volunteerConfig,
  foodOptions,
}: ContentProps) => {
  const router = useRouter();
  const t = useTranslations();
  const stripe = useStripe();
  const elements = useElements();
  const {
    isWalletConnected,
    isWalletReady,
    account,
    library,
    balanceAvailable: tokenBalanceAvailable,
    balanceCeloAvailable,
    balanceNativeAvailable,
  } = useContext(WalletState);
  const { connectWallet } = useContext(WalletDispatch);
  const {
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_EXPLORER_URL,
    VISITORS_GUIDE,
    APP_NAME,
  } = useConfig() || {};
  const { user: authUser, refetchUser, setUser } = useAuth();
  const { platform }: any = usePlatform();

  const [currentStay, setCurrentStay] = useState<Stay>(stay);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isSavingOptions, setIsSavingOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isVerifyingStake, setIsVerifyingStake] = useState(false);
  const [stakeModalError, setStakeModalError] = useState<string | null>(null);
  const [tokenStakeSuccessNotice, setTokenStakeSuccessNotice] = useState<
    string | null
  >(null);
  const [modalNativeCeloBalance, setModalNativeCeloBalance] = useState<
    number | null
  >(null);
  const [stakePlan, setStakePlan] = useState<StayTokenStakePlan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [creditsModalError, setCreditsModalError] = useState<string | null>(
    null,
  );
  const [isApplyingCredits, setIsApplyingCredits] = useState(false);
  const [isRevertingTokenPayment, setIsRevertingTokenPayment] =
    useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingStayMessage, setIsSavingStayMessage] = useState(false);
  const [userPreferences, setUserPreferences] = useState<{
    diet: string[];
    sharedAccomodation: string;
  }>({ diet: [], sharedAccomodation: '' });
  const [stayMessage, setStayMessage] = useState(stay.message || '');
  const [stayEvent, setStayEvent] = useState<Event | null>(null);
  const [foodPhotoSlideByOptionId, setFoodPhotoSlideByOptionId] = useState<
    Record<string, number>
  >({});

  const pendingTokenPaymentPayloadRef = useRef<
    | { method: 'full-tokens' }
    | { method: 'partial-tokens'; appliedTokens: number }
    | null
  >(null);
  const draftFoodDefaultAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    draftFoodDefaultAppliedRef.current = null;
  }, [stay._id]);

  useEffect(() => {
    setCurrentStay(stay);
  }, [stay._id]);

  useEffect(() => {
    setTokenStakeSuccessNotice(null);
  }, [stay._id]);

  useEffect(() => {
    if (!authUser?.preferences) return;
    setUserPreferences({
      diet: Array.isArray(authUser.preferences.diet)
        ? authUser.preferences.diet
        : typeof authUser.preferences.diet === 'string'
          ? authUser.preferences.diet.split(',').filter(Boolean)
          : [],
      sharedAccomodation: authUser.preferences.sharedAccomodation || '',
    });
  }, [authUser?._id, authUser?.preferences]);

  useEffect(() => {
    setStayMessage(currentStay.message || '');
  }, [currentStay._id, currentStay.message]);

  useEffect(() => {
    if (!currentStay.eventId) {
      setStayEvent(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/event/${currentStay.eventId}`);
        if (!cancelled) setStayEvent(data?.results ?? null);
      } catch {
        if (!cancelled) setStayEvent(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentStay.eventId]);

  useEffect(() => {
    if (isStayPaid(currentStay)) {
      router.replace(`/stay/${currentStay._id}/confirmation`);
    }
  }, [currentStay.status, currentStay._id, router]);

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
      value: 'view', point: pt,
      ...stayMetricFields,
    });
  }, [currentStay._id, currentStay.duration, currentStay.adults]);

  useEffect(() => {
    if (
      !isStayAwaitingHostApproval(currentStay) &&
      !isStayCheckoutDraft(currentStay)
    ) {
      return;
    }
    setIsCreditsModalOpen(false);
    setIsStakeModalOpen(false);
    setStakeModalError(null);
    setStakePlan(null);
    pendingTokenPaymentPayloadRef.current = null;
  }, [currentStay.status]);

  const priceLock = currentStay.priceLock;
  const isMember = Boolean(authUser?.roles?.includes('member'));
  const showTokenCreditPaymentOptions = canShowStayTokenCreditPaymentOptions(
    currentStay,
    isMember,
  );
  const isFree =
    !priceLock ||
    (priceLock.total.val === 0 &&
      (currentStay.creditsTarget?.val || 0) === 0 &&
      (currentStay.tokensTarget?.val || 0) === 0);

  const tokenAccommodationVal = getStayAccommodationTokenTotal(currentStay);

  const fiatOwed = computeFiatOwed(currentStay);
  const showStripeCardInput = isMember && fiatOwed > 0;
  const tokensOwed = computeTokensOwed(currentStay);

  const accommodationTokenStakePreview = useMemo(
    () => buildStayTokenStakePlan(currentStay, computeTokensOwed(currentStay)),
    [currentStay],
  );

  const canChangePaymentMethod = canChangeStayPaymentMethod(currentStay);
  const canAugmentTokenOrCredits =
    canAugmentTokenOrCreditsPayment(currentStay);
  const canUseTokenCreditUiActions =
    canChangePaymentMethod || canAugmentTokenOrCredits;

  const paymentChoice = useMemo(
    () => inferPaymentChoiceFromStay(currentStay, tokenAccommodationVal),
    [currentStay, tokenAccommodationVal],
  );
  const stayUsesTokens = stayUsesTokenAccommodation(currentStay);

  const checkoutRouteTarget = useMemo(
    () =>
      getBookingPaymentCheckoutPath({
        bookingId: currentStay._id,
        stayShaped: true,
        status: currentStay.status,
        paymentDelta: currentStay.paymentDelta,
        useTokens:
          paymentChoice === 'partial-tokens' ||
          paymentChoice === 'full-tokens',
        fiatOwed: computeFiatOwed(currentStay),
        tokensOwed: computeTokensOwed(currentStay),
        creditsOwed: computeCreditsOwed(currentStay),
      }),
    [
      currentStay._id,
      currentStay.status,
      currentStay.paymentDelta,
      currentStay,
      paymentChoice,
    ],
  );

  const paymentPageUrl = `/stay/${currentStay._id}/payment`;

  const useCardPaymentPrimaryCta = useMemo(() => {
    if (
      isStayCheckoutDraft(currentStay) ||
      isStayAwaitingHostApproval(currentStay)
    ) {
      return false;
    }
    return checkoutRouteTarget === paymentPageUrl;
  }, [
    checkoutRouteTarget,
    paymentPageUrl,
    currentStay.status,
  ]);

  const showCreditsTokensGuideCta = useMemo(() => {
    if (
      isStayCheckoutDraft(currentStay) ||
      isStayAwaitingHostApproval(currentStay)
    ) {
      return false;
    }
    return stayRequiresFullCheckoutFlow(
      currentStay,
      currentStay.paymentDelta,
    );
  }, [currentStay]);

  const hasAlternativeAccommodationPayment = paymentChoice !== 'fiat';
  const isAwaitingStayPayment = isStayAwaitingPayment(currentStay);
  const showFullTokenCreditControls =
    !hasAlternativeAccommodationPayment || isAwaitingStayPayment;

  const accommodationPriceDetail = useMemo(() => {
    const lock = currentStay.priceLock;
    if (!lock) return null;
    const net = lock.lines.accommodation;
    const gross = lock.lines.accommodationGross ?? lock.lines.accommodation;
    const showGrossStrikeThrough =
      hasAlternativeAccommodationPayment && gross.val > net.val;
    return {
      gross,
      net,
      showBenefitCaption:
        showTokenCreditPaymentOptions &&
        hasAlternativeAccommodationPayment &&
        (lock.appliedCredits.val > 0 || lock.appliedTokens.val > 0),
      showGrossStrikeThrough,
    };
  }, [
    currentStay.priceLock,
    hasAlternativeAccommodationPayment,
    showTokenCreditPaymentOptions,
  ]);

  const cancellationPolicyForConditions = useMemo(() => {
    if (!bookingSettings) return null;
    return {
      lastday: bookingSettings.cancellationPolicyLastday,
      lastweek: bookingSettings.cancellationPolicyLastweek,
      lastmonth: bookingSettings.cancellationPolicyLastmonth,
      default: bookingSettings.cancellationPolicyDefault,
    };
  }, [bookingSettings]);

  const dietOptions = useMemo(
    () =>
      volunteerConfig?.diet
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean) || [],
    [volunteerConfig?.diet],
  );

  const stayEventId = currentStay.eventId;
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
      ? staySelectedFoodId ?? defaultSelectableId
      : null
    : null;

  const selectedFoodOption =
    isGuestSelectMode && resolvedGuestFoodId
      ? selectableFoodOptions.find((o) => o._id === resolvedGuestFoodId)
      : null;

  const activeFoodOption = isGuestSelectMode
    ? selectedFoodOption ?? fixedFoodOption
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
    !!bookingSettings?.foodOptionEnabled && !shouldSkipFood;

  const isWeb3Enabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';
  const needsTokenStakeCompletion =
    showTokenCreditPaymentOptions &&
    isWeb3Enabled &&
    tokenAccommodationVal > 0 &&
    (paymentChoice === 'partial-tokens' || paymentChoice === 'full-tokens') &&
    tokensOwed > 0;
  const walletTokenBalance = Number(tokenBalanceAvailable || 0);
  const walletNativeCeloBalance = Number(
    balanceNativeAvailable ?? balanceCeloAvailable ?? 0,
  );
  const displayedNativeCeloBalance = Number(
    modalNativeCeloBalance ?? walletNativeCeloBalance,
  );
  const tokenContractAddress = BLOCKCHAIN_DAO_TOKEN?.address;
  const tokenExplorerUrl =
    tokenContractAddress && BLOCKCHAIN_EXPLORER_URL
      ? `${BLOCKCHAIN_EXPLORER_URL}/address/${tokenContractAddress}`
      : null;
  const tokenAmountToApply = Math.max(
    0,
    Math.min(walletTokenBalance, tokenAccommodationVal),
  );
  const isSameDayTokenBooking = dayjs(currentStay.start).isSame(dayjs(), 'day');
  const creditsAmountToApply = Math.max(
    0,
    Math.min(creditsBalance || 0, tokenAccommodationVal),
  );

  const isApplyCreditsEnabled =
    canUseTokenCreditUiActions &&
    !stayUsesTokens &&
    creditsAmountToApply > 0 &&
    !isApplyingCredits &&
    !isStakeModalOpen;

  const isFullCreditsForAccommodation =
    creditsAmountToApply >= tokenAccommodationVal && tokenAccommodationVal > 0;

  const compactPaymentButtonClass =
    '!normal-case tracking-normal min-h-[36px] text-sm';

  const applyCreditsDisabledExplanation = useMemo(() => {
    if (stayUsesTokens) {
      return undefined;
    }
    if (isApplyCreditsEnabled || isApplyingCredits) {
      return undefined;
    }
    if (!canUseTokenCreditUiActions) {
      return t('stay_create_payment_method_locked');
    }
    if (tokenAccommodationVal <= 0) {
      return t('stay_create_apply_credits_disabled_no_eligible_amount');
    }
    if (creditsBalance <= 0) {
      return t('stay_create_apply_credits_disabled_no_balance');
    }
    return undefined;
  }, [
    isApplyCreditsEnabled,
    isApplyingCredits,
    canUseTokenCreditUiActions,
    stayUsesTokens,
    tokenAccommodationVal,
    creditsBalance,
    isStakeModalOpen,
    t,
  ]);

  const hasPendingExtension =
    !!currentStay.pendingExtension &&
    !!currentStay.pendingExtension.requestedAt;

  const { stakeTokens, isStaking } = useBookingSmartContract({
    bookingNights: stakePlan?.bookingNights || [],
  });
  useEffect(() => {
    if (!isStakeModalOpen || !library || !account) return;
    let cancelled = false;
    (async () => {
      try {
        const nativeBalance = await library.getBalance(account);
        if (!cancelled) {
          setModalNativeCeloBalance(
            Number(utils.formatUnits(nativeBalance, 18)),
          );
        }
      } catch {
        if (!cancelled) {
          setModalNativeCeloBalance(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isStakeModalOpen, library, account]);
  const nativeCelo = displayedNativeCeloBalance;
  const isLowCeloForStake = nativeCelo < MIN_CELO_FOR_GAS;

  const buildStakePlan = (stayToStake: Stay) => {
    const owed = computeTokensOwed(stayToStake);
    if (owed <= 0) return null;
    return buildStayTokenStakePlan(stayToStake, owed);
  };

  const handleApplyTokens = () => {
    if (!showTokenCreditPaymentOptions) return;
    if (!canUseTokenCreditUiActions) return;
    if (isSameDayTokenBooking) return;
    if (!isWalletConnected || tokenAmountToApply <= 0) return;
    if (isCreditsModalOpen) return;
    setActionError(null);

    const payload =
      tokenAmountToApply >= tokenAccommodationVal
        ? { method: 'full-tokens' as const }
        : {
            method: 'partial-tokens' as const,
            appliedTokens: tokenAmountToApply,
          };

    const intentTokens =
      payload.method === 'full-tokens'
        ? tokenAccommodationVal
        : tokenAmountToApply;

    const plan = buildStayTokenStakePlan(currentStay, intentTokens);
    if (!plan) {
      setActionError(t('stay_create_token_stake_plan_error'));
      return;
    }

    pendingTokenPaymentPayloadRef.current = payload;
    setStakePlan(plan);
    setStakeModalError(null);
    setIsStakeModalOpen(true);
  };

  const handleResumeTokenStake = () => {
    if (!showTokenCreditPaymentOptions) return;
    if (isSameDayTokenBooking) return;
    if (!isWalletConnected || tokensOwed <= 0) return;
    setActionError(null);
    pendingTokenPaymentPayloadRef.current = null;
    const nextStakePlan = buildStakePlan(currentStay);
    if (!nextStakePlan) {
      setActionError(t('stay_create_token_stake_plan_error'));
      return;
    }
    setStakePlan(nextStakePlan);
    setStakeModalError(null);
    setIsStakeModalOpen(true);
  };

  const closeStakeModal = () => {
    setIsStakeModalOpen(false);
    setStakeModalError(null);
    pendingTokenPaymentPayloadRef.current = null;
    setStakePlan(null);
  };

  const handleStakeTokens = async () => {
    if (!stakePlan) return;
    if (!isWalletConnected || !isWalletReady) {
      setStakeModalError(t('bookings_using_crypto_connect_wallet'));
      return;
    }
    if (isLowCeloForStake) {
      setStakeModalError(t('insufficient_celo_for_gas'));
      return;
    }

    setStakeModalError(null);
    setActionError(null);
    let stayForStake = currentStay;
    let planForRecovery: StayTokenStakePlan | null = null;
    try {
      const pendingPayload = pendingTokenPaymentPayloadRef.current;
      if (pendingPayload) {
        let editableStay = currentStay;
        if (editableStay.status === 'draft') {
          editableStay = await submitStay(editableStay._id);
          setCurrentStay(editableStay);
          stayForStake = editableStay;
        }
        const updated = await setStayPaymentMethod(
          editableStay._id,
          pendingPayload,
        );
        pendingTokenPaymentPayloadRef.current = null;
        setCurrentStay(updated);
        stayForStake = updated;
      }

      const planToUse = buildStayTokenStakePlan(
        stayForStake,
        computeTokensOwed(stayForStake),
      );
      if (!planToUse) {
        setStakeModalError(t('stay_create_token_stake_plan_error'));
        return;
      }
      planForRecovery = planToUse;
      setStakePlan(planToUse);
      const nightsKey = JSON.stringify(planToUse.bookingNights);

      const stakingResult = await stakeTokens(
        planToUse.pricePerNightWei,
        planToUse.bookingNights,
      );
      if (!stakingResult) {
        setStakeModalError(t('stay_create_token_stake_failed'));
        return;
      }
      if (stakingResult?.error || !stakingResult?.success?.transactionId) {
        setStakeModalError(
          formatStakeBookingErrorForUi(stakingResult?.error, t) ||
            t('stay_create_token_stake_failed'),
        );
        return;
      }

      if (stakingResult.success.transactionId === 'existing') {
        const storedTx = readPendingStayTokenStake(stayForStake._id, nightsKey);
        if (storedTx) {
          setIsVerifyingStake(true);
          try {
            const stakeResult = await stakeStayTokens(stayForStake._id, storedTx);
            clearPendingStayTokenStake(stayForStake._id);
            setCurrentStay(stakeResult.booking);
            setTokenStakeSuccessNotice(t('stay_create_token_stake_success'));
            setIsStakeModalOpen(false);
            setStakePlan(null);
            setStakeModalError(null);
            return;
          } catch (recoverErr) {
            try {
              const fresh = await getStay(stayForStake._id);
              setCurrentStay(fresh);
              if (computeTokensOwed(fresh) === 0) {
                clearPendingStayTokenStake(stayForStake._id);
                setTokenStakeSuccessNotice(t('stay_create_token_stake_success'));
                setIsStakeModalOpen(false);
                setStakePlan(null);
                setStakeModalError(null);
                return;
              }
            } catch {
              // ignore
            }
            setStakeModalError(formatStakeBookingErrorForUi(recoverErr, t));
            return;
          }
        }
        let freshAfterExisting: Stay;
        try {
          freshAfterExisting = await getStay(stayForStake._id);
        } catch {
          setStakeModalError(t('stay_create_token_stake_existing_conflict'));
          return;
        }
        setCurrentStay(freshAfterExisting);
        if (computeTokensOwed(freshAfterExisting) === 0) {
          clearPendingStayTokenStake(stayForStake._id);
          setTokenStakeSuccessNotice(t('stay_create_token_stake_success'));
          setIsStakeModalOpen(false);
          setStakePlan(null);
          setStakeModalError(null);
          return;
        }
        try {
          setIsVerifyingStake(true);
          const stakeResult = await stakeStayTokens(
            stayForStake._id,
            '',
            { syncBookingAlreadyOnChain: true },
          );
          clearPendingStayTokenStake(stayForStake._id);
          setCurrentStay(stakeResult.booking);
          setTokenStakeSuccessNotice(t('stay_create_token_stake_success'));
          setIsStakeModalOpen(false);
          setStakePlan(null);
          setStakeModalError(null);
          return;
        } catch {
          setStakeModalError(t('stay_create_token_stake_refresh_hint'));
          return;
        }
      }

      const txHash = stakingResult.success.transactionId;
      writePendingStayTokenStake(stayForStake._id, txHash, nightsKey);

      setIsVerifyingStake(true);
      const stakeResult = await stakeStayTokens(stayForStake._id, txHash);
      clearPendingStayTokenStake(stayForStake._id);
      setCurrentStay(stakeResult.booking);
      setTokenStakeSuccessNotice(t('stay_create_token_stake_success'));
      setIsStakeModalOpen(false);
      setStakePlan(null);
      setStakeModalError(null);
    } catch (err) {
      const msg = formatStakeBookingErrorForUi(err, t);
      const lower = msg.toLowerCase();
      const planSnapshot =
        planForRecovery ||
        buildStayTokenStakePlan(
          stayForStake,
          computeTokensOwed(stayForStake),
        ) ||
        stakePlan;
      if (
        planSnapshot &&
        (/token lock already exists|already exists for these dates/i.test(
          lower,
        ) ||
          /booking already exists/i.test(lower))
      ) {
        const snapshotKey = JSON.stringify(planSnapshot.bookingNights);
        const storedTx = readPendingStayTokenStake(stayForStake._id, snapshotKey);
        if (storedTx) {
          try {
            setIsVerifyingStake(true);
            const stakeResult = await stakeStayTokens(stayForStake._id, storedTx);
            clearPendingStayTokenStake(stayForStake._id);
            setCurrentStay(stakeResult.booking);
            setTokenStakeSuccessNotice(t('stay_create_token_stake_success'));
            setIsStakeModalOpen(false);
            setStakePlan(null);
            setStakeModalError(null);
            return;
          } catch {
            // fall through
          }
        }
        try {
          const fresh = await getStay(stayForStake._id);
          setCurrentStay(fresh);
          if (computeTokensOwed(fresh) === 0) {
            clearPendingStayTokenStake(stayForStake._id);
            setTokenStakeSuccessNotice(t('stay_create_token_stake_success'));
            setIsStakeModalOpen(false);
            setStakePlan(null);
            setStakeModalError(null);
            return;
          }
        } catch {
          // ignore
        }
      }
      setStakeModalError(msg);
    } finally {
      setIsVerifyingStake(false);
    }
  };

  const openCreditsConfirmationModal = () => {
    if (!showTokenCreditPaymentOptions) return;
    if (stayUsesTokens) return;
    if (!canUseTokenCreditUiActions || creditsAmountToApply <= 0) return;
    if (isStakeModalOpen) return;
    setCreditsModalError(null);
    setIsCreditsModalOpen(true);
  };

  const closeCreditsModal = () => {
    setIsCreditsModalOpen(false);
    setCreditsModalError(null);
  };

  const confirmApplyCredits = async () => {
    if (!showTokenCreditPaymentOptions) return;
    if (stayUsesTokens) return;
    if (!canUseTokenCreditUiActions || creditsAmountToApply <= 0) return;
    setCreditsModalError(null);
    setActionError(null);
    setIsApplyingCredits(true);
    try {
      let editableStay = currentStay;
      if (editableStay.status === 'draft') {
        editableStay = await submitStay(editableStay._id);
        setCurrentStay(editableStay);
      }
      const payload =
        creditsAmountToApply >= tokenAccommodationVal
          ? { method: 'full-credits' as const }
          : {
              method: 'partial-credits' as const,
              appliedCredits: creditsAmountToApply,
            };
      const updated = await setStayPaymentMethod(editableStay._id, payload);
      setCurrentStay(updated);
      setIsCreditsModalOpen(false);
    } catch (err) {
      setCreditsModalError(parseMessageFromError(err));
    } finally {
      setIsApplyingCredits(false);
    }
  };

  const handleCancelTokenPayment = async () => {
    if (!showTokenCreditPaymentOptions) return;
    if (!stayUsesTokens) return;
    if (!canChangePaymentMethod) return;
    setCreditsModalError(null);
    setActionError(null);
    setIsRevertingTokenPayment(true);
    try {
      let editableStay = currentStay;
      if (editableStay.status === 'draft') {
        editableStay = await submitStay(editableStay._id);
        setCurrentStay(editableStay);
      }
      const updated = await setStayPaymentMethod(editableStay._id, {
        method: 'fiat',
      });
      setCurrentStay(updated);
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
      setIsRevertingTokenPayment(false);
    }
  };

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

  useEffect(() => {
    if (!shouldSkipFood || !currentStay._id) return;
    const alreadyNoFood =
      currentStay.foodOption === 'no_food' &&
      (currentStay.foodOptionId == null || currentStay.foodOptionId === '');
    if (alreadyNoFood) return;
    let cancelled = false;
    void (async () => {
      try {
        const updated = await updateStayOptions(currentStay._id, {
          foodOption: 'no_food',
          foodOptionId: null,
        });
        if (!cancelled) setCurrentStay(updated);
      } catch (err) {
        if (!cancelled) setActionError(parseMessageFromError(err));
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

  const handleStripeConfirmation = async (
    checkout: StayCheckoutResponse,
    paymentMethodId: string,
  ): Promise<boolean> => {
    if (!checkout.paymentIntent) return true;
    const intent = checkout.paymentIntent;

    if (intent.status === 'succeeded') {
      await confirmStayCheckout(currentStay._id, intent.id);
      return true;
    }

    if (!stripe) {
      setActionError(t('stay_create_stripe_not_ready'));
      return false;
    }

    if (intent.status === 'requires_action' && intent.client_secret) {
      const result = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: paymentMethodId,
      });
      if (result.error) {
        setActionError(result.error.message || t('stay_create_payment_failed'));
        return false;
      }
      if (result.paymentIntent?.status !== 'succeeded') {
        setActionError(t('stay_create_payment_failed'));
        return false;
      }
      await confirmStayCheckout(currentStay._id, intent.id);
      return true;
    }

    if (
      intent.status === 'requires_confirmation' &&
      intent.client_secret &&
      paymentMethodId
    ) {
      const result = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: paymentMethodId,
      });
      if (result.error) {
        setActionError(result.error.message || t('stay_create_payment_failed'));
        return false;
      }
      if (result.paymentIntent?.status !== 'succeeded') {
        setActionError(t('stay_create_payment_failed'));
        return false;
      }
      await confirmStayCheckout(currentStay._id, intent.id);
      return true;
    }

    setActionError(t('stay_create_payment_failed'));
    return false;
  };

  const handleConfirmAndPay = async () => {
    setActionError(null);
    setIsProcessing(true);
    const stayPaymentPoint =
      Math.round(
        Number(currentStay.duration ?? currentStay.adults ?? 0) || 0,
      ) || 1;
    void logMetric({
      event: 'stay-payment-started',
      category: 'co-housing',
      value: 'payment', point: stayPaymentPoint,
      ...stayMetricFields,
    });
    try {
      let workingStay = currentStay;
      if (isStayCheckoutDraft(workingStay)) {
        workingStay = await submitStay(workingStay._id);
        setCurrentStay(workingStay);
      }

      if (isStayAwaitingHostApproval(workingStay)) {
        router.replace(`/stay/${workingStay._id}/pending`);
        return;
      }

      if (isStayPaid(workingStay)) {
        router.push(`/stay/${workingStay._id}/confirmation`);
        return;
      }

      const liveFiatOwed = computeFiatOwed(workingStay);
      const card = elements?.getElement(CardElement) ?? null;
      if (isMember && liveFiatOwed > 0 && !card) {
        setActionError(t('stay_create_card_required'));
        return;
      }

      let stripePaymentMethodId = '';
      if (isMember && liveFiatOwed > 0 && stripe && card) {
        const { paymentMethod, error: pmError } =
          await stripe.createPaymentMethod({
            type: 'card',
            card,
            billing_details: { email: userEmail, name: userName },
          });
        if (pmError || !paymentMethod) {
          setActionError(pmError?.message || t('stay_create_card_error'));
          return;
        }
        stripePaymentMethodId = paymentMethod.id;
      }

      const checkout = await checkoutStay(
        workingStay._id,
        stripePaymentMethodId,
      );

      if (checkout.paymentIntent) {
        const ok = await handleStripeConfirmation(
          checkout,
          stripePaymentMethodId,
        );
        if (!ok) return;
      }

      if (checkout.needsTokenStake) {
        await refetchStay();
        setActionError(t('stay_create_token_stake_required'));
        return;
      }

      const refreshed = await refetchStay();
      if (refreshed && isStayPaid(refreshed)) {
        router.push(`/stay/${refreshed._id}/confirmation`);
      } else if (refreshed && isStayAwaitingPayment(refreshed)) {
        setActionError(
          t('stay_create_unexpected_status', {
            status: refreshed.status,
          }),
        );
      } else {
        setActionError(
          t('stay_create_unexpected_status', {
            status: refreshed?.status || workingStay.status,
          }),
        );
      }
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
      setIsProcessing(false);
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
        <BookingBackButton
          onClick={() => router.push('/stay/create')}
          name={t('buttons_back')}
          className="relative z-10"
        />
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
          <Heading
            level={1}
            className="text-2xl md:text-3xl pb-0 mt-0 text-center"
          >
            <span>
              {isMember
                ? t('stay_create_checkout_title')
                : t('stay_create_checkout_request_title')}
            </span>
          </Heading>
        </div>
      </div>

      {showCreditsTokensGuideCta && !useCardPaymentPrimaryCta && (
        <BookingSurface
          as="div"
          tone="soft"
          padding="md"
          className="mb-6 border border-foreground/[0.08]"
        >
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {t('stay_checkout_cta_full_checkout_title')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('stay_checkout_cta_full_checkout_body')}
          </p>
        </BookingSurface>
      )}

      {hasPendingExtension && (
        <BookingSurface
          as="div"
          role="status"
          tone="soft"
          padding="md"
          className="mb-6 !border-0 !bg-amber-50 shadow-sm !ring-1 !ring-amber-200/80"
        >
          <p className="text-sm text-amber-900">
            {t('stay_create_pending_extension', {
              end: dayjs(currentStay.pendingExtension!.end).format(
                'MMM D, YYYY',
              ),
            })}
          </p>
        </BookingSurface>
      )}

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
              </div>
            </div>
            <div className="w-full border-t border-foreground/[0.08] pt-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                {t('stay_create_options_title')}
              </p>
              <div className="flex flex-col gap-3">
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
              </div>
            </div>
          </div>
        </BookingSurface>

        <BookingSurface
          as="section"
          tone="elevated"
          padding="lg"
          aria-labelledby="preferences-heading"
        >
          <Heading id="preferences-heading" level={2} className="text-lg mb-2">
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
          <MultiSelect
            label={t('settings_dietary_preferences')}
            values={userPreferences.diet}
            onChange={(value) => {
              setUserPreferences((prev) => ({ ...prev, diet: value }));
              void patchUserPreference('diet', value);
            }}
            options={dietOptions}
            placeholder={t('settings_pick_or_create_yours')}
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
              placeholder={t('stay_create_preferences_host_notes_placeholder')}
              disabled={isSavingStayMessage || isSavingOptions}
              className="border-2 border-neutral text-complimentary-core text-sm rounded-lg min-h-[88px]"
            />
          </div>
        </BookingSurface>

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

        <BookingSurface
          as="section"
          tone="elevated"
          padding="lg"
          aria-labelledby="summary-heading"
        >
          <Heading id="summary-heading" level={2} className="text-lg mb-4">
            {t('stay_create_summary_title')}
          </Heading>
          {tokenStakeSuccessNotice && (
            <Information className="mb-4">{tokenStakeSuccessNotice}</Information>
          )}
          {priceLock ? (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-gray-600">
                    {t('stay_create_line_accommodation')}
                  </span>
                  <div className="text-right text-gray-900">
                    {accommodationPriceDetail?.showGrossStrikeThrough ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="line-through text-gray-500">
                          {formatStayMoney(accommodationPriceDetail.gross)}
                        </span>
                        <span>{formatStayMoney(accommodationPriceDetail.net)}</span>
                      </div>
                    ) : (
                      <span>{formatStayMoney(priceLock.lines.accommodation)}</span>
                    )}
                  </div>
                </div>
                {accommodationPriceDetail?.showBenefitCaption && (
                  <div className="flex flex-col items-end gap-0.5 text-xs text-gray-600">
                    {priceLock.appliedCredits.val > 0 && (
                      <span>
                        {t('stay_create_accommodation_benefit_credits', {
                          amount: `${formatModalTwoDecimals(priceLock.appliedCredits.val)} ${priceLock.appliedCredits.cur}`,
                        })}
                      </span>
                    )}
                    {priceLock.appliedTokens.val > 0 && (
                      <span>
                        {t('stay_create_accommodation_benefit_tokens', {
                          amount: `${formatModalTwoDecimals(priceLock.appliedTokens.val)} ${priceLock.appliedTokens.cur}`,
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {priceLock.lines.utility.val > 0 && (
                <Row
                  label={t('stay_create_line_utility')}
                  value={formatStayMoney(priceLock.lines.utility)}
                />
              )}
              {priceLock.lines.food.val > 0 && (
                <Row
                  label={t('stay_create_line_food')}
                  value={formatStayMoney(priceLock.lines.food)}
                />
              )}
              {priceLock.lines.event.val > 0 && (
                <Row
                  label={t('stay_create_line_event')}
                  value={formatStayMoney(priceLock.lines.event)}
                />
              )}
              {priceLock.platformFee.val > 0 && (
                <Row
                  label={t('stay_create_line_platform_fee')}
                  value={formatStayMoney(priceLock.platformFee)}
                />
              )}
              <hr className="my-2 border-gray-200" />
              <Row
                label={t('stay_create_line_subtotal')}
                value={formatStayMoney(priceLock.subtotal)}
              />
              <Row
                bold
                label={t('stay_create_line_total')}
                value={formatStayMoney(priceLock.total)}
              />
              <div className="flex justify-between items-baseline">
                <span className="italic text-gray-600">
                  Including Tax (VAT)
                </span>
                <span className="text-gray-900">
                  {formatStayMoney(
                    priceLock.vat ?? {
                      val: 0,
                      cur: priceLock.total.cur,
                    },
                  )}
                </span>
              </div>
              {priceLock.appliedCredits.val > 0 && (
                <Row
                  label={t('stay_create_line_credits_applied')}
                  value={`-${formatModalTwoDecimals(priceLock.appliedCredits.val)} ${priceLock.appliedCredits.cur}`}
                />
              )}
              {priceLock.appliedTokens.val > 0 && (
                <Row
                  label={t('stay_create_line_tokens_applied')}
                  value={`-${formatModalTwoDecimals(priceLock.appliedTokens.val)} ${priceLock.appliedTokens.cur}`}
                />
              )}
              {showTokenCreditPaymentOptions && tokensOwed > 0 && (
                <>
                  <hr className="my-2 border-gray-200" />
                  {accommodationTokenStakePreview &&
                    (currentStay.tokensTarget?.val ?? 0) > 0 &&
                    Math.abs(
                      (currentStay.tokensTarget?.val ?? 0) -
                        accommodationTokenStakePreview.tokenAmount,
                    ) > 0.001 && (
                      <Row
                        label={t('stay_create_line_tokens_booking_target')}
                        value={`${formatModalTwoDecimals(
                          currentStay.tokensTarget?.val ?? 0,
                        )} ${currentStay.tokensTarget?.cur || ''}`}
                      />
                    )}
                  <Row
                    label={t('stay_create_line_tokens_owed')}
                    value={`${formatModalTwoDecimals(tokensOwed)} ${currentStay.tokensTarget?.cur || ''}`}
                  />
                  {accommodationTokenStakePreview &&
                    Math.abs(
                      accommodationTokenStakePreview.tokenAmount - tokensOwed,
                    ) > 0.001 && (
                      <Row
                        label={t('stay_create_line_tokens_accommodation_lock')}
                        value={`${formatModalTwoDecimals(
                          accommodationTokenStakePreview.tokenAmount,
                        )} ${currentStay.tokensTarget?.cur || ''}`}
                      />
                    )}
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t('stay_create_no_price_lock')}
            </p>
          )}
          {showTokenCreditPaymentOptions && (
          <div className="mt-5 flex flex-col gap-3">
            {showFullTokenCreditControls ? (
              <>
                {isWeb3Enabled && tokenAccommodationVal > 0 && (
                  <>
                    {isWalletConnected ? (
                      <div
                        title={
                          isSameDayTokenBooking
                            ? t('stay_create_same_day_tokens_not_supported')
                            : undefined
                        }
                      >
                        <Button
                          onClick={handleApplyTokens}
                          size="small"
                          isFullWidth={false}
                          isEnabled={
                            canUseTokenCreditUiActions &&
                            tokenAmountToApply > 0 &&
                            !isSameDayTokenBooking &&
                            !isCreditsModalOpen &&
                            !isStaking &&
                            !isVerifyingStake
                          }
                          isLoading={
                            isStaking || isVerifyingStake
                          }
                          className={compactPaymentButtonClass}
                        >
                          {t('stay_create_apply_tdf_button')}
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => connectWallet?.()}
                        className="text-sm text-accent underline text-left"
                      >
                        {t('stay_create_connect_wallet_link')}
                      </button>
                    )}
                  </>
                )}
                {!stayUsesTokens ? (
                  <div
                    className={
                      applyCreditsDisabledExplanation
                        ? 'w-full cursor-help'
                        : 'w-full'
                    }
                    {...(applyCreditsDisabledExplanation
                      ? { title: applyCreditsDisabledExplanation }
                      : {})}
                  >
                    <Button
                      onClick={openCreditsConfirmationModal}
                      variant="secondary"
                      size="small"
                      isFullWidth={false}
                      isEnabled={isApplyCreditsEnabled}
                      isLoading={isApplyingCredits}
                      className={compactPaymentButtonClass}
                    >
                      {t('stay_create_apply_credits_button')}
                    </Button>
                  </div>
                ) : (
                  canChangePaymentMethod && (
                    <button
                      type="button"
                      onClick={handleCancelTokenPayment}
                      disabled={
                        isRevertingTokenPayment ||
                        isApplyingCredits ||
                        isStakeModalOpen ||
                        isStaking ||
                        isVerifyingStake
                      }
                      className="text-sm text-accent underline text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRevertingTokenPayment
                        ? t('stay_create_cancel_token_payment_loading')
                        : t('stay_create_cancel_token_payment_link')}
                    </button>
                  )
                )}
              </>
            ) : (
              needsTokenStakeCompletion && (
                <>
                  {isWalletConnected ? (
                    <div
                      title={
                        isSameDayTokenBooking
                          ? t('stay_create_same_day_tokens_not_supported')
                          : undefined
                      }
                    >
                      <Button
                        onClick={handleResumeTokenStake}
                        size="small"
                        isFullWidth={false}
                        isEnabled={
                          !isSameDayTokenBooking &&
                          !isStaking &&
                          !isVerifyingStake
                        }
                        isLoading={isStaking || isVerifyingStake}
                        className={compactPaymentButtonClass}
                      >
                        {t('stay_create_complete_token_stake_button')}
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connectWallet?.()}
                      className="text-sm text-accent underline text-left"
                    >
                      {t('stay_create_connect_wallet_link')}
                    </button>
                  )}
                </>
              )
            )}
            {!canUseTokenCreditUiActions && (
              <p className="text-xs text-gray-500">
                {t('stay_create_payment_method_locked')}
              </p>
            )}
          </div>
          )}
        </BookingSurface>

        <BookingSurface
          as="section"
          tone="elevated"
          padding="lg"
          aria-labelledby="card-heading"
        >
          <Heading id="card-heading" level={2} className="text-lg mb-4">
            {useCardPaymentPrimaryCta && !isMember
              ? t('stay_checkout_cta_card_shortcut_title')
              : showStripeCardInput
                ? t('stay_create_card_title')
                : !isMember
                  ? t('stay_create_request_review_title')
                  : t('stay_create_card_title')}
          </Heading>
          {useCardPaymentPrimaryCta && !isMember ? (
            <p className="text-sm text-muted-foreground mb-4">
              {t('stay_checkout_cta_card_shortcut_body')}
            </p>
          ) : (
            !isMember &&
            fiatOwed > 0 && (
              <p className="text-sm text-gray-600 mb-4">
                {t('stay_create_request_no_card_hint')}
              </p>
            )
          )}
          {showStripeCardInput && (
            <>
              <div className="rounded-xl border border-gray-200 px-4 py-3.5 bg-white">
                <CardElement
                  options={{
                    hidePostalCode: true,
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#111827',
                        fontFamily: 'inherit',
                        '::placeholder': { color: '#9ca3af' },
                      },
                      invalid: { color: '#9f1f42' },
                    },
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {t('stay_create_card_disclaimer')}
              </p>
            </>
          )}

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
          </div>

          <div className="mt-4">
            {useCardPaymentPrimaryCta && !isMember ? (
              <Button
                isEnabled={hasAcceptedTerms && !isProcessing}
                onClick={() => {
                  const pt =
                    Math.round(
                      Number(
                        currentStay.duration ?? currentStay.adults ?? 0,
                      ) || 0,
                    ) || 1;
                  void logMetric({
                    event: 'stay-payment-page-navigated',
                    category: 'co-housing',
                    value: 'payment', point: pt,
                    ...stayMetricFields,
                  });
                  router.push(paymentPageUrl);
                }}
                className="min-h-[48px]"
              >
                {t('stay_checkout_cta_card_shortcut_button')}
              </Button>
            ) : (
              <Button
                isEnabled={hasAcceptedTerms && !isProcessing}
                isLoading={isProcessing}
                onClick={handleConfirmAndPay}
                className="min-h-[48px]"
              >
                {!isMember
                  ? t('buttons_booking_request')
                  : isFree
                    ? t('stay_create_confirm_button')
                    : t('stay_create_confirm_and_pay_button')}
              </Button>
            )}
          </div>

        </BookingSurface>
      </div>
      {isCreditsModalOpen && showTokenCreditPaymentOptions && (
        <Modal closeModal={closeCreditsModal} className="sm:max-w-xl md:w-[560px]">
          <div className="flex flex-col gap-4">
            <Heading level={2} className="text-xl pr-10">
              {t('stay_create_credits_modal_title')}
            </Heading>
            <p className="text-sm text-gray-700">
              {t('stay_create_credits_modal_description')}
            </p>
            <p className="text-sm font-semibold text-system-error">
              {t('stay_create_credits_modal_warning')}
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm space-y-2">
              <p>
                {t('stay_create_credits_modal_amount', {
                  amount: formatModalTwoDecimals(creditsAmountToApply),
                })}
              </p>
              <p className="text-gray-600">
                {t('stay_create_credits_modal_balance', {
                  balance: formatModalTwoDecimals(creditsBalance ?? 0),
                })}
              </p>
              {tokenAccommodationVal > 0 && (
                <p className="text-gray-700">
                  {isFullCreditsForAccommodation
                    ? t('stay_create_credits_modal_scope_full')
                    : t('stay_create_credits_modal_scope_partial')}
                </p>
              )}
            </div>
            <StayQuoteFiatDiscountPreview
              stay={currentStay}
              appliedCredits={creditsAmountToApply}
            />
            {creditsModalError && (
              <div role="alert" aria-live="assertive">
                <ErrorMessage error={creditsModalError} />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={closeCreditsModal}
                isEnabled={!isApplyingCredits}
                className={`${compactPaymentButtonClass} min-h-[40px]`}
              >
                {t('buttons_cancel')}
              </Button>
              <Button
                size="small"
                isFullWidth={false}
                onClick={() => void confirmApplyCredits()}
                isEnabled={!isApplyingCredits}
                isLoading={isApplyingCredits}
                className={`${compactPaymentButtonClass} min-h-[40px]`}
              >
                {t('stay_create_credits_modal_confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {isStakeModalOpen && showTokenCreditPaymentOptions && (
        <Modal closeModal={closeStakeModal} className="sm:max-w-xl md:w-[560px]">
          <div className="flex flex-col gap-4">
            <Heading level={2} className="text-xl pr-10">
              {t('stay_create_stake_modal_title')}
            </Heading>
            <p className="text-sm text-gray-700">
              {t('stay_create_stake_modal_description')}
            </p>
            <p className="text-sm font-semibold text-system-error">
              {t('stay_create_stake_modal_warning')}
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm flex flex-col gap-1">
              <p>
                {t('stay_create_stake_modal_amount_on_chain', {
                  amount: formatModalTwoDecimals(stakePlan?.tokenAmount ?? 0),
                })}
              </p>
              {stakePlan &&
                tokensOwed > 0 &&
                Math.abs(tokensOwed - stakePlan.tokenAmount) > 0.001 && (
                  <p className="text-gray-700">
                    {t('stay_create_stake_modal_tokens_owed_vs_on_chain', {
                      owed: formatModalTwoDecimals(tokensOwed),
                      onChain: formatModalTwoDecimals(stakePlan.tokenAmount),
                    })}
                  </p>
                )}
              <p>
                {t('stay_create_stake_modal_nights', {
                  count: stakePlan?.bookingNights.length || 0,
                })}
              </p>
              {stakePlan && stakePlan.bookingNights.length > 0 && (
                <p className="text-gray-600">
                  {t('stay_create_stake_modal_amount_breakdown', {
                    daily: formatModalTwoDecimals(stakePlan.dailyValue),
                    nights: stakePlan.bookingNights.length,
                    total: formatModalTwoDecimals(stakePlan.tokenAmount),
                  })}
                </p>
              )}
            </div>
            <StayQuoteFiatDiscountPreview
              stay={currentStay}
              appliedTokens={stakePlan?.tokenAmount}
            />
            <div className="rounded-xl border border-gray-200 p-3 text-sm">
              <p className="font-semibold text-gray-900 mb-2">
                {t('wallet_connected_title')}
              </p>
              <p className="text-gray-700">
                {tokenExplorerUrl ? (
                  <a
                    href={tokenExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-accent"
                  >
                    {t('wallet_tdf_available')}
                  </a>
                ) : (
                  t('wallet_tdf_available')
                )}
                :{' '}
                {formatModalTwoDecimals(Number(tokenBalanceAvailable || 0))}
              </p>
              <p className="text-gray-700">
                {t('wallet_celo')}:{' '}
                {formatModalTwoDecimals(displayedNativeCeloBalance)}
              </p>
              {tokenContractAddress && (
                <p className="text-xs text-gray-500 break-all mt-1">
                  {tokenContractAddress}
                </p>
              )}
            </div>
            {isLowCeloForStake && (
              <p className="text-sm text-system-error">
                {t('insufficient_celo_for_gas')}
              </p>
            )}
            {stakeModalError && (
              <div role="alert" aria-live="assertive">
                <ErrorMessage error={stakeModalError} />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={closeStakeModal}
                isEnabled={!isStaking && !isVerifyingStake}
                className={`${compactPaymentButtonClass} min-h-[40px]`}
              >
                {t('buttons_cancel')}
              </Button>
              <Button
                size="small"
                isFullWidth={false}
                onClick={handleStakeTokens}
                isEnabled={!isLowCeloForStake && !isStaking && !isVerifyingStake}
                isLoading={isStaking || isVerifyingStake}
                className={`${compactPaymentButtonClass} min-h-[40px]`}
              >
                {t('stay_create_stake_modal_confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
};

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
}

const Row = ({ label, value, bold }: RowProps) => (
  <div className="flex justify-between items-baseline">
    <span className={bold ? 'font-semibold text-gray-900' : 'text-gray-600'}>
      {label}
    </span>
    <span className={bold ? 'font-semibold text-gray-900 text-base' : 'text-gray-900'}>
      {value}
    </span>
  </div>
);

StayCheckoutPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const foodRes = await api.get('/food').catch(() => null);
    const bookingSettings = config.booking as BookingSettings;
    const generalConfig = (config.general || null) as GeneralConfig | null;
    const volunteerConfig = (config.volunteering ||
      null) as VolunteerConfig | null;
    const foodOptions = foodRes?.data?.results ?? null;
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
