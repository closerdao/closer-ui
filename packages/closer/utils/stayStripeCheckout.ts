import type { Stripe } from '@stripe/stripe-js';

import type {
  PendingModification,
  Stay,
  StayCheckoutResponse,
} from '../types/stay';
import { parseMessageFromError } from './common';
import {
  checkoutStay,
  confirmStayCheckout,
  getStay,
  hasLiveModificationPayment,
  isStayPaid,
} from './stays.api';

export type StayStripeCheckoutOutcome =
  | { status: 'ok'; checkout: StayCheckoutResponse | null }
  | { status: 'finalising' }
  | { status: 'failed'; message: string | null }
  | { status: 'stripe-not-ready' };

// 409: a payment is already processing; 503: captured but not recorded yet.
const FINALISING_HTTP_STATUSES = [409, 503];
const MONEY_MOVING_INTENT_STATUSES = ['processing', 'succeeded'];

const httpStatusOf = (err: unknown): number | undefined =>
  (err as { response?: { status?: number } })?.response?.status;

/** The held change a checkout pays for (closer-api#668); null for a plain stay payment. */
export type PaidChange = Pick<PendingModification, 'id' | 'overrides'>;

const sameInstant = (wanted: string | undefined, actual: string) =>
  !wanted || new Date(wanted).getTime() === new Date(actual).getTime();

// A lapsed hold also leaves the stay paid and hold-free, so only the stay now carrying the change proves it settled.
const carriesChange = (stay: Stay, change: PaidChange | null | undefined) => {
  if (!change) return true;
  if (stay.pendingModification?.id === change.id) return false;
  const { start, end, duration } = change.overrides;
  return (
    sameInstant(start, stay.start) &&
    sameInstant(end, stay.end) &&
    (duration == null || duration === stay.duration)
  );
};

const isPaidOnServer = async (
  stayId: string,
  change: PaidChange | null | undefined,
): Promise<boolean> => {
  try {
    const stay = await getStay(stayId);
    return (
      isStayPaid(stay) &&
      !hasLiveModificationPayment(stay) &&
      carriesChange(stay, change)
    );
  } catch {
    return false;
  }
};

// 410: the change this payment was for had lapsed, so the server refunded it.
const HOLD_LAPSED_HTTP_STATUS = 410;

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
  change,
}: {
  stayId: string;
  change?: PaidChange | null;
  paymentMethodId: string;
  stripe: Stripe | null;
  onReadyFor3ds?: () => void;
}): Promise<StayStripeCheckoutOutcome> => {
  let checkout: StayCheckoutResponse;
  try {
    checkout = await checkoutStay(stayId, paymentMethodId);
  } catch (err) {
    if (await isPaidOnServer(stayId, change))
      return { status: 'ok', checkout: null };
    const status = httpStatusOf(err);
    // No status means the reply was lost, so the api may already have charged.
    if (!status || FINALISING_HTTP_STATUSES.includes(status)) {
      return { status: 'finalising' };
    }
    return { status: 'failed', message: parseMessageFromError(err) };
  }

  const intent = checkout.paymentIntent;
  if (checkout.settled || !intent) return { status: 'ok', checkout };

  let intentStatus = intent.status;
  let declineMessage: string | null = null;
  const cardActionNeeded = needsCardAction(intent, paymentMethodId);
  if (stripe && intent.client_secret && cardActionNeeded) {
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
    if (httpStatusOf(err) === HOLD_LAPSED_HTTP_STATUS) {
      return { status: 'failed', message: parseMessageFromError(err) };
    }
    if (await isPaidOnServer(stayId, change)) return { status: 'ok', checkout };
    const status = httpStatusOf(err);
    if (
      (status && FINALISING_HTTP_STATUSES.includes(status)) ||
      MONEY_MOVING_INTENT_STATUSES.includes(intentStatus)
    ) {
      return { status: 'finalising' };
    }
    if (!stripe && cardActionNeeded) return { status: 'stripe-not-ready' };
    return { status: 'failed', message: declineMessage };
  }
};
