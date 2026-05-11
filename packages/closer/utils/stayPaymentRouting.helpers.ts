import type { Booking } from '../types/booking';
import type { Stay } from '../types/stay';

import {
  computeCreditsOwed,
  computeTokensOwed,
} from './stays.api';

type PaymentDeltaInput =
  | Booking['paymentDelta']
  | Stay['paymentDelta']
  | null
  | undefined;

function stayPaymentDeltaHasPayableDue(
  paymentDelta: PaymentDeltaInput,
  useTokens: boolean,
): boolean {
  if (!paymentDelta) return false;
  if (
    paymentDelta.fiat &&
    Math.abs(paymentDelta.fiat.val) > 0.005 &&
    paymentDelta.fiat.val > 0
  ) {
    return true;
  }
  if (paymentDelta.token && paymentDelta.token.val > 0.005) {
    return true;
  }
  if (paymentDelta.credits && paymentDelta.credits.val > 0.005) {
    return true;
  }
  return false;
}

export type StayPaymentRoutingParams = {
  bookingId: string;
  stayShaped: boolean;
  status: string;
  paymentDelta?: PaymentDeltaInput;
  useTokens?: boolean;
  fiatOwed?: number;
  tokensOwed?: number;
  creditsOwed?: number;
};

export function stayRequiresFullCheckoutFlow(
  stay: Stay,
  paymentDelta: PaymentDeltaInput,
): boolean {
  if (computeTokensOwed(stay) > 0.005) return true;
  if (computeCreditsOwed(stay) > 0.005) return true;
  const pd = paymentDelta ?? stay.paymentDelta;
  if (pd?.credits && pd.credits.val > 0.005) return true;
  if (pd?.token && pd.token.val > 0.005) return true;
  return false;
}

export function getBookingPaymentCheckoutPath(
  params: StayPaymentRoutingParams,
): string {
  const {
    bookingId,
    stayShaped,
    status,
    paymentDelta,
    useTokens = false,
    fiatOwed = 0,
    tokensOwed = 0,
    creditsOwed = 0,
  } = params;

  if (!stayShaped) {
    return status === 'open'
      ? `/bookings/${bookingId}/summary`
      : `/bookings/${bookingId}/checkout`;
  }

  if (status === 'open') {
    return `/stay/create/${bookingId}`;
  }

  if (stayPaymentDeltaHasPayableDue(paymentDelta, useTokens)) {
    const pd = paymentDelta;
    if (pd?.credits && pd.credits.val > 0.005) {
      return `/stay/create/${bookingId}`;
    }
    if (useTokens && pd?.token && pd.token.val > 0.005) {
      return `/stay/create/${bookingId}`;
    }
    if (pd?.fiat && pd.fiat.val > 0.005) {
      return `/stay/${bookingId}/payment`;
    }
    return `/stay/create/${bookingId}`;
  }

  if (status === 'confirmed' || status === 'pending-payment') {
    if (tokensOwed > 0.005 || creditsOwed > 0.005) {
      return `/stay/create/${bookingId}`;
    }
    if (fiatOwed > 0.005) {
      return `/stay/${bookingId}/payment`;
    }
  }

  return `/stay/create/${bookingId}`;
}
