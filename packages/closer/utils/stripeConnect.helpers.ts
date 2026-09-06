import { Stripe, loadStripe } from '@stripe/stripe-js';

import {
  PaymentConfig,
  StripeConnectBannerKind,
  StripeConnectLiveStatus,
} from '../types/api';

export const getResolvedStripeConnectedAccountId = (
  paymentConfig?: Partial<PaymentConfig> | null,
): string | null => {
  const fromConfig = paymentConfig?.connectedAccountId;
  if (fromConfig && String(fromConfig).trim()) {
    return String(fromConfig).trim();
  }
  return null;
};

export const isStripeConnectAccountReady = (
  paymentConfig?: Partial<PaymentConfig> | null,
): boolean => Boolean(getResolvedStripeConnectedAccountId(paymentConfig));

export const isStripeWebhookLive = (
  paymentConfig?: Partial<PaymentConfig> | null,
): boolean => paymentConfig?.webhookLive !== false;

export const isConnectEnvReady = (
  paymentConfig?: Partial<PaymentConfig> | null,
): boolean => {
  const status = paymentConfig?.connectStatus;
  if (!status) {
    return isStripeWebhookLive(paymentConfig);
  }
  return status === 'active';
};

export const isCardPaymentReady = (
  paymentConfig?: Partial<PaymentConfig> | null,
): boolean => {
  if (!isStripeConnectAccountReady(paymentConfig)) {
    return false;
  }
  if (!isConnectEnvReady(paymentConfig)) {
    return false;
  }
  return Boolean(paymentConfig?.cardPayment);
};

export const areSubscriptionsConnectReady = (
  paymentConfig?: Partial<PaymentConfig> | null,
): boolean =>
  isStripeConnectAccountReady(paymentConfig) &&
  isConnectEnvReady(paymentConfig);

export const resolveStripeConnectBannerKind = ({
  stripeConnectQuery,
  storedAccountId,
  live,
  connectStatus,
}: {
  stripeConnectQuery: string;
  storedAccountId: string | null;
  live: StripeConnectLiveStatus | null;
  connectStatus?: PaymentConfig['connectStatus'] | null;
}): StripeConnectBannerKind => {
  if (!storedAccountId) {
    return null;
  }
  if (live && live.accountLinked === false) {
    return 'not_linked';
  }
  if (connectStatus === 'publish_failed') {
    return 'publish_failed';
  }
  if (connectStatus === 'skipped') {
    return 'undelivered';
  }
  if (connectStatus === 'pending') {
    return 'pending';
  }
  if (connectStatus === 'active') {
    return 'active';
  }
  if (stripeConnectQuery === 'publish_failed') {
    return 'publish_failed';
  }
  if (stripeConnectQuery === 'skipped') {
    return 'undelivered';
  }
  if (stripeConnectQuery === 'pending') {
    return 'pending';
  }
  if (!live) {
    return 'pending';
  }
  if (live.webhookUrlMatches) {
    return 'active';
  }
  return 'pending';
};

export const createStripePromise = (
  paymentConfig?: Partial<PaymentConfig> | null,
): Promise<Stripe | null> | null => {
  const publishableKey = process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY;
  const connectedAccountId = getResolvedStripeConnectedAccountId(paymentConfig);
  if (!publishableKey || !connectedAccountId) {
    return null;
  }
  return loadStripe(publishableKey, {
    stripeAccount: connectedAccountId,
  });
};
