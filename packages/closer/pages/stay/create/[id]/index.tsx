import Head from 'next/head';
import { useRouter } from 'next/router';

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import Conditions from '../../../../components/Conditions';
import FeatureNotEnabled from '../../../../components/FeatureNotEnabled';
import PageError from '../../../../components/PageError';
import Modal from '../../../../components/Modal';
import { ErrorMessage } from '../../../../components/ui';
import BackButton from '../../../../components/ui/BackButton';
import Button from '../../../../components/ui/Button';
import Checkbox from '../../../../components/ui/Checkbox';
import Select from '../../../../components/ui/Select/Dropdown';
import MultiSelect from '../../../../components/ui/Select/MultiSelect';
import { Textarea } from '../../../../components/ui/textarea';
import Heading from '../../../../components/ui/Heading';
import Spinner from '../../../../components/ui/Spinner';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { utils } from 'ethers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { MIN_CELO_FOR_GAS } from '../../../../constants';
import { SHARED_ACCOMMODATION_PREFERENCES } from '../../../../constants/shared.constants';
import config from '../../../../configCached';
import { useAuth } from '../../../../contexts/auth';
import { usePlatform } from '../../../../contexts/platform';
import { WalletDispatch, WalletState } from '../../../../contexts/wallet';
import { useBookingSmartContract } from '../../../../hooks/useBookingSmartContract';
import { useConfig } from '../../../../hooks/useConfig';
import {
  BookingSettings,
  GeneralConfig,
  VolunteerConfig,
} from '../../../../types/api';
import { Listing } from '../../../../types/booking';
import {
  Stay,
  StayCheckoutResponse,
} from '../../../../types/stay';
import api, { cdn } from '../../../../utils/api';
import { parseMessageFromError } from '../../../../utils/common';
import { patchUserAndSyncAuthStore } from '../../../../utils/platformUserSync';
import { loadLocaleData } from '../../../../utils/locale.helpers';
import {
  canChangeStayPaymentMethod,
  checkoutStay,
  computeCreditsOwed,
  computeFiatOwed,
  computeTokensOwed,
  confirmStayCheckout,
  formatStayMoney,
  getStay,
  inferPaymentChoiceFromStay,
  isStayAwaitingPayment,
  isStayPaid,
  isStayTerminal,
  setStayPaymentMethod,
  stakeStayTokens,
  submitStay,
  updateStayOptions,
} from '../../../../utils/stays.api';

dayjs.extend(dayOfYear);

const stripePromise = process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY, {
      stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT,
    })
  : null;

interface Props {
  bookingSettings: BookingSettings | null;
  generalConfig: GeneralConfig | null;
  volunteerConfig: VolunteerConfig | null;
  error?: string;
  messages?: any;
}

const StayCheckoutPage = ({
  bookingSettings,
  generalConfig,
  volunteerConfig,
  error,
}: Props) => {
  const router = useRouter();
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const { platform }: any = usePlatform();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const idParam = router.query.id;
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
          className="max-w-3xl mx-auto p-4 md:p-6 text-center"
        >
          <Heading level={1}>{t('stay_create_login_required_title')}</Heading>
          <p className="mt-3 mb-6 text-gray-600">
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
        <main id="main-content" className="max-w-3xl mx-auto p-4 md:p-6">
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
        <main id="main-content" className="max-w-3xl mx-auto p-4 md:p-6">
          <Heading level={1}>{t(`stay_status_${stay.status}_title`)}</Heading>
          <p className="mt-3 text-gray-600">
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
  const [isApplyingBalance, setIsApplyingBalance] = useState(false);
  const [isSavingOptions, setIsSavingOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isVerifyingStake, setIsVerifyingStake] = useState(false);
  const [stakeModalError, setStakeModalError] = useState<string | null>(null);
  const [modalNativeCeloBalance, setModalNativeCeloBalance] = useState<
    number | null
  >(null);
  const [stakePlan, setStakePlan] = useState<{
    dailyValue: number;
    bookingNights: number[][];
    tokenAmount: number;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittedToPending, setSubmittedToPending] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [creditsModalError, setCreditsModalError] = useState<string | null>(
    null,
  );
  const [isApplyingCredits, setIsApplyingCredits] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingStayMessage, setIsSavingStayMessage] = useState(false);
  const [userPreferences, setUserPreferences] = useState<{
    diet: string[];
    sharedAccomodation: string;
  }>({ diet: [], sharedAccomodation: '' });
  const [stayMessage, setStayMessage] = useState(stay.message || '');

  useEffect(() => {
    setCurrentStay(stay);
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
    if (isStayPaid(currentStay)) {
      router.replace(`/stay/create/${currentStay._id}/confirmation`);
    }
  }, [currentStay.status, currentStay._id, router]);

  const priceLock = currentStay.priceLock;
  const isFree =
    !priceLock ||
    (priceLock.total.val === 0 &&
      (currentStay.creditsTarget?.val || 0) === 0 &&
      (currentStay.tokensTarget?.val || 0) === 0);

  const tokenAccommodationVal = priceLock?.dailyRentalToken?.val
    ? priceLock.dailyRentalToken.val * (currentStay.duration || 1)
    : 0;

  const fiatOwed = computeFiatOwed(currentStay);
  const creditsOwed = computeCreditsOwed(currentStay);
  const tokensOwed = computeTokensOwed(currentStay);

  const canChangePaymentMethod = canChangeStayPaymentMethod(currentStay);

  const paymentChoice = useMemo(
    () => inferPaymentChoiceFromStay(currentStay, tokenAccommodationVal),
    [currentStay, tokenAccommodationVal],
  );
  const hasAlternativeAccommodationPayment = paymentChoice !== 'fiat';

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
        hasAlternativeAccommodationPayment &&
        (lock.appliedCredits.val > 0 || lock.appliedTokens.val > 0),
      showGrossStrikeThrough,
    };
  }, [currentStay.priceLock, hasAlternativeAccommodationPayment]);

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

  const isWeb3Enabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';
  const needsTokenStakeCompletion =
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
    canChangePaymentMethod &&
    creditsAmountToApply > 0 &&
    !isApplyingBalance &&
    !isApplyingCredits;

  const isFullCreditsForAccommodation =
    creditsAmountToApply >= tokenAccommodationVal && tokenAccommodationVal > 0;

  const compactPaymentButtonClass =
    '!normal-case tracking-normal min-h-[36px] text-sm';

  const applyCreditsDisabledExplanation = useMemo(() => {
    if (isApplyCreditsEnabled || isApplyingBalance || isApplyingCredits) {
      return undefined;
    }
    if (!canChangePaymentMethod) {
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
    isApplyingBalance,
    isApplyingCredits,
    canChangePaymentMethod,
    tokenAccommodationVal,
    creditsBalance,
    t,
  ]);

  const hasPendingExtension =
    !!currentStay.pendingExtension &&
    !!currentStay.pendingExtension.requestedAt;

  const { stakeTokens, isStaking, checkContract } = useBookingSmartContract({
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
    const startDate = dayjs(stayToStake.start);
    const duration = stayToStake.duration || 0;
    const dailyValue = stayToStake.priceLock?.dailyRentalToken?.val || 0;
    const tokensToStake = computeTokensOwed(stayToStake);

    if (!startDate.isValid() || duration <= 0 || dailyValue <= 0) return null;

    const nightsToStake = Math.min(
      duration,
      Math.floor(tokensToStake / dailyValue),
    );
    if (nightsToStake <= 0) return null;

    return {
      dailyValue,
      tokenAmount: Number((nightsToStake * dailyValue).toFixed(6)),
      bookingNights: Array.from({ length: nightsToStake }, (_, i) => [
        startDate.year(),
        startDate.dayOfYear() + i,
      ]),
    };
  };

  const handleApplyTokens = async () => {
    if (!canChangePaymentMethod) return;
    if (isSameDayTokenBooking) return;
    if (!isWalletConnected || tokenAmountToApply <= 0) return;
    setActionError(null);
    setIsApplyingBalance(true);
    try {
      let editableStay = currentStay;
      if (editableStay.status === 'draft') {
        editableStay = await submitStay(editableStay._id);
        setCurrentStay(editableStay);
      }
      const payload =
        tokenAmountToApply >= tokenAccommodationVal
          ? { method: 'full-tokens' as const }
          : {
              method: 'partial-tokens' as const,
              appliedTokens: tokenAmountToApply,
            };
      const updated = await setStayPaymentMethod(editableStay._id, payload);
      setCurrentStay(updated);
      const nextStakePlan = buildStakePlan(updated);
      if (!nextStakePlan) {
        setActionError(t('stay_create_token_stake_plan_error'));
        return;
      }
      setStakePlan(nextStakePlan);
      setStakeModalError(null);
      setIsStakeModalOpen(true);
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
      setIsApplyingBalance(false);
    }
  };

  const handleResumeTokenStake = () => {
    if (isSameDayTokenBooking) return;
    if (!isWalletConnected || tokensOwed <= 0) return;
    setActionError(null);
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
    try {
      const stakingResult = await stakeTokens(stakePlan.dailyValue);
      if (!stakingResult) {
        setStakeModalError(t('stay_create_token_stake_failed'));
        return;
      }
      if (stakingResult?.error || !stakingResult?.success?.transactionId) {
        setStakeModalError(
          parseMessageFromError(stakingResult?.error) ||
            t('stay_create_token_stake_failed'),
        );
        return;
      }

      if (stakingResult.success.transactionId === 'existing') {
        setStakeModalError(t('stay_create_token_stake_existing_conflict'));
        return;
      }

      const onChainCheck = await checkContract();
      if (!onChainCheck?.success) {
        setStakeModalError(
          onChainCheck?.error || t('stay_create_token_stake_failed'),
        );
        return;
      }

      setIsVerifyingStake(true);
      const stakeResult = await stakeStayTokens(
        currentStay._id,
        stakingResult.success.transactionId,
      );
      setCurrentStay(stakeResult.booking);
      setIsStakeModalOpen(false);
      setStakePlan(null);
      setStakeModalError(null);
    } catch (err) {
      setStakeModalError(parseMessageFromError(err));
    } finally {
      setIsVerifyingStake(false);
    }
  };

  const openCreditsConfirmationModal = () => {
    if (!canChangePaymentMethod || creditsAmountToApply <= 0) return;
    setCreditsModalError(null);
    setIsCreditsModalOpen(true);
  };

  const closeCreditsModal = () => {
    setIsCreditsModalOpen(false);
    setCreditsModalError(null);
  };

  const confirmApplyCredits = async () => {
    if (!canChangePaymentMethod || creditsAmountToApply <= 0) return;
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
    try {
      let workingStay = currentStay;
      if (workingStay.status === 'draft') {
        workingStay = await submitStay(workingStay._id);
        setCurrentStay(workingStay);
      }

      if (workingStay.status === 'pending') {
        setSubmittedToPending(true);
        return;
      }

      if (isStayPaid(workingStay)) {
        router.push(`/stay/create/${workingStay._id}/confirmation`);
        return;
      }

      const liveFiatOwed = computeFiatOwed(workingStay);
      const card = elements?.getElement(CardElement) ?? null;
      if (liveFiatOwed > 0 && !card) {
        setActionError(t('stay_create_card_required'));
        return;
      }

      let stripePaymentMethodId = '';
      if (liveFiatOwed > 0 && stripe && card) {
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
        router.push(`/stay/create/${refreshed._id}/confirmation`);
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

  if (submittedToPending) {
    return (
      <main
        id="main-content"
        className="max-w-2xl mx-auto px-4 py-12 text-center"
      >
        <Heading level={1} className="mb-4">
          {t('stay_create_pending_title')}
        </Heading>
        <p className="text-gray-600 mb-8">
          {t('stay_create_pending_description')}
        </p>
        <Button
          onClick={() => router.push(`/stay/create/${currentStay._id}`)}
          isFullWidth={false}
          className="px-8 min-h-[44px]"
        >
          {t('stay_create_view_booking')}
        </Button>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-12 pb-32 lg:pb-12"
    >
      <div className="mb-6 md:mb-8">
        <BackButton handleClick={() => router.push('/stay/create')}>
          {t('buttons_back')}
        </BackButton>
      </div>

      <div className="text-center mb-8 md:mb-10">
        <Heading level={1} className="text-3xl md:text-4xl">
          {t('stay_create_checkout_title')}
        </Heading>
      </div>

      {hasPendingExtension && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm text-amber-900">
            {t('stay_create_pending_extension', {
              end: dayjs(currentStay.pendingExtension!.end).format(
                'MMM D, YYYY',
              ),
            })}
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto flex flex-col gap-4 md:gap-6">
        <section
          aria-labelledby="trip-summary-heading"
          className="rounded-2xl border border-gray-200 p-4 md:p-5"
        >
          <Heading id="trip-summary-heading" level={2} className="text-lg mb-4">
            {t('stay_create_your_trip')}
          </Heading>
          <div className="flex gap-4">
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
          <div className="mt-5">
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
              <Checkbox
                isChecked={!!currentStay.doesNeedSeparateBeds}
                onChange={() =>
                  handleToggleOption({
                    doesNeedSeparateBeds: !currentStay.doesNeedSeparateBeds,
                  })
                }
                isEnabled={!isSavingOptions}
                id="opt-separate"
              >
                {t('stay_create_option_separate_beds')}
              </Checkbox>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="preferences-heading"
          className="rounded-2xl border border-gray-200 p-4 md:p-5"
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
        </section>

        <section
          aria-labelledby="summary-heading"
          className="rounded-2xl border border-gray-200 p-4 md:p-5 bg-white"
        >
          <Heading id="summary-heading" level={2} className="text-lg mb-4">
            {t('stay_create_summary_title')}
          </Heading>
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
                          amount: `${priceLock.appliedCredits.val} ${priceLock.appliedCredits.cur}`,
                        })}
                      </span>
                    )}
                    {priceLock.appliedTokens.val > 0 && (
                      <span>
                        {t('stay_create_accommodation_benefit_tokens', {
                          amount: `${priceLock.appliedTokens.val} ${priceLock.appliedTokens.cur}`,
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
              {priceLock.vat.val > 0 && (
                <p className="text-xs text-gray-500 -mt-1">
                  {t('stay_create_includes_vat', {
                    amount: formatStayMoney(priceLock.vat),
                  })}
                </p>
              )}
              <Row
                bold
                label={t('stay_create_line_total')}
                value={formatStayMoney(priceLock.total)}
              />
              {priceLock.appliedCredits.val > 0 && (
                <Row
                  label={t('stay_create_line_credits_applied')}
                  value={`-${priceLock.appliedCredits.val} ${priceLock.appliedCredits.cur}`}
                />
              )}
              {priceLock.appliedTokens.val > 0 && (
                <Row
                  label={t('stay_create_line_tokens_applied')}
                  value={`-${priceLock.appliedTokens.val} ${priceLock.appliedTokens.cur}`}
                />
              )}
              <hr className="my-2 border-gray-200" />
              <Row
                label={t('stay_create_line_fiat_owed')}
                value={formatStayMoney({
                  val: fiatOwed,
                  cur: priceLock.total.cur,
                })}
              />
              {creditsOwed > 0 && (
                <Row
                  label={t('stay_create_line_credits_owed')}
                  value={`${creditsOwed} credits`}
                />
              )}
              {tokensOwed > 0 && (
                <Row
                  label={t('stay_create_line_tokens_owed')}
                  value={`${tokensOwed} ${currentStay.tokensTarget?.cur || ''}`}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t('stay_create_no_price_lock')}
            </p>
          )}
          <div className="mt-5 flex flex-col gap-3">
            {!hasAlternativeAccommodationPayment ? (
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
                            canChangePaymentMethod &&
                            tokenAmountToApply > 0 &&
                            !isSameDayTokenBooking &&
                            !isApplyingBalance &&
                            !isStaking &&
                            !isVerifyingStake
                          }
                          isLoading={
                            isApplyingBalance || isStaking || isVerifyingStake
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
            {!canChangePaymentMethod && (
              <p className="text-xs text-gray-500">
                {t('stay_create_payment_method_locked')}
              </p>
            )}
          </div>
        </section>

        <section
          aria-labelledby="card-heading"
          className="rounded-2xl border border-gray-200 p-4 md:p-5"
        >
          <Heading id="card-heading" level={2} className="text-lg mb-4">
            {t('stay_create_card_title')}
          </Heading>
          {fiatOwed > 0 && (
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
            <Button
              isEnabled={hasAcceptedTerms && !isProcessing}
              isLoading={isProcessing}
              onClick={handleConfirmAndPay}
              className="min-h-[48px]"
            >
              {isFree
                ? t('stay_create_confirm_button')
                : t('stay_create_confirm_and_pay_button')}
            </Button>
          </div>

          <p className="text-[11px] text-gray-500 mt-3">
            {t('stay_create_status_label')}:{' '}
            <span className="capitalize">{currentStay.status}</span>
          </p>
        </section>
      </div>
      {isCreditsModalOpen && (
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
                  amount: creditsAmountToApply,
                })}
              </p>
              <p className="text-gray-600">
                {t('stay_create_credits_modal_balance', {
                  balance: creditsBalance,
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
      {isStakeModalOpen && (
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
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
              <p>
                {t('stay_create_stake_modal_amount', {
                  amount: stakePlan?.tokenAmount || 0,
                })}
              </p>
              <p>
                {t('stay_create_stake_modal_nights', {
                  count: stakePlan?.bookingNights.length || 0,
                })}
              </p>
            </div>
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
                : {tokenBalanceAvailable || '0'}
              </p>
              <p className="text-gray-700">
                {t('wallet_celo')}: {displayedNativeCeloBalance}
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
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    const bookingSettings = config.booking as BookingSettings;
    const generalConfig = (config.general || null) as GeneralConfig | null;
    const volunteerConfig = (config.volunteering ||
      null) as VolunteerConfig | null;
    return { bookingSettings, generalConfig, volunteerConfig, messages };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingSettings: null,
      generalConfig: null,
      volunteerConfig: null,
      messages: null,
    };
  }
};

export default StayCheckoutPage;
