import type { Stripe } from '@stripe/stripe-js';

import type { StayCheckoutResponse } from '../types/stay';
import { parseMessageFromError } from './common';
import {
  checkoutStay,
  confirmStayCheckout,
  getStay,
  isStayPaid,
} from './stays.api';

export type StayStripeCheckoutOutcome =
  | { status: 'ok'; checkout: StayCheckoutResponse | null }
  | { status: 'finalising' }
  | { status: 'failed'; message: string | null };

// 409: a payment is already processing; 503: captured but not recorded yet.
const FINALISING_HTTP_STATUSES = [409, 503];
const MONEY_MOVING_INTENT_STATUSES = ['processing', 'succeeded'];

const httpStatusOf = (err: unknown): number | undefined =>
  (err as { response?: { status?: number } })?.response?.status;

const isPaidOnServer = async (stayId: string): Promise<boolean> => {
  try {
    return isStayPaid(await getStay(stayId));
  } catch {
    return false;
  }
};

const needsCardAction = (
  intent: NonNullable<StayCheckoutResponse['paymentIntent']>,
  paymentMethodId: string,
) =>
  intent.status === 'requires_action' ||
  (intent.status === 'requires_confirmation' && Boolean(paymentMethodId));

// Every intent the server opened goes to /confirm: the server, not the browser, decides whether it is paid.
export const checkoutStayWithStripe = async ({
  stayId,
  paymentMethodId,
  stripe,
  onReadyFor3ds,
}: {
  stayId: string;
  paymentMethodId: string;
  stripe: Stripe | null;
  onReadyFor3ds?: () => void;
}): Promise<StayStripeCheckoutOutcome> => {
  let checkout: StayCheckoutResponse;
  try {
    checkout = await checkoutStay(stayId, paymentMethodId);
  } catch (err) {
    if (await isPaidOnServer(stayId)) return { status: 'ok', checkout: null };
    const status = httpStatusOf(err);
    if (status && FINALISING_HTTP_STATUSES.includes(status)) {
      return { status: 'finalising' };
    }
    return { status: 'failed', message: parseMessageFromError(err) };
  }

  const intent = checkout.paymentIntent;
  if (checkout.settled || !intent) return { status: 'ok', checkout };

  let intentStatus = intent.status;
  let declineMessage: string | null = null;
  if (
    stripe &&
    intent.client_secret &&
    needsCardAction(intent, paymentMethodId)
  ) {
    onReadyFor3ds?.();
    // A thrown Stripe.js call must still reach /confirm below.
    const result = await stripe
      .confirmCardPayment(intent.client_secret, {
        payment_method: paymentMethodId,
      })
      .catch(() => null);
    intentStatus =
      result?.paymentIntent?.status ??
      result?.error?.payment_intent?.status ??
      intentStatus;
    declineMessage = result?.error?.message ?? null;
  }

  try {
    await confirmStayCheckout(stayId, intent.id);
    return { status: 'ok', checkout };
  } catch (err) {
    if (await isPaidOnServer(stayId)) return { status: 'ok', checkout };
    const status = httpStatusOf(err);
    if (
      (status && FINALISING_HTTP_STATUSES.includes(status)) ||
      MONEY_MOVING_INTENT_STATUSES.includes(intentStatus)
    ) {
      return { status: 'finalising' };
    }
    return { status: 'failed', message: declineMessage };
  }
};
