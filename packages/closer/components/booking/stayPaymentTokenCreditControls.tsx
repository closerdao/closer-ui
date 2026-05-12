import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { utils } from 'ethers';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { MIN_CELO_FOR_GAS } from '../../constants';
import Modal from '../Modal';
import { StayQuoteFiatDiscountPreview } from './stayQuoteFiatDiscountPreview';
import { ErrorMessage, Information } from '../ui';
import Button from '../ui/Button';
import Heading from '../ui/Heading';

import { WalletDispatch, WalletState } from '../../contexts/wallet';
import { useBookingSmartContract } from '../../hooks/useBookingSmartContract';
import { useConfig } from '../../hooks/useConfig';
import type { Stay, StayTokenStakePlan } from '../../types/stay';
import { parseMessageFromError } from '../../utils/common';
import { formatStakeBookingErrorForUi } from '../../utils/stakeBookingError.helpers';
import {
  buildStayTokenStakePlan,
  canApplyTokenOrCreditsToStay,
  canChangeStayPaymentMethod,
  computeTokensOwed,
  getStay,
  getStayAccommodationTokenTotal,
  inferPaymentChoiceFromStay,
  isStayAwaitingHostApproval,
  isStayCheckoutDraft,
  setStayPaymentMethod,
  stakeStayTokens,
  submitStay,
} from '../../utils/stays.api';
import {
  clearPendingStayTokenStake,
  readPendingStayTokenStake,
  writePendingStayTokenStake,
} from '../../utils/stayTokenStakePendingStorage';

const formatModalTwoDecimals = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : '0.00';

const compactPaymentButtonClass =
  '!normal-case tracking-normal min-h-[36px] text-sm';

export type StayPaymentTokenCreditControlsProps = {
  stay: Stay;
  creditsBalance: number;
  onStaySynced: () => Promise<unknown>;
  setBannerError: (message: string | null) => void;
};

export function StayPaymentTokenCreditControls({
  stay,
  creditsBalance,
  onStaySynced,
  setBannerError,
}: StayPaymentTokenCreditControlsProps) {
  const t = useTranslations();
  const {
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_EXPLORER_URL,
  } = useConfig() || {};
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
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [creditsModalError, setCreditsModalError] = useState<string | null>(
    null,
  );
  const [isApplyingCredits, setIsApplyingCredits] = useState(false);

  const pendingTokenPaymentPayloadRef = useRef<
    | { method: 'full-tokens' }
    | { method: 'partial-tokens'; appliedTokens: number }
    | null
  >(null);

  const showTokenCreditPaymentOptions = canApplyTokenOrCreditsToStay(stay);
  const tokenAccommodationVal = getStayAccommodationTokenTotal(stay);
  const tokensOwed = computeTokensOwed(stay);
  const paymentChoice = useMemo(
    () => inferPaymentChoiceFromStay(stay, tokenAccommodationVal),
    [stay, tokenAccommodationVal],
  );
  const canChangePaymentMethod = canChangeStayPaymentMethod(stay);
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
  const isSameDayTokenBooking = dayjs(stay.start).isSame(dayjs(), 'day');
  const creditsAmountToApply = Math.max(
    0,
    Math.min(creditsBalance || 0, tokenAccommodationVal),
  );
  const isApplyCreditsEnabled =
    canChangePaymentMethod &&
    creditsAmountToApply > 0 &&
    !isApplyingCredits &&
    !isStakeModalOpen;
  const isFullCreditsForAccommodation =
    creditsAmountToApply >= tokenAccommodationVal && tokenAccommodationVal > 0;

  const applyCreditsDisabledExplanation = useMemo(() => {
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
    return undefined;
  }, [
    isApplyCreditsEnabled,
    isApplyingCredits,
    canChangePaymentMethod,
    tokenAccommodationVal,
    creditsBalance,
    isStakeModalOpen,
    t,
  ]);

  const { stakeTokens, isStaking } = useBookingSmartContract({
    bookingNights: stakePlan?.bookingNights || [],
  });

  useEffect(() => {
    if (!isStayAwaitingHostApproval(stay) && !isStayCheckoutDraft(stay)) {
      return;
    }
    setIsCreditsModalOpen(false);
    setIsStakeModalOpen(false);
    setStakeModalError(null);
    setStakePlan(null);
    pendingTokenPaymentPayloadRef.current = null;
  }, [stay.status]);

  useEffect(() => {
    if (!isStakeModalOpen || !library || !account) return;
    let cancelled = false;
    void (async () => {
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
    if (!canChangePaymentMethod) return;
    if (isSameDayTokenBooking) return;
    if (!isWalletConnected || tokenAmountToApply <= 0) return;
    if (isCreditsModalOpen) return;
    setBannerError(null);

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

    const plan = buildStayTokenStakePlan(stay, intentTokens);
    if (!plan) {
      setBannerError(t('stay_create_token_stake_plan_error'));
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
    setBannerError(null);
    pendingTokenPaymentPayloadRef.current = null;
    const nextStakePlan = buildStakePlan(stay);
    if (!nextStakePlan) {
      setBannerError(t('stay_create_token_stake_plan_error'));
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
    setBannerError(null);
    let stayForStake = stay;
    let planForRecovery: StayTokenStakePlan | null = null;
    try {
      const pendingPayload = pendingTokenPaymentPayloadRef.current;
      if (pendingPayload) {
        let editableStay = stay;
        if (editableStay.status === 'draft') {
          editableStay = await submitStay(editableStay._id);
          await onStaySynced();
          stayForStake = (await getStay(editableStay._id)) ?? editableStay;
        } else {
          stayForStake = editableStay;
        }
        const updated = await setStayPaymentMethod(
          editableStay._id,
          pendingPayload,
        );
        pendingTokenPaymentPayloadRef.current = null;
        await onStaySynced();
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
            await onStaySynced();
            setTokenStakeSuccessNotice(t('stay_create_token_stake_success'));
            setIsStakeModalOpen(false);
            setStakePlan(null);
            setStakeModalError(null);
            return;
          } catch (recoverErr) {
            try {
              const fresh = await getStay(stayForStake._id);
              await onStaySynced();
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
        await onStaySynced();
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
          await stakeStayTokens(stayForStake._id, '', {
            syncBookingAlreadyOnChain: true,
          });
          clearPendingStayTokenStake(stayForStake._id);
          await onStaySynced();
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
      await onStaySynced();
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
            await onStaySynced();
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
          await onStaySynced();
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
    if (!canChangePaymentMethod || creditsAmountToApply <= 0) return;
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
    if (!canChangePaymentMethod || creditsAmountToApply <= 0) return;
    setCreditsModalError(null);
    setBannerError(null);
    setIsApplyingCredits(true);
    try {
      let editableStay = stay;
      if (editableStay.status === 'draft') {
        editableStay = await submitStay(editableStay._id);
        await onStaySynced();
        const refetched = await getStay(editableStay._id);
        if (refetched) editableStay = refetched;
      }
      const payload =
        creditsAmountToApply >= tokenAccommodationVal
          ? { method: 'full-credits' as const }
          : {
              method: 'partial-credits' as const,
              appliedCredits: creditsAmountToApply,
            };
      await setStayPaymentMethod(editableStay._id, payload);
      await onStaySynced();
      setIsCreditsModalOpen(false);
    } catch (err) {
      setCreditsModalError(parseMessageFromError(err));
    } finally {
      setIsApplyingCredits(false);
    }
  };

  const hasAlternativeAccommodationPayment = paymentChoice !== 'fiat';

  if (!showTokenCreditPaymentOptions) {
    return null;
  }

  const showPaymentRow =
    !hasAlternativeAccommodationPayment || needsTokenStakeCompletion;

  return (
    <>
      {tokenStakeSuccessNotice && (
        <Information className="mb-4">{tokenStakeSuccessNotice}</Information>
      )}
      {showPaymentRow && (
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
                        !isCreditsModalOpen &&
                        !isStaking &&
                        !isVerifyingStake
                      }
                      isLoading={isStaking || isVerifyingStake}
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
      )}

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
              stay={stay}
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
                onClick={() => void handleStakeTokens()}
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
    </>
  );
}
