import { useContext, useState } from 'react';

import { useTranslations } from 'next-intl';

import { WalletDispatch, WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import type { CreditTokenPaymentQuote } from '../../types/api';
import {
  getBlockchainNetworkName,
  getStablecoinSymbol,
} from '../../utils/blockchainNetwork';
import { parseMessageFromError } from '../../utils/common';
import {
  confirmCreditsTokenPayment,
  isCreditsTokenPaymentNotIndexedError,
  quoteCreditsTokenPayment,
} from '../../utils/credits.api';
import {
  clearPendingCreditsCryptoPayment,
  readPendingCreditsCryptoPayment,
  writePendingCreditsCryptoPayment,
} from '../../utils/creditsCryptoPaymentPendingStorage';
import {
  resolveDonationStablecoinAddress,
  transferDonationStablecoin,
} from '../../utils/donationStablecoinTransfer';
import { Button, ErrorMessage, Information } from '../ui';

const VERIFY_ATTEMPTS = 5;
const VERIFY_RETRY_DELAY_MS = 5000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Props {
  /** Credits to buy — the API prices them, this is not a fiat amount. */
  credits: number;
  /** Local price, shown until the API's own quote replaces it. */
  total: number;
  isEnabled?: boolean;
  onSuccess: () => void;
  className?: string;
}

/**
 * The stablecoin rail for buying credits, laid out like the event-ticket and
 * stay ones: a line saying what will be sent where, and a single button that
 * connects the wallet, switches the network, or pays, depending on what is
 * still missing.
 *
 * Underneath it is the same quote-then-confirm handshake as
 * `POST /stays/:id/token-payment`: the API prices the purchase and names the
 * treasury, the wallet sends the transfer, the API credits the balance once it
 * can see the transaction on chain.
 */
const CreditsCryptoPayment = ({
  credits,
  total,
  isEnabled = true,
  onSuccess,
  className,
}: Props) => {
  const t = useTranslations();
  const config = useConfig();
  // Rendered inside the page's wallet provider, but the checkout is reachable
  // on builds without one — the rail simply stays unavailable there.
  const { library, isWalletConnected, isCorrectNetwork, account } =
    useContext(WalletState) || {};
  const { connectWallet, switchNetwork, updateWalletBalance } =
    useContext(WalletDispatch) || {};

  const chain = getBlockchainNetworkName(config as any);

  const [quote, setQuote] = useState<CreditTokenPaymentQuote | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(() =>
    readPendingCreditsCryptoPayment(credits),
  );
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const stablecoin = quote?.stablecoinSymbol || getStablecoinSymbol(config as any);
  const amountToSend = quote?.fiatAmount ?? total;

  const reportError = (err: unknown) => {
    const message = parseMessageFromError(err);
    setError(
      isCreditsTokenPaymentNotIndexedError(message)
        ? t('credits_crypto_verification_delayed')
        : message,
    );
  };

  /** Confirm a tx hash, retrying while the explorer has not indexed it. */
  const verifyTransfer = async (txHash: string) => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < VERIFY_ATTEMPTS; attempt++) {
      if (attempt > 0) await wait(VERIFY_RETRY_DELAY_MS);
      try {
        return await confirmCreditsTokenPayment(credits, txHash);
      } catch (err) {
        lastError = err;
        if (!isCreditsTokenPaymentNotIndexedError(parseMessageFromError(err))) {
          throw err;
        }
      }
    }
    throw lastError;
  };

  const finish = () => {
    clearPendingCreditsCryptoPayment(credits);
    setPendingTxHash(null);
    onSuccess();
  };

  const handleVerifyPending = async () => {
    if (!pendingTxHash) return;
    setError(null);
    setIsVerifying(true);
    setHint(t('credits_crypto_verifying'));
    try {
      await verifyTransfer(pendingTxHash);
      finish();
    } catch (err) {
      reportError(err);
    } finally {
      setIsVerifying(false);
      setHint(null);
    }
  };

  const handlePay = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      if (!isWalletConnected) {
        await connectWallet?.();
        return;
      }
      if (!isCorrectNetwork) {
        await switchNetwork?.();
        return;
      }

      const nextQuote = quote ?? (await quoteCreditsTokenPayment(credits));
      setQuote(nextQuote);

      const tokenAddress =
        nextQuote.stablecoinAddresses?.find(Boolean) ||
        resolveDonationStablecoinAddress(nextQuote.stablecoinSymbol, config);
      if (!tokenAddress || !nextQuote.treasuryAddress || !library) {
        throw new Error(t('credits_crypto_unavailable'));
      }

      const { txHash } = await transferDonationStablecoin({
        library,
        tokenAddress,
        to: nextQuote.treasuryAddress,
        humanAmount: nextQuote.fiatAmount,
      });
      // Remembered before verification so a reload mid-confirmation offers to
      // finish rather than asking for a second transfer.
      writePendingCreditsCryptoPayment(credits, txHash);
      setPendingTxHash(txHash);
      if (typeof updateWalletBalance === 'function') {
        updateWalletBalance();
      }

      setIsVerifying(true);
      setHint(t('credits_crypto_verifying'));
      await verifyTransfer(txHash);
      finish();
    } catch (err) {
      reportError(err);
    } finally {
      setIsProcessing(false);
      setIsVerifying(false);
      setHint(null);
    }
  };

  const isBusy = isProcessing || isVerifying;

  return (
    <div className={className}>
      <p className="text-sm text-gray-600 mb-4">
        {t('credits_crypto_description', {
          amount: amountToSend.toFixed(2),
          stablecoin,
          chain,
        })}
      </p>

      {pendingTxHash && (
        <Information className="mb-4 text-sm">
          {t('credits_crypto_pending_found')}
        </Information>
      )}

      {pendingTxHash ? (
        <Button
          onClick={() => void handleVerifyPending()}
          isEnabled={isEnabled && !isBusy}
          isLoading={isVerifying}
        >
          {t('credits_crypto_retry_verification')}
        </Button>
      ) : (
        <Button
          onClick={() => void handlePay()}
          isEnabled={isEnabled && !isBusy}
          isLoading={isBusy}
        >
          {!isWalletConnected
            ? t('event_ticket_connect_wallet')
            : !isCorrectNetwork
            ? t('event_ticket_switch_network', { chain })
            : t('event_ticket_pay_now')}
        </Button>
      )}

      {account && (
        <p className="text-xs text-gray-400 mt-2 break-all">{account}</p>
      )}

      {hint && !error && (
        <p className="text-sm text-gray-600 mt-3" role="status">
          {hint}
        </p>
      )}
      {error && (
        <div role="alert" aria-live="assertive" className="mt-4">
          <ErrorMessage error={error} />
        </div>
      )}
    </div>
  );
};

export default CreditsCryptoPayment;
