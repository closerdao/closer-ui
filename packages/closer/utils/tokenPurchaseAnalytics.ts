import type { Sale } from '../types/api';
import { AnalyticsEvents, trackEvent } from './posthog';

const storageKey = (saleId: string) => `analytics:token-purchased:${saleId}`;

export const getTokenPurchaseMethod = (
  paymentMethod: Sale['paymentMethod'],
): 'crypto' | 'fiat' => (paymentMethod === 'crypto' ? 'crypto' : 'fiat');

type TrackableTokenSale = Pick<
  Sale,
  '_id' | 'product_type' | 'status' | 'quantity' | 'paymentMethod'
>;

/** Track only completed purchases, once per browser and sale. */
export const trackTokenPurchaseOnce = (sale: TrackableTokenSale): boolean => {
  const quantity = sale.quantity;
  if (
    sale.product_type !== 'token' ||
    sale.status !== 'paid' ||
    typeof quantity !== 'number' ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return false;
  }

  const key = storageKey(sale._id);
  try {
    if (typeof window !== 'undefined' && window.localStorage.getItem(key)) {
      return false;
    }
  } catch {
    // Storage can be unavailable in privacy modes. $insert_id still deduplicates.
  }

  trackEvent(AnalyticsEvents.TOKEN_PURCHASED, {
    quantity,
    saleId: sale._id,
    method: getTokenPurchaseMethod(sale.paymentMethod),
    $insert_id: `token-purchased-${sale._id}`,
  });

  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, '1');
  } catch {
    // See above: event-level deduplication remains available.
  }
  return true;
};
