import type { Sale, TrackableTokenSale } from '../types/api';

import { AnalyticsEvents, trackEvent } from './posthog';

// In-memory mirror of the localStorage markers, so a browser whose storage
// throws (private mode, quota, disabled) still dedupes within the page life.
const seen = new Set<string>();

export const runOnce = (key: string, callback: () => void): boolean => {
  if (seen.has(key)) return false;
  try {
    if (typeof window !== 'undefined' && window.localStorage.getItem(key)) {
      seen.add(key);
      return false;
    }
  } catch {
    // fall through: treat unreadable storage as "not seen yet"
  }

  seen.add(key);
  callback();

  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, '1');
  } catch {
    // fall through: best effort, must not break the caller
  }
  return true;
};

export const getTokenPurchaseMethod = (
  paymentMethod: Sale['paymentMethod'],
): 'crypto' | 'fiat' => (paymentMethod === 'crypto' ? 'crypto' : 'fiat');

export const isSuccessfulTokenPurchase = (
  sale: TrackableTokenSale,
): sale is TrackableTokenSale & { quantity: number; status: 'paid' } =>
  sale.product_type === 'token' &&
  sale.status === 'paid' &&
  typeof sale.quantity === 'number' &&
  Number.isFinite(sale.quantity) &&
  sale.quantity > 0;

/** Track only completed purchases, once per browser and sale. */
export const trackTokenPurchaseOnce = (sale: TrackableTokenSale): boolean => {
  if (!isSuccessfulTokenPurchase(sale)) return false;
  return runOnce(`analytics:token-purchased:${sale._id}`, () => {
    trackEvent(AnalyticsEvents.TOKEN_PURCHASED, {
      quantity: sale.quantity,
      saleId: sale._id,
      method: getTokenPurchaseMethod(sale.paymentMethod),
    });
  });
};
