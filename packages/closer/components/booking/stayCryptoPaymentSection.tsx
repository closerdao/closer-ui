import { useRouter } from 'next/router';

import { useContext, useState } from 'react';

import { CreditCard, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { WalletDispatch, WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import type { Stay, StayTokenPaymentQuote } from '../../types/stay';
import { parseMessageFromError } from '../../utils/common';
import {
  resolveDonationStablecoinAddress,
  transferDonationStablecoin,
} from '../../utils/donationStablecoinTransfer';
import {
  clearPendingStayCryptoPayment,
  readPendingStayCryptoPayment,
  writePendingStayCryptoPayment,
} from '../../utils/stayCryptoPaymentPendingStorage';
import {
  confirmStayTokenPayment,
  isStayCheckoutDraft,
  isStayPaid,
  isStayAwaitingHostApproval,
  isStayTokenPaymentNotIndexedError,
  quoteStayTokenPayment,
  submitStay,
} from '../../utils/stays.api';
import Modal from '../Modal';
import { ErrorMessage, Information } from '../ui';
import Button from '../ui/Button';
import Heading from '../ui/Heading';

const VERIFY_ATTEMPTS = 5;
const VERIFY_RETRY_DELAY_MS = 5000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatStablecoinAmount = (quote: StayTokenPaymentQuote) =>
  `${quote.fiatAmount.toFixed(2)} ${quote.stablecoinSymbol}`;

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return;
  }
}

export type StayPaymentMethodTab = 'card' | 'crypto';

/** Segmented card/crypto switcher shared by the checkout and payment pages. */
export function StayPaymentMethodTabs({
  active,
  onChange,
  className,
}: {
  active: StayPaymentMethodTab;
  onChange: (tab: StayPaymentMethodTab) => void;
  className?: string;
}) {
  const t = useTranslations();
  const tabs: {
    id: StayPaymentMethodTab;
    label: string;
    Icon: typeof CreditCard;
  }[] = [
    { id: 'card', label: t('stay_payment_tab_card'), Icon: CreditCard },
    { id: 'crypto', label: t('stay_payment_tab_crypto'), Icon: Wallet },
  ];
  return (
    <div
      role="tablist"
      aria-label={t('stay_create_card_title')}
      className={`flex rounded-xl bg-gray-100 p-1 ${className || ''}`}
    >
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          onClick={() => onChange(id)}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[40px] ${
            active === id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

export type StayCryptoPaymentSectionProps = {
  stay: Stay;
  /** Called with every fresh Stay the flow produces (submit, confirm). */
  onStayUpdated: (stay: Stay) => void;
  /** Gate from the surrounding form (terms accepted, ticket picked, …). */
  isEnabled?: boolean;
  /** 'primary' when the section is the tab's main CTA. */
  buttonVariant?: 'primary' | 'secondary';
  className?: string;
};

/**
 * "Pay with crypto" — settles the fiat leg of a stay in stablecoin (CEUR on
 * Celo) through POST /stays/:id/token-payment instead of the Stripe pair.
 * Credits and token-stake legs are unaffected.
 */
export function StayCryptoPaymentSection({
  stay,
  onStayUpdated,
  isEnabled = true,
  buttonVariant = 'secondary',
  className,
}: StayCryptoPaymentSectionProps) {
  const t = useTranslations();
  const router = useRouter();
  const config = useConfig();
  const { library, account, isWalletConnected, isCorrectNetwork } =
    useContext(WalletState);
  const { connectWallet, switchNetwork, updateWalletBalance } =
    useContext(WalletDispatch);

  const [isPreparing, setIsPreparing] = useState(false);
  const [quote, setQuote] = useState<StayTokenPaymentQuote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const isWeb3BookingEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';
  if (!isWeb3BookingEnabled) return null;

  const tokenAddress =
    quote?.stablecoinAddresses?.find(Boolean) ||
    (quote
      ? resolveDonationStablecoinAddress(quote.stablecoinSymbol, config)
      : null);

  const canPayWithWallet =
    Boolean(quote) &&
    Boolean(tokenAddress) &&
    Boolean(library) &&
    Boolean(account) &&
    isWalletConnected &&
    isCorrectNetwork;

  const closeModal = () => {
    if (isPaying || isVerifying) return;
    setIsModalOpen(false);
    setModalError(null);
  };

  const finishWithBooking = (booking: Stay) => {
    clearPendingStayCryptoPayment(stay._id);
    setPendingTxHash(null);
    setIsModalOpen(false);
    setModalError(null);
    onStayUpdated(booking);
    if (isStayPaid(booking)) {
      router.replace(`/stay/${booking._id}/confirmation`);
      return;
    }
    setSuccessNotice(t('stay_crypto_success'));
  };

  /** Confirm a tx hash, retrying while the explorer has not indexed it. */
  const verifyTransfer = async (stayId: string, txHash: string) => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < VERIFY_ATTEMPTS; attempt++) {
      if (attempt > 0) await wait(VERIFY_RETRY_DELAY_MS);
      try {
        return await confirmStayTokenPayment(stayId, txHash);
      } catch (err) {
        lastError = err;
        if (!isStayTokenPaymentNotIndexedError(parseMessageFromError(err))) {
          throw err;
        }
      }
    }
    throw lastError;
  };

  const handleVerifyPending = async () => {
    if (!pendingTxHash) return;
    setModalError(null);
    setIsVerifying(true);
    try {
      const result = await verifyTransfer(stay._id, pendingTxHash);
      finishWithBooking(result.booking);
    } catch (err) {
      const message = parseMessageFromError(err);
      setModalError(
        isStayTokenPaymentNotIndexedError(message)
          ? t('stay_crypto_verification_delayed')
          : message,
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpen = async () => {
    setSectionError(null);
    setSuccessNotice(null);
    setIsPreparing(true);
    let isLeavingPage = false;
    try {
      let workingStay = stay;
      if (isStayCheckoutDraft(workingStay)) {
        workingStay = await submitStay(workingStay._id);
        onStayUpdated(workingStay);
        if (isStayAwaitingHostApproval(workingStay)) {
          isLeavingPage = true;
          router.replace(`/stay/${workingStay._id}/pending`);
          return;
        }
      }

      const nextQuote = await quoteStayTokenPayment(workingStay._id);
      if (!Number.isFinite(nextQuote.fiatAmount) || nextQuote.fiatAmount <= 0) {
        setSectionError(t('stay_crypto_nothing_owed'));
        return;
      }
      setQuote(nextQuote);
      setPendingTxHash(readPendingStayCryptoPayment(workingStay._id));
      setModalError(null);
      setIsModalOpen(true);
    } catch (err) {
      setSectionError(parseMessageFromError(err));
    } finally {
      if (!isLeavingPage) setIsPreparing(false);
    }
  };

  const handleWalletCta = async () => {
    setModalError(null);
    try {
      if (!isWalletConnected) {
        await connectWallet?.();
        return;
      }
      if (!isCorrectNetwork) {
        await switchNetwork?.();
      }
    } catch (err) {
      setModalError(parseMessageFromError(err));
    }
  };

  const handlePayWithWallet = async () => {
    if (!quote || !tokenAddress || !library) return;
    setModalError(null);
    setIsPaying(true);
    try {
      const { txHash } = await transferDonationStablecoin({
        library,
        tokenAddress,
        to: quote.treasuryAddress,
        humanAmount: quote.fiatAmount,
      });
      writePendingStayCryptoPayment(stay._id, txHash);
      setPendingTxHash(txHash);
      if (typeof updateWalletBalance === 'function') {
        updateWalletBalance();
      }
      setIsVerifying(true);
      const result = await verifyTransfer(stay._id, txHash);
      finishWithBooking(result.booking);
    } catch (err) {
      const message = parseMessageFromError(err);
      setModalError(
        isStayTokenPaymentNotIndexedError(message)
          ? t('stay_crypto_verification_delayed')
          : message,
      );
    } finally {
      setIsPaying(false);
      setIsVerifying(false);
    }
  };

  return (
    <div className={className}>
      {successNotice && (
        <Information className="mb-3">{successNotice}</Information>
      )}
      <Button
        variant={buttonVariant}
        onClick={() => void handleOpen()}
        isEnabled={isEnabled && !isPreparing}
        isLoading={isPreparing}
        className="min-h-[48px]"
      >
        {t('stay_crypto_pay_button')}
      </Button>
      {sectionError && (
        <div role="alert" aria-live="assertive" className="mt-3">
          <ErrorMessage error={sectionError} />
        </div>
      )}

      {isModalOpen && quote && (
        <Modal closeModal={closeModal} className="sm:max-w-xl md:w-[560px]">
          <div className="flex flex-col gap-4">
            <Heading level={2} className="text-xl pr-10">
              {t('stay_crypto_modal_title')}
            </Heading>
            <p className="text-sm text-gray-700">
              {t('stay_crypto_modal_description', {
                token: quote.stablecoinSymbol,
              })}
            </p>
            <p className="text-sm text-gray-700">
              {t('stay_crypto_send_exact', {
                amount: formatStablecoinAmount(quote),
                token: quote.stablecoinSymbol,
              })}
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('donate_crypto_recipient')}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                <span className="text-sm font-mono text-gray-900 break-all">
                  {quote.treasuryAddress}
                </span>
                <button
                  type="button"
                  onClick={() => void copyToClipboard(quote.treasuryAddress)}
                  className="text-xs text-accent font-medium shrink-0"
                >
                  {t('donate_copy')}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              {t('stay_crypto_remaining_note')}
            </p>

            {pendingTxHash && (
              <Information className="text-sm">
                {t('stay_crypto_pending_found')}
              </Information>
            )}

            {modalError && (
              <div role="alert" aria-live="assertive">
                <ErrorMessage error={modalError} />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={closeModal}
                isEnabled={!isPaying && !isVerifying}
                className="!normal-case tracking-normal min-h-[40px] text-sm"
              >
                {t('buttons_cancel')}
              </Button>
              {pendingTxHash ? (
                <Button
                  size="small"
                  isFullWidth={false}
                  onClick={() => void handleVerifyPending()}
                  isEnabled={!isPaying && !isVerifying}
                  isLoading={isVerifying}
                  className="!normal-case tracking-normal min-h-[40px] text-sm"
                >
                  {isVerifying
                    ? t('stay_crypto_verifying')
                    : t('stay_crypto_retry_verification')}
                </Button>
              ) : !canPayWithWallet ? (
                <Button
                  size="small"
                  isFullWidth={false}
                  onClick={() => void handleWalletCta()}
                  className="!normal-case tracking-normal min-h-[40px] text-sm"
                >
                  {!isWalletConnected
                    ? t('donate_crypto_connect_wallet')
                    : !isCorrectNetwork
                    ? t('donate_crypto_switch_network')
                    : t('donate_crypto_prepare_wallet')}
                </Button>
              ) : (
                <Button
                  size="small"
                  isFullWidth={false}
                  onClick={() => void handlePayWithWallet()}
                  isEnabled={!isPaying && !isVerifying}
                  isLoading={isPaying || isVerifying}
                  className="!normal-case tracking-normal min-h-[40px] text-sm"
                >
                  {isVerifying
                    ? t('stay_crypto_verifying')
                    : isPaying
                    ? t('checkout_processing_payment')
                    : t('donate_crypto_pay_wallet')}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
