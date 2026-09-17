import { useEffect, useRef, useState } from 'react';

import {
  PaymentRequestButtonElement,
  useStripe,
} from '@stripe/react-stripe-js';
import type {
  PaymentRequest,
  PaymentRequestCompleteStatus,
  PaymentRequestPaymentMethodEvent,
} from '@stripe/stripe-js';

import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../../constants';
import { useConfig } from '../../hooks/useConfig';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';

export type WalletPayComplete = (status: PaymentRequestCompleteStatus) => void;

interface Props {
  /** Amount in major units — `12.5` means €12.50. */
  amount: number;
  currency?: string;
  /** The single line item the wallet sheet lists above the total. */
  label: string;
  payerEmail?: string;
  isEnabled?: boolean;
  /** Renders "or pay by card" underneath, since a card form always follows. */
  hasCardFallback?: boolean;
  className?: string;
  /**
   * Runs with the wallet's payment method once the guest authorises it. Call
   * `complete` the moment the payment settles or fails: the wallet sheet stays
   * up until you do, and a 3DS challenge can only be shown once it is down.
   */
  onPaymentMethod: (
    paymentMethodId: string,
    complete: WalletPayComplete,
  ) => Promise<void>;
  onError?: (message: string) => void;
}

/**
 * Apple Pay / Google Pay, drawn by the browser's own payment sheet.
 *
 * The button only exists when the browser has a wallet with a card in it, so
 * every caller keeps its card form as the path everyone else takes. Stripe
 * hands back an ordinary payment method id, which means a flow can pay with it
 * exactly the way it pays with a card the guest typed.
 *
 * Apple Pay additionally needs the domain registered with Stripe — an
 * unregistered domain simply never reports a wallet, and the button stays
 * hidden rather than failing at payment time.
 */
const WalletPayButton = ({
  amount,
  currency = DEFAULT_CURRENCY,
  label,
  payerEmail,
  isEnabled = true,
  hasCardFallback = true,
  className = '',
  onPaymentMethod,
  onError,
}: Props) => {
  const t = useTranslations();
  const stripe = useStripe();
  const config = useConfig();

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null,
  );
  const [hasWallet, setHasWallet] = useState(false);

  // The listener is bound once per payment request, so it reads its callbacks
  // through refs rather than being torn down on every render.
  const onPaymentMethodRef = useRef(onPaymentMethod);
  const onErrorRef = useRef(onError);
  const isEnabledRef = useRef(isEnabled);
  useEffect(() => {
    onPaymentMethodRef.current = onPaymentMethod;
    onErrorRef.current = onError;
    isEnabledRef.current = isEnabled;
  });

  const country =
    getCachedConfig('general')?.country || config?.country || 'PT';
  const amountInCents = Math.round(amount * 100);

  useEffect(() => {
    // Nothing here is worth breaking a checkout over: a Stripe that cannot
    // build a payment request just means no wallet button.
    if (typeof stripe?.paymentRequest !== 'function') return;
    if (amountInCents <= 0) return;
    let isCurrent = true;

    const request = stripe.paymentRequest({
      country,
      currency: currency.toLowerCase(),
      total: { label, amount: amountInCents },
      requestPayerName: true,
      requestPayerEmail: !payerEmail,
    });

    request
      .canMakePayment()
      .then((result) => {
        if (!isCurrent) return;
        // `link` alone is not a wallet we want to surface — it would put a
        // second Stripe-branded sign-in above a card form that already works.
        if (result?.applePay || result?.googlePay) {
          setPaymentRequest(request);
          setHasWallet(true);
        }
      })
      .catch(() => {
        // An unregistered domain reports here; the card form is still fine.
      });

    return () => {
      isCurrent = false;
    };
    // The request is built once per currency/country: its amount and label are
    // pushed through `update` below, because rebuilding it would tear the
    // mounted button out of the DOM mid-payment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, country, currency, payerEmail]);

  useEffect(() => {
    if (!paymentRequest || amountInCents <= 0) return;
    paymentRequest.update({
      total: { label, amount: amountInCents },
    });
  }, [paymentRequest, label, amountInCents]);

  useEffect(() => {
    if (!paymentRequest) return;

    const handlePaymentMethod = async (
      event: PaymentRequestPaymentMethodEvent,
    ) => {
      if (!isEnabledRef.current) {
        event.complete('fail');
        return;
      }

      // The sheet hangs open until it is told the outcome, and telling it
      // twice throws — so the caller gets one shot, and we cover the rest.
      let isSettled = false;
      const complete: WalletPayComplete = (status) => {
        if (isSettled) return;
        isSettled = true;
        event.complete(status);
      };

      try {
        await onPaymentMethodRef.current(event.paymentMethod.id, complete);
        complete('success');
      } catch (err) {
        complete('fail');
        onErrorRef.current?.(
          err instanceof Error ? err.message : t('checkout_wallet_error'),
        );
      }
    };

    paymentRequest.on('paymentmethod', handlePaymentMethod);
    return () => {
      paymentRequest.off('paymentmethod', handlePaymentMethod);
    };
  }, [paymentRequest, t]);

  if (!paymentRequest || !hasWallet) return null;

  return (
    <div className={className}>
      <div className={isEnabled ? '' : 'opacity-50 pointer-events-none'}>
        <PaymentRequestButtonElement
          options={{
            paymentRequest,
            style: {
              paymentRequestButton: { type: 'default', height: '48px' },
            },
          }}
        />
      </div>
      {hasCardFallback && (
        <div className="flex items-center gap-3 my-4">
          <span className="h-px bg-gray-200 flex-1" />
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {t('checkout_wallet_or_card')}
          </span>
          <span className="h-px bg-gray-200 flex-1" />
        </div>
      )}
    </div>
  );
};

export default WalletPayButton;
