import { useContext, useEffect, useRef, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

import { useTranslations } from 'next-intl';

import { WalletDispatch, WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import { CloserCurrencies } from '../../types';
import type { TicketInitResult, TicketQuote } from '../../types/ticket';
import {
  getBlockchainNetworkName,
  getStablecoinSymbol,
} from '../../utils/blockchainNetwork';
import { parseMessageFromError } from '../../utils/common';
import {
  resolveDonationStablecoinAddress,
  transferDonationStablecoin,
} from '../../utils/donationStablecoinTransfer';
import { priceFormat } from '../../utils/helpers';
import {
  confirmTicketCard,
  confirmTicketCrypto,
  initTicket,
  releaseTicketSeat,
} from '../../utils/tickets.api';
import {
  PaymentMethodTabs,
  type PaymentMethodTab,
} from '../PaymentMethodTabs';
import WalletPayButton, { WalletPayComplete } from '../WalletPayButton';
import { Button, ErrorMessage } from '../ui';

interface Props {
  eventId: string;
  ticketOptionName: string;
  quantity: number;
  discountCode: string;
  quote: TicketQuote | null;
  userEmail?: string;
  userName?: string;
  onPaid: (ticketId: string) => void;
  onBack: () => void;
}

const cardStyle = {
  style: {
    base: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: 'black',
      fontFamily: 'Barlow, sans-serif',
      '::placeholder': { color: '#8f8f8f' },
    },
    invalid: { color: '#9f1f42' },
  },
};

/**
 * Step two: pay for the ticket the guest picked.
 *
 * `POST /tickets/init` both creates the ticket and holds its seat, so the seat
 * is given back whenever the guest leaves without paying — going back a step,
 * or switching rails, which needs a ticket of the other kind.
 */
const TicketPaymentStep = ({
  eventId,
  ticketOptionName,
  quantity,
  discountCode,
  quote,
  userEmail,
  userName,
  onPaid,
  onBack,
}: Props) => {
  const t = useTranslations();
  const stripe = useStripe();
  const elements = useElements();
  const config = useConfig();
  // The modal renders wherever an event page does, which is not always inside
  // a wallet provider — the crypto rail simply stays unavailable there.
  const { library, account, isWalletConnected, isCorrectNetwork } =
    useContext(WalletState) || {};
  const { connectWallet, switchNetwork } = useContext(WalletDispatch) || {};

  const [method, setMethod] = useState<PaymentMethodTab>('card');
  const [initResult, setInitResult] = useState<TicketInitResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  /** Read on unmount, where React would otherwise hand us the initial state. */
  const unsettledTicketRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (unsettledTicketRef.current) {
        releaseTicketSeat(unsettledTicketRef.current);
        unsettledTicketRef.current = null;
      }
    },
    [],
  );

  const total = quote?.total;
  const isFree = Boolean(total && total.val <= 0);
  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  // Names the chain this build actually settles on — 'Celo Sepolia' in dev.
  const chain = getBlockchainNetworkName(config as any);

  const startTicket = async (
    paymentMethod?: PaymentMethodTab,
  ): Promise<TicketInitResult> => {
    const result = await initTicket({
      eventId,
      ticketOption: ticketOptionName,
      quantity,
      ...(discountCode ? { discountCode } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(userEmail ? { email: userEmail } : {}),
      ...(userName ? { name: userName } : {}),
    });
    setInitResult(result);
    if (result.status !== 'approved') {
      unsettledTicketRef.current = result.ticketId;
    }
    return result;
  };

  /** A free ticket comes back already approved — there is nothing to confirm. */
  const handleFree = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      const result = await startTicket();
      unsettledTicketRef.current = null;
      onPaid(result.ticketId);
    } catch (err) {
      setError(parseMessageFromError(err));
      setIsProcessing(false);
    }
  };

  const handleCard = async () => {
    if (!stripe || !elements) return;
    setError(null);
    setHint(null);
    setIsProcessing(true);
    try {
      // Availability is re-checked at init, so a quote that looked fine can
      // still come back sold out here.
      const result = initResult?.clientSecret
        ? initResult
        : await startTicket('card');
      const cardElement = elements.getElement(CardElement);
      if (!cardElement || !result.clientSecret) {
        throw new Error(t('event_ticket_payment_failed'));
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(result.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: userEmail ? { email: userEmail } : undefined,
          },
        });

      if (stripeError) {
        setError(stripeError.message || t('event_ticket_payment_failed'));
        setIsProcessing(false);
        return;
      }

      const paymentIntentId = paymentIntent?.id || result.paymentIntentId;
      if (!paymentIntentId) {
        throw new Error(t('event_ticket_payment_failed'));
      }

      setHint(t('event_ticket_finalizing'));
      await confirmTicketCard(result.ticketId, paymentIntentId);
      unsettledTicketRef.current = null;
      onPaid(result.ticketId);
    } catch (err) {
      setError(parseMessageFromError(err));
      setIsProcessing(false);
    }
  };

  /**
   * Apple Pay buys the same ticket the card form buys: the seat is held by
   * `initTicket` first, then the wallet's payment method settles the intent.
   * The sheet must be down before a 3DS challenge appears, so the first
   * confirmation is told not to act on one.
   */
  const handleWalletPayment = async (
    paymentMethodId: string,
    complete: WalletPayComplete,
  ) => {
    if (!stripe) {
      complete('fail');
      return;
    }
    setError(null);
    setHint(null);
    setIsProcessing(true);
    try {
      const result = initResult?.clientSecret
        ? initResult
        : await startTicket('card');
      if (!result.clientSecret) {
        throw new Error(t('event_ticket_payment_failed'));
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(
          result.clientSecret,
          { payment_method: paymentMethodId },
          { handleActions: false },
        );

      if (stripeError) {
        complete('fail');
        setError(stripeError.message || t('event_ticket_payment_failed'));
        setIsProcessing(false);
        return;
      }

      complete('success');

      let confirmedIntent = paymentIntent;
      if (confirmedIntent?.status === 'requires_action') {
        const actionResult = await stripe.confirmCardPayment(
          result.clientSecret,
        );
        if (actionResult.error) {
          setError(
            actionResult.error.message || t('event_ticket_payment_failed'),
          );
          setIsProcessing(false);
          return;
        }
        confirmedIntent = actionResult.paymentIntent;
      }

      const paymentIntentId = confirmedIntent?.id || result.paymentIntentId;
      if (!paymentIntentId) {
        throw new Error(t('event_ticket_payment_failed'));
      }

      setHint(t('event_ticket_finalizing'));
      await confirmTicketCard(result.ticketId, paymentIntentId);
      unsettledTicketRef.current = null;
      onPaid(result.ticketId);
    } catch (err) {
      complete('fail');
      setError(parseMessageFromError(err));
      setIsProcessing(false);
    }
  };

  const handleCrypto = async () => {
    setError(null);
    setHint(null);
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

      const result = initResult?.treasuryAddress
        ? initResult
        : await startTicket('crypto');
      const tokenAddress = resolveDonationStablecoinAddress(
        result.stablecoin || '',
        config,
      );
      if (!tokenAddress || !result.treasuryAddress || !library) {
        throw new Error(t('event_ticket_crypto_unavailable'));
      }

      const { txHash } = await transferDonationStablecoin({
        library,
        tokenAddress,
        to: result.treasuryAddress,
        humanAmount: result.expectedAmount ?? total?.val ?? 0,
      });

      setHint(t('event_ticket_finalizing'));
      await confirmTicketCrypto(result.ticketId, txHash);
      unsettledTicketRef.current = null;
      onPaid(result.ticketId);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  /** Each rail needs its own ticket, so the abandoned one gives its seat back. */
  const switchMethod = (next: PaymentMethodTab) => {
    if (next === method) return;
    if (unsettledTicketRef.current) {
      releaseTicketSeat(unsettledTicketRef.current);
      unsettledTicketRef.current = null;
    }
    setInitResult(null);
    setError(null);
    setHint(null);
    setMethod(next);
  };

  return (
    <>
      <div className="rounded-md bg-accent-light p-4 mb-4 text-sm flex justify-between">
        <span>
          {ticketOptionName} × {quantity}
        </span>
        <strong>
          {total
            ? priceFormat(total.val, total.cur as CloserCurrencies)
            : priceFormat(0)}
        </strong>
      </div>

      {isFree ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {t('event_ticket_free_description')}
          </p>
          <Button
            onClick={handleFree}
            isEnabled={!isProcessing}
            isLoading={isProcessing}
          >
            {t('event_ticket_get_free_ticket')}
          </Button>
        </>
      ) : (
        <>
          {isWalletEnabled && (
            <PaymentMethodTabs
              active={method}
              onChange={switchMethod}
              isEnabled={!isProcessing}
              className="mb-4"
            />
          )}

          {method === 'card' ? (
            <>
              {total && (
                <WalletPayButton
                  amount={total.val}
                  currency={total.cur}
                  label={ticketOptionName}
                  payerEmail={userEmail}
                  isEnabled={!isProcessing}
                  onPaymentMethod={handleWalletPayment}
                  onError={setError}
                />
              )}
              <CardElement
                onChange={(event) =>
                  setIsCardComplete(!event.empty && !event.error)
                }
                options={{ ...cardStyle, hidePostalCode: true }}
                className="w-full h-14 rounded-xl bg-neutral px-4 py-4 mb-4"
              />
              <Button
                onClick={handleCard}
                isEnabled={Boolean(stripe) && isCardComplete && !isProcessing}
                isLoading={isProcessing}
              >
                {t('event_ticket_pay_now')}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {t('event_ticket_crypto_description', {
                  amount: initResult?.expectedAmount ?? total?.val ?? 0,
                  stablecoin:
                    initResult?.stablecoin || getStablecoinSymbol(config as any),
                  chain,
                })}
              </p>
              <Button
                onClick={handleCrypto}
                isEnabled={!isProcessing}
                isLoading={isProcessing}
              >
                {!isWalletConnected
                  ? t('event_ticket_connect_wallet')
                  : !isCorrectNetwork
                  ? t('event_ticket_switch_network', { chain })
                  : t('event_ticket_pay_now')}
              </Button>
              {account && (
                <p className="text-xs text-gray-400 mt-2 break-all">
                  {account}
                </p>
              )}
            </>
          )}
        </>
      )}

      {hint && !error && (
        <p className="text-sm text-gray-600 mt-3" role="status">
          {hint}
        </p>
      )}
      {error && (
        <div className="mt-4">
          <ErrorMessage error={error} />
        </div>
      )}

      <button
        type="button"
        className="mt-4 text-sm text-accent underline self-start"
        onClick={onBack}
        disabled={isProcessing}
      >
        {t('event_ticket_back_to_selection')}
      </button>
    </>
  );
};

export default TicketPaymentStep;
