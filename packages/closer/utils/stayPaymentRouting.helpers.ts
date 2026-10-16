import type { Stay } from '../types/stay';
import { hasLiveModificationPayment } from './stays.api';

export type StayPaymentRoutingParams = {
  bookingId: string;
  status: string;
  pendingModification?: Stay['pendingModification'];
  createdBy?: string;
};

/** A balance of zero is not proof of settlement. Only the server marks a stay paid. */
export function getBookingPaymentCheckoutPath(
  params: StayPaymentRoutingParams,
): string {
  const { bookingId, status } = params;
  if (['cancelled', 'rejected', 'pending-refund'].includes(status))
    return `/stay/${bookingId}`;
  if (
    hasLiveModificationPayment(params) ||
    params.pendingModification?.status === 'settling'
  )
    return `/stay/${bookingId}/payment`;
  if (status === 'draft' || status === 'open')
    return `/stay/create/${bookingId}`;
  if (status === 'pending') return `/stay/${bookingId}/pending`;
  if (
    ['confirmed', 'pending-payment', 'tokens-staked', 'credits-paid'].includes(
      status,
    )
  )
    return `/stay/${bookingId}/payment`;
  if (status === 'paid') return `/stay/${bookingId}/confirmation`;
  return `/stay/${bookingId}`;
}

export const getStayCheckoutPath = (stay: Stay): string =>
  getBookingPaymentCheckoutPath({ ...stay, bookingId: stay._id });

/** Preparation edits are explicit; a normal visit to an approved stay proceeds to payment. */
export const canEditStayPreparation = (stay: Stay): boolean =>
  ['confirmed', 'pending-payment', 'tokens-staked', 'credits-paid'].includes(
    stay.status,
  ) &&
  !stay.residencyAgreementId &&
  !stay.pendingModification;
