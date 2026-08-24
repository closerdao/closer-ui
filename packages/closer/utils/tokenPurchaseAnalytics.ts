import type { Sale, TrackableTokenSale } from '../types/api';
import { AnalyticsEvents, trackEvent } from './posthog';

const runOnce = (key: string, callback: () => void): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage.getItem(key)) {
      return false;
    }
  } catch {
    // Storage can be unavailable in privacy modes.
  }

  callback();

  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, '1');
  } catch {
    // Best effort: analytics must not break the purchase success flow.
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
      $insert_id: `token-purchased-${sale._id}`,
    });
  });
};

export const reportTokenSaleSuccess = (
  sale: TrackableTokenSale,
  callbacks: { trackGa: () => void; logPlatformMetric: () => void },
): boolean => {
  if (!isSuccessfulTokenPurchase(sale)) return false;

  runOnce(`analytics:ga-token-success:${sale._id}`, callbacks.trackGa);
  trackTokenPurchaseOnce(sale);
  callbacks.logPlatformMetric();
  return true;
};
