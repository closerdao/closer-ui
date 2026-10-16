import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { StakeErrorDetails } from '../../components/booking/StakeErrorDetails';

import dayjs from 'dayjs';
import { utils as ethersUtils } from 'ethers';
import { useTranslations } from 'next-intl';

import { MIN_CELO_FOR_GAS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletDispatch, WalletState } from '../../contexts/wallet';
import { useBookingSmartContract } from '../../hooks/useBookingSmartContract';
import { useConfig } from '../../hooks/useConfig';
import { useStakeConflict } from '../../hooks/useStakeConflict';
import { useStayCreditsEligibility } from '../../hooks/useStayCreditsEligibility';
import { useStayTokenBalance } from '../../hooks/useStayTokenBalance';
import { useStayTokenStakeVerification } from '../../hooks/useStayTokenStakeVerification';
import { useTokenAmountFormatter } from '../../hooks/useTokenAmountFormatter';
import type { Stay, StayTokenStakePlan } from '../../types/stay';
import { parseMessageFromError } from '../../utils/common';
import {
  formatStakeBookingErrorForUi,
  reportStakeBookingError,
  stakeErrorDetails,
} from '../../utils/stakeBookingError.helpers';
import {
  clearPendingStayTokenStake,
  readPendingStayTransactionIds,
} from '../../utils/stayTokenStakePendingStorage';
import { stakeStayTokenPlan } from '../../utils/stayTokenStakeRunner';
import { isStakeVerificationAborted } from '../../utils/stayTokenStakeVerification';
import {
  buildStayTokenStakePlan,
  canChangeStayPaymentMethod,
  canShowStayTokenCreditPaymentOptions,
  computeFiatOwed,
  computeTokensOwed,
  formatStakeNights,
  formatStayMoney,
  getStay,
  getStayAccommodationTokenTotal,
  inferPaymentChoiceFromStay,
  isStayAwaitingHostApproval,
  isStayCheckoutDraft,
  setStayPaymentMethod,
  stayUsesTokenAccommodation,
  submitStay,
} from '../../utils/stays.api';
import {
  accommodationCapWei,
  tokenPaymentFromBalance,
} from '../../utils/tokenAmounts';
import Modal from '../Modal';
import WalletActions from '../WalletActions';
import { ErrorMessage, Information } from '../ui';
import Button from '../ui/Button';
import Heading from '../ui/Heading';
import { StayQuoteFiatDiscountPreview } from './stayQuoteFiatDiscountPreview';
import { StayTokenStakeAmountSummary } from './stayTokenStakeAmountSummary';
import { StayTokenStakeBatchProgress } from './stayTokenStakeBatchProgress';
import StayTokenStakeConflictNotice from './stayTokenStakeConflictNotice';

const formatModalTwoDecimals = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : '0.00';

const compactPaymentButtonClass =
  '!normal-case tracking-normal min-h-[36px] text-sm';

export type StayPaymentTokenCreditControlsProps = {
  stay: Stay;
  onStaySynced: (updated?: Stay) => Promise<unknown>;
  setBannerError: (message: string | null) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onFiatSwitchNotice?: (message: string | null) => void;
};

export function StayPaymentTokenCreditControls({
  stay,
  onStaySynced,
  setBannerError,
  disabled = false,
  onBusyChange,
  onFiatSwitchNotice,
}: StayPaymentTokenCreditControlsProps) {
  const t = useTranslations();
  const formatTokenAmount = useTokenAmountFormatter();
  const { user } = useAuth();
  const isMember = Boolean(user?.roles?.includes('member'));
  const { creditsBalance, canApplyCreditsAtStart } =
    useStayCreditsEligibility(stay);
  const { BLOCKCHAIN_DAO_TOKEN, BLOCKCHAIN_EXPLORER_URL } = useConfig() || {};
  const {
    account,
    chainId,
    isWalletReady,
    balanceStatus,
    balanceAvailable: tokenBalanceAvailable,
    balanceCeloAvailable,
    balanceNativeAvailable,
  } = useContext(WalletState);
  const { refreshBalances } = useContext(WalletDispatch);

  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [stakeModalError, setStakeModalError] = useState<string | null>(null);
  const [stakeDetails, setStakeDetails] = useState('');
  const describeStakeError = (error: unknown, translator: typeof t) => {
    setStakeDetails(stakeErrorDetails(error));
    reportStakeBookingError(error, {
      bookingId: stay._id,
      stage: isVerifyingStake ? 'verify' : 'stake',
      requestedWei: stakePlan?.totalWei,
      transactionId: pendingVerification?.transactionId,
    });
    return formatStakeBookingErrorForUi(error, translator);
  };

  const { hasStakeConflict, clearStakeConflict, catchStakeConflict } =
    useStakeConflict();
  const [tokenStakeSuccessNotice, setTokenStakeSuccessNotice] = useState<
    string | null
  >(null);
  const [skippedStakeNightsNotice, setSkippedStakeNightsNotice] = useState<
    string | null
  >(null);
  const [stakePlan, setStakePlan] = useState<StayTokenStakePlan | null>(null);
  const {
    isVerifying: isVerifyingStake,
    pendingVerification,
    verifyStake,
  } = useStayTokenStakeVerification(stay._id, buildStayTokenStakePlan(stay));
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isWalletSetupOpen, setIsWalletSetupOpen] = useState(false);
  const [creditsModalError, setCreditsModalError] = useState<string | null>(
    null,
  );
  const [isApplyingCredits, setIsApplyingCredits] = useState(false);
  const [isRevertingTokenPayment, setIsRevertingTokenPayment] = useState(false);
  const [isPreparingTokenStake, setIsPreparingTokenStake] = useState(false);
  const [isSubmittingStake, setIsSubmittingStake] = useState(false);
  const [hasObservedStake, setHasObservedStake] = useState(false);
  const [fiatSwitchNotice, setFiatSwitchNotice] = useState<string | null>(null);
  const paymentMethodChangeInFlight = useRef(false);
  const stayUsesTokens = stayUsesTokenAccommodation(stay);

  const showTokenCreditPaymentOptions =
    canShowStayTokenCreditPaymentOptions(stay, isMember) ||
    (['confirmed', 'pending-payment', 'tokens-staked', 'credits-paid'].includes(
      stay.status,
    ) &&
      (stayUsesTokens || computeTokensOwed(stay) > 0));
  const tokenAccommodationVal = getStayAccommodationTokenTotal(stay);
  const tokensOwed = computeTokensOwed(stay);
  const paymentChoice = useMemo(
    () => inferPaymentChoiceFromStay(stay, tokenAccommodationVal),
    [stay, tokenAccommodationVal],
  );
  const canChangePaymentMethod =
    canShowStayTokenCreditPaymentOptions(stay, isMember) &&
    canChangeStayPaymentMethod(stay);
  const isWeb3Enabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';
  const profileBalance = useStayTokenBalance(
    stay,
    isWeb3Enabled && showTokenCreditPaymentOptions,
  );
  const canUseWalletTokens =
    isWalletReady &&
    balanceStatus === 'ready' &&
    !!account &&
    account.toLowerCase() === profileBalance.walletAddress?.toLowerCase();
  const stakingWalletScope = `${account}:${chainId}:${canUseWalletTokens}:${profileBalance.walletAddress}`;
  const currentStakingWalletScope = useRef(stakingWalletScope);
  currentStakingWalletScope.current = stakingWalletScope;
  const needsTokenStakeCompletion =
    showTokenCreditPaymentOptions && isWeb3Enabled && tokensOwed > 0;
  const walletNativeCeloBalance = Number(
    balanceNativeAvailable ?? balanceCeloAvailable ?? 0,
  );
  const displayedNativeCeloBalance = Number(walletNativeCeloBalance);
  const tokenContractAddress = BLOCKCHAIN_DAO_TOKEN?.address;
  const tokenExplorerUrl =
    tokenContractAddress && BLOCKCHAIN_EXPLORER_URL
      ? `${BLOCKCHAIN_EXPLORER_URL}/address/${tokenContractAddress}`
      : null;
  const hasProfileTokens =
    profileBalance.balanceWei != null && BigInt(profileBalance.balanceWei) > 0n;
  const isSameDayTokenBooking = dayjs(stay.start).isSame(dayjs(), 'day');
  const creditsAmountToApply = Math.max(
    0,
    Math.min(creditsBalance || 0, tokenAccommodationVal),
  );
  const isApplyCreditsEnabled =
    canChangePaymentMethod &&
    !stayUsesTokens &&
    canApplyCreditsAtStart &&
    creditsAmountToApply > 0 &&
    !isApplyingCredits &&
    !isPreparingTokenStake &&
    !isStakeModalOpen;
  const isFullCreditsForAccommodation =
    creditsAmountToApply >= tokenAccommodationVal && tokenAccommodationVal > 0;

  const applyCreditsDisabledExplanation = useMemo(() => {
    if (stayUsesTokens) {
      return undefined;
    }
    if (isApplyCreditsEnabled || isApplyingCredits) {
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
    if (!canApplyCreditsAtStart) {
      return t('stay_create_apply_credits_disabled_not_valid_at_checkin');
    }
    return undefined;
  }, [
    isApplyCreditsEnabled,
    isApplyingCredits,
    isPreparingTokenStake,
    stayUsesTokens,
    canChangePaymentMethod,
    tokenAccommodationVal,
    creditsBalance,
    canApplyCreditsAtStart,
    isStakeModalOpen,
    t,
  ]);

  const {
    stakeTokens,
    isStaking,
    stakingProgress,
    resetStakingProgress,
    countStakedPlanNights,
  } = useBookingSmartContract({
    bookingNights: stakePlan?.bookingNights || [],
  });

  const hasRecordedStake =
    (stay.tokensStaked?.val ?? 0) > 0 ||
    hasObservedStake ||
    (stakingProgress?.completedNights ?? 0) > 0;
  // A submitted transaction or a successful batch survives closing the modal
  // and reloading, even before the API has recorded any tokens.
  const hasUnverifiedStake =
    !!pendingVerification || readPendingStayTransactionIds(stay._id).length > 0;
  const isStakePending = isSubmittingStake || isStaking || isVerifyingStake;
  const canSwitchToFiat =
    stayUsesTokens &&
    canChangeStayPaymentMethod(stay) &&
    !hasRecordedStake &&
    !hasUnverifiedStake;
  const isSwitchToFiatEnabled =
    canSwitchToFiat &&
    !disabled &&
    !isStakePending &&
    !isPreparingTokenStake &&
    !isApplyingCredits &&
    !isRevertingTokenPayment;
  const fiatCurrency =
    stay.priceLock?.total?.cur || stay.fiatTarget?.cur || 'EUR';
  const tokenCurrency =
    stay.tokensTarget?.cur || stay.appliedTokens?.cur || 'TDF';
  const stakeWalletActions =
    stay.createdBy && stay.createdBy !== user?._id ? (
      <Information>{t('stay_payment_stake_owner_wallet')}</Information>
    ) : (
      <WalletActions requireBalance />
    );
  const paymentMethodLockedReason =
    isStakePending || pendingVerification
      ? t('stay_payment_token_switch_pending')
      : hasRecordedStake
        ? t('stay_payment_token_switch_staked', { currency: tokenCurrency })
        : hasUnverifiedStake
          ? t('stay_payment_token_switch_pending')
          : stay.pendingModification
            ? t('stay_payment_token_switch_held')
            : stay.residencyAgreementId
              ? t('stay_payment_token_switch_agreement')
              : t('stay_create_payment_method_locked');

  useEffect(() => {
    if ((stakingProgress?.completedNights ?? 0) > 0) setHasObservedStake(true);
  }, [stakingProgress?.completedNights]);

  useEffect(() => {
    if (!isStayAwaitingHostApproval(stay) && !isStayCheckoutDraft(stay)) {
      return;
    }
    setIsCreditsModalOpen(false);
    setIsStakeModalOpen(false);
    setStakeModalError(null);
    setStakePlan(null);
  }, [stay.status]);

  useEffect(() => {
    if (isStakeModalOpen && isWalletReady) void refreshBalances?.();
  }, [isStakeModalOpen, isWalletReady, refreshBalances]);

  const nativeCelo = displayedNativeCeloBalance;
  const isLowCeloForStake = canUseWalletTokens && nativeCelo < MIN_CELO_FOR_GAS;

  const buildStakePlan = (stayToStake: Stay) => {
    const owed = computeTokensOwed(stayToStake);
    if (owed <= 0) return null;
    return buildStayTokenStakePlan(stayToStake, owed);
  };

  const handleApplyTokens = async () => {
    if (disabled || !showTokenCreditPaymentOptions) return;
    if (!canChangePaymentMethod) return;
    if (isSameDayTokenBooking) return;
    if (!hasProfileTokens || isPreparingTokenStake) return;
    if (isCreditsModalOpen) return;
    setBannerError(null);
    setFiatSwitchNotice(null);
    onFiatSwitchNotice?.(null);

    setIsPreparingTokenStake(true);
    try {
      const tokenBalanceAvailableWei = await profileBalance.refresh();
      if (BigInt(tokenBalanceAvailableWei) === 0n)
        throw new Error(t('error_insufficient_token_balance'));
      const payload = tokenPaymentFromBalance(
        tokenBalanceAvailableWei,
        accommodationCapWei(stay, BLOCKCHAIN_DAO_TOKEN?.decimals || 18),
      );
      const updated = await setStayPaymentMethod(stay._id, payload);
      const plan = buildStayTokenStakePlan(updated);
      if (!plan) throw new Error(t('stay_create_token_stake_plan_error'));
      await onStaySynced(updated);
      setStakePlan(plan);
      setStakeModalError(null);
      resetStakingProgress();
      setIsStakeModalOpen(true);
    } catch (err) {
      setBannerError(parseMessageFromError(err));
    } finally {
      setIsPreparingTokenStake(false);
    }
  };

  const handleResumeTokenStake = () => {
    if (disabled || !showTokenCreditPaymentOptions) return;
    if (isSameDayTokenBooking && !pendingVerification) return;
    if ((!canUseWalletTokens && !pendingVerification) || tokensOwed <= 0)
      return;
    setBannerError(null);
    const nextStakePlan = buildStakePlan(stay);
    if (!nextStakePlan) {
      setBannerError(t('stay_create_token_stake_plan_error'));
      return;
    }
    setStakePlan(nextStakePlan);
    setStakeModalError(null);
    resetStakingProgress();
    setIsStakeModalOpen(true);
  };

  useEffect(() => {
    onBusyChange?.(
      isStaking ||
        isSubmittingStake ||
        isVerifyingStake ||
        isPreparingTokenStake ||
        isRevertingTokenPayment ||
        isApplyingCredits ||
        isStakeModalOpen ||
        isCreditsModalOpen,
    );
    return () => onBusyChange?.(false);
  }, [
    isStaking,
    isSubmittingStake,
    isVerifyingStake,
    isPreparingTokenStake,
    isRevertingTokenPayment,
    isApplyingCredits,
    isStakeModalOpen,
    isCreditsModalOpen,
    onBusyChange,
  ]);

  const closeStakeModal = () => {
    if (isStakePending || isRevertingTokenPayment) return;
    setIsStakeModalOpen(false);
    setStakeModalError(null);
    clearStakeConflict();
    setSkippedStakeNightsNotice(null);
    setStakePlan(null);
    resetStakingProgress();
  };

  const finishStakeVerification = async () => {
    await onStaySynced();
    setTokenStakeSuccessNotice(t('stay_create_token_stake_success'));
    setIsStakeModalOpen(false);
    setStakePlan(null);
    setStakeModalError(null);
  };

  const handleRetryStakeVerification = async () => {
    if (!stakePlan || !pendingVerification || isVerifyingStake) return;
    setStakeModalError(null);
    try {
      await verifyStake(stakePlan, pendingVerification.transactionId);
      await finishStakeVerification();
    } catch (error) {
      if (!isStakeVerificationAborted(error))
        setStakeModalError(describeStakeError(error, t));
    }
  };

  const handleStakeTokens = async () => {
    if (disabled || isStakePending || isRevertingTokenPayment) return;
    if (!stakePlan) return;
    if (!canUseWalletTokens) return;
    if (isLowCeloForStake) {
      setStakeModalError(t('insufficient_celo_for_gas'));
      return;
    }

    setStakeModalError(null);
    clearStakeConflict();
    setBannerError(null);
    setIsSubmittingStake(true);
    let stayForStake = stay;
    try {
      if (isStayCheckoutDraft(stayForStake)) {
        const submitted = await submitStay(stayForStake._id);
        await onStaySynced();
        stayForStake = (await getStay(submitted._id)) ?? submitted;

        if (isStayAwaitingHostApproval(stayForStake)) {
          setIsStakeModalOpen(false);
          setStakePlan(null);
          return;
        }
      }

      const planToUse = buildStayTokenStakePlan(stayForStake) || stakePlan;
      if (!planToUse) {
        setStakeModalError(t('stay_create_token_stake_plan_error'));
        return;
      }
      setStakePlan(planToUse);
      // Nights already on chain revert with `date should be in the future`,
      // so a stake signs only what is left, one batch per segment rate.
      const stakedNightCount = await countStakedPlanNights(planToUse.segments);
      if (stakedNightCount > 0) setHasObservedStake(true);
      // Refresh the displayed balance before new transactions. The existing
      // contract simulation checks the exact funds needed for each remaining
      // batch, including partial stakes and reused deposits.
      if (stakedNightCount < planToUse.bookingNights.length) {
        await profileBalance.refresh();
      }
      if (stakingWalletScope !== currentStakingWalletScope.current) {
        throw new Error(t('wallet_error_account_mismatch'));
      }
      const stakeRun = await stakeStayTokenPlan({
        stayId: stayForStake._id,
        plan: planToUse,
        stakedNightCount,
        stakeTokens,
      });
      if (stakeRun.stakedNightCount > 0) setHasObservedStake(true);
      const { result: stakingResult, skippedNights } = stakeRun;
      const skippedNotice = skippedNights.length
        ? t('stay_create_token_stake_skipped_past_nights', {
            nights: formatStakeNights(skippedNights),
          })
        : null;
      if (stakeRun.onlyPastNightsLeft) {
        setSkippedStakeNightsNotice(
          `${skippedNotice} ${t('stay_create_token_stake_past_nights_unpayable')}`,
        );
        setIsStakeModalOpen(false);
        setStakePlan(null);
        return;
      }
      setSkippedStakeNightsNotice(skippedNotice);
      if (!stakingResult) {
        setStakeModalError(t('stay_create_token_stake_failed'));
        return;
      }
      if (stakingResult?.error || !stakingResult?.success?.transactionId) {
        if (
          catchStakeConflict(stakingResult?.error, stakeRun.stakedNightCount)
        ) {
          return;
        }
        const failure =
          describeStakeError(stakingResult?.error, t) ||
          t('stay_create_token_stake_failed');
        setStakeModalError(
          stakeRun.stakedNightCount > 0
            ? t('stay_create_token_stake_partial_failure', {
                staked: stakeRun.stakedNightCount,
                total: stakeRun.totalNightCount,
                message: failure,
              })
            : failure,
        );
        return;
      }

      let transactionId = stakingResult.success.transactionId;
      if (transactionId === 'existing') {
        transactionId = '';
        if (!readPendingStayTransactionIds(stayForStake._id).length) {
          const fresh = await getStay(stayForStake._id);
          if (computeTokensOwed(fresh) === 0) {
            clearPendingStayTokenStake(stayForStake._id);
            await finishStakeVerification();
            return;
          }
        }
      }
      await verifyStake(planToUse, transactionId);
      await finishStakeVerification();
    } catch (error) {
      if (!isStakeVerificationAborted(error))
        setStakeModalError(describeStakeError(error, t));
    } finally {
      setIsSubmittingStake(false);
    }
  };

  const openCreditsConfirmationModal = () => {
    if (disabled || !showTokenCreditPaymentOptions) return;
    if (stayUsesTokens) return;
    if (
      !canChangePaymentMethod ||
      !canApplyCreditsAtStart ||
      creditsAmountToApply <= 0
    )
      return;
    if (isStakeModalOpen) return;
    setCreditsModalError(null);
    setIsCreditsModalOpen(true);
    setFiatSwitchNotice(null);
    onFiatSwitchNotice?.(null);
  };

  const closeCreditsModal = () => {
    setIsCreditsModalOpen(false);
    setCreditsModalError(null);
  };

  const confirmApplyCredits = async () => {
    if (disabled || !showTokenCreditPaymentOptions) return;
    if (stayUsesTokens) return;
    if (
      !canChangePaymentMethod ||
      !canApplyCreditsAtStart ||
      creditsAmountToApply <= 0
    )
      return;
    setCreditsModalError(null);
    setBannerError(null);
    setIsApplyingCredits(true);
    try {
      const payload =
        creditsAmountToApply >= tokenAccommodationVal
          ? { method: 'full-credits' as const }
          : {
              method: 'partial-credits' as const,
              appliedCredits: creditsAmountToApply,
            };
      const updated = await setStayPaymentMethod(stay._id, payload);
      if (stay.status === 'draft') {
        await submitStay(updated._id);
      }
      await onStaySynced();
      setIsCreditsModalOpen(false);
    } catch (err) {
      setCreditsModalError(parseMessageFromError(err));
    } finally {
      setIsApplyingCredits(false);
    }
  };

  const handleCancelTokenPayment = async () => {
    if (
      !isSwitchToFiatEnabled ||
      paymentMethodChangeInFlight.current ||
      readPendingStayTransactionIds(stay._id).length > 0
    )
      return false;
    paymentMethodChangeInFlight.current = true;
    setCreditsModalError(null);
    setBannerError(null);
    setIsRevertingTokenPayment(true);
    try {
      const updated = await setStayPaymentMethod(stay._id, { method: 'fiat' });
      if (stay.status === 'draft') {
        await submitStay(updated._id);
      }
      await onStaySynced(updated);
      setTokenStakeSuccessNotice(null);
      setSkippedStakeNightsNotice(null);
      const notice = t('stay_payment_token_switch_success', {
        currency: tokenCurrency,
        amount: formatStayMoney({
          val: computeFiatOwed(updated),
          cur:
            updated.priceLock?.total?.cur ||
            updated.fiatTarget?.cur ||
            fiatCurrency,
        }),
      });
      if (onFiatSwitchNotice) onFiatSwitchNotice(notice);
      else setFiatSwitchNotice(notice);
      setIsStakeModalOpen(false);
      clearStakeConflict();
      return true;
    } catch (err) {
      setBannerError(parseMessageFromError(err));
      return false;
    } finally {
      paymentMethodChangeInFlight.current = false;
      setIsRevertingTokenPayment(false);
    }
  };

  const hasAlternativeAccommodationPayment =
    paymentChoice !== 'fiat' || tokensOwed > 0;

  if (!showTokenCreditPaymentOptions) {
    return null;
  }

  const showPaymentRow =
    !hasAlternativeAccommodationPayment ||
    stayUsesTokens ||
    needsTokenStakeCompletion;

  return (
    <fieldset
      disabled={disabled || isRevertingTokenPayment}
      className="min-w-0 space-y-3"
    >
      <legend className="sr-only">
        {t('stay_payment_page_tokens_credits_title')}
      </legend>
      {fiatSwitchNotice && (
        <div role="status">
          <Information className="mb-4">{fiatSwitchNotice}</Information>
        </div>
      )}
      {tokenStakeSuccessNotice && (
        <Information className="mb-4">{tokenStakeSuccessNotice}</Information>
      )}
      {!isStakeModalOpen && skippedStakeNightsNotice && (
        <Information className="mb-4">{skippedStakeNightsNotice}</Information>
      )}
      {showPaymentRow && (
        <div className="space-y-3">
          {!hasAlternativeAccommodationPayment ? (
            <div className="divide-y divide-foreground/10 rounded-xl border border-foreground/10 px-4">
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1 basis-32">
                  <p className="text-sm font-medium text-foreground">
                    {t('stay_payment_credits_option')}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {applyCreditsDisabledExplanation ||
                      t('stay_payment_credits_available', {
                        amount: formatModalTwoDecimals(creditsBalance || 0),
                      })}
                  </p>
                </div>
                <Button
                  type="button"
                  dataTestid="stay-select-credits"
                  onClick={openCreditsConfirmationModal}
                  variant="secondary"
                  size="small"
                  isFullWidth={false}
                  isEnabled={isApplyCreditsEnabled}
                  isLoading={isApplyingCredits}
                  className={compactPaymentButtonClass}
                >
                  {t('stay_payment_use_credits')}
                </Button>
              </div>
              {isWeb3Enabled && tokenAccommodationVal > 0 && (
                <div className="space-y-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 basis-32">
                      <p className="text-sm font-medium text-foreground">
                        {t('stay_payment_tokens_option', {
                          currency: tokenCurrency,
                        })}
                      </p>
                      <p
                        className="mt-0.5 text-xs text-muted-foreground"
                        role={
                          profileBalance.error
                            ? 'alert'
                            : profileBalance.isLoading
                              ? 'status'
                              : undefined
                        }
                      >
                        {isSameDayTokenBooking
                          ? t('stay_create_same_day_tokens_not_supported')
                          : profileBalance.isLoading
                            ? t('stay_payment_profile_tokens_loading')
                            : profileBalance.error
                              ? t('stay_payment_profile_tokens_error')
                              : profileBalance.balanceWei != null
                                ? t('stay_payment_tokens_available', {
                                    amount: formatTokenAmount(
                                      ethersUtils.formatUnits(
                                        profileBalance.balanceWei,
                                        BLOCKCHAIN_DAO_TOKEN?.decimals || 18,
                                      ),
                                    ),
                                    currency: tokenCurrency,
                                  })
                                : t('stay_payment_wallet_setup_hint')}
                      </p>
                    </div>
                    {profileBalance.error ? (
                      <Button
                        type="button"
                        dataTestid="stay-retry-token-balance"
                        variant="secondary"
                        size="small"
                        isFullWidth={false}
                        className={compactPaymentButtonClass}
                        onClick={() =>
                          void profileBalance.retry().catch(() => undefined)
                        }
                      >
                        {t('wallet_retry_balances')}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        dataTestid="stay-select-tokens"
                        variant="secondary"
                        onClick={() => {
                          if (!profileBalance.walletAddress)
                            setIsWalletSetupOpen(true);
                          else void handleApplyTokens();
                        }}
                        size="small"
                        isFullWidth={false}
                        isEnabled={
                          canChangePaymentMethod &&
                          (!profileBalance.walletAddress || hasProfileTokens) &&
                          !profileBalance.isLoading &&
                          !isSameDayTokenBooking &&
                          !isCreditsModalOpen &&
                          !isPreparingTokenStake &&
                          !isStaking &&
                          !isVerifyingStake
                        }
                        isLoading={
                          isPreparingTokenStake || isStaking || isVerifyingStake
                        }
                        className={compactPaymentButtonClass}
                      >
                        {t('stay_payment_use_tokens', {
                          currency: tokenCurrency,
                        })}
                      </Button>
                    )}
                  </div>
                  {isWalletSetupOpen &&
                    !profileBalance.walletAddress &&
                    stakeWalletActions}
                </div>
              )}
            </div>
          ) : (
            needsTokenStakeCompletion && (
              <div className="space-y-3 rounded-xl border border-foreground/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {t('stay_payment_stake_remaining', {
                      amount: formatTokenAmount(tokensOwed),
                      currency: tokenCurrency,
                    })}
                  </p>
                  {(canUseWalletTokens || pendingVerification) && (
                    <Button
                      type="button"
                      onClick={handleResumeTokenStake}
                      size="small"
                      isFullWidth={false}
                      isEnabled={
                        (!isSameDayTokenBooking || !!pendingVerification) &&
                        !isStaking &&
                        !isVerifyingStake
                      }
                      isLoading={isStaking || isVerifyingStake}
                      className={compactPaymentButtonClass}
                    >
                      {pendingVerification
                        ? t('stay_create_token_stake_retry_verification')
                        : t('stay_create_complete_token_stake_button')}
                    </Button>
                  )}
                </div>
                {isSameDayTokenBooking && !pendingVerification && (
                  <p className="text-xs text-muted-foreground">
                    {t('stay_create_same_day_tokens_not_supported')}
                  </p>
                )}
                {!canUseWalletTokens &&
                  !pendingVerification &&
                  stakeWalletActions}
              </div>
            )
          )}
          {canSwitchToFiat && !isStakePending && (
            <button
              type="button"
              onClick={() => void handleCancelTokenPayment()}
              disabled={
                !isSwitchToFiatEnabled || isStakeModalOpen || isCreditsModalOpen
              }
              className="text-xs text-accent underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRevertingTokenPayment
                ? t('stay_create_cancel_token_payment_loading')
                : t('stay_create_cancel_token_payment_link', {
                    currency: fiatCurrency,
                  })}
            </button>
          )}
          {(isStakePending ||
            hasUnverifiedStake ||
            hasRecordedStake ||
            (!canChangePaymentMethod && !canSwitchToFiat)) && (
            <p className="text-xs text-muted-foreground">
              {paymentMethodLockedReason}
            </p>
          )}
        </div>
      )}

      {isCreditsModalOpen && showTokenCreditPaymentOptions && (
        <Modal
          closeModal={closeCreditsModal}
          className="sm:max-w-xl md:w-[560px]"
        >
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
              stay={stay}
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
        <Modal
          closeModal={closeStakeModal}
          className="sm:max-w-xl md:w-[560px]"
        >
          <div className="flex flex-col gap-4">
            <Heading level={2} className="text-xl pr-10">
              {t('stay_create_stake_modal_title')}
            </Heading>
            {pendingVerification && (
              <p className="text-sm text-gray-700">
                {t('stay_create_token_stake_recovery_description')}
              </p>
            )}
            {!pendingVerification && (
              <p className="text-sm font-semibold text-system-error">
                {t('stay_create_stake_modal_warning')}
              </p>
            )}
            {stakePlan && (
              <StayTokenStakeAmountSummary
                priceLock={stay.priceLock}
                stakePlan={stakePlan}
                tokensOwed={tokensOwed}
              />
            )}
            <StayQuoteFiatDiscountPreview
              stay={stay}
              appliedTokens={stakePlan?.tokenAmount}
            />
            {pendingVerification ? null : canUseWalletTokens ? (
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
                  : {formatTokenAmount(Number(tokenBalanceAvailable || 0))}
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
            ) : (
              stakeWalletActions
            )}
            {!pendingVerification && isLowCeloForStake && (
              <p className="text-sm text-system-error">
                {t('insufficient_celo_for_gas')}
              </p>
            )}
            {skippedStakeNightsNotice && (
              <Information>{skippedStakeNightsNotice}</Information>
            )}
            {isVerifyingStake ? (
              <div role="status" className="text-sm text-gray-700">
                {t('stay_create_token_stake_verifying')}
              </div>
            ) : (
              !pendingVerification && (
                <StayTokenStakeBatchProgress {...stakingProgress} />
              )
            )}
            {hasStakeConflict ? (
              <StayTokenStakeConflictNotice
                stay={stay}
                onPayInFiat={
                  isSwitchToFiatEnabled || isRevertingTokenPayment
                    ? () => void handleCancelTokenPayment()
                    : undefined
                }
                isSwitchingToFiat={isRevertingTokenPayment}
              />
            ) : (
              stakeModalError && (
                <div role="alert" aria-live="assertive">
                  <ErrorMessage error={stakeModalError} />
                  <StakeErrorDetails detail={stakeDetails} />
                </div>
              )
            )}
            {!pendingVerification && canUseWalletTokens && (
              <p className="text-sm text-gray-700">
                {t('stay_create_stake_modal_description')}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={closeStakeModal}
                isEnabled={!isStakePending && !isRevertingTokenPayment}
                className={`${compactPaymentButtonClass} min-h-[40px]`}
              >
                {t('stay_create_token_stake_close')}
              </Button>
              <Button
                size="small"
                isFullWidth={false}
                dataTestid="stay-confirm-token-stake"
                onClick={() =>
                  void (pendingVerification
                    ? handleRetryStakeVerification()
                    : handleStakeTokens())
                }
                isEnabled={
                  !hasStakeConflict &&
                  (!!pendingVerification ||
                    (canUseWalletTokens && !isLowCeloForStake)) &&
                  !isStakePending &&
                  !isRevertingTokenPayment
                }
                isLoading={isStaking || isVerifyingStake}
                className={`${compactPaymentButtonClass} min-h-[40px]`}
              >
                {pendingVerification
                  ? t('stay_create_token_stake_retry_verification')
                  : stakeModalError && stakingProgress.completedNights > 0
                    ? t('stay_create_stake_batch_resume')
                    : t('stay_create_stake_modal_confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </fieldset>
  );
}
