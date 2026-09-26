import { Stripe, loadStripe } from '@stripe/stripe-js';

import {
  PaymentConfig,
  StripeConnectBannerKind,
  StripeConnectLiveStatus,
} from '../types/api';
import {
  isVillageConnectedAccount,
  resolveDefaultConnectedAccountId,
} from './stripeAccounts';

export const getResolvedStripeConnectedAccountId = (
  paymentConfig?: Partial<PaymentConfig> | null,
): string | null => resolveDefaultConnectedAccountId(paymentConfig);

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

const resolveGatedAccountId = (
  paymentConfig?: Partial<PaymentConfig> | null,
  accountId?: string | null,
): string | null =>
  accountId === undefined
    ? getResolvedStripeConnectedAccountId(paymentConfig)
    : accountId || null;

export const isCardPaymentReady = (
  paymentConfig?: Partial<PaymentConfig> | null,
  accountId?: string | null,
): boolean => {
  const resolved = resolveGatedAccountId(paymentConfig, accountId);
  if (!resolved || !isVillageConnectedAccount(paymentConfig, resolved)) {
    return false;
  }
  if (!isConnectEnvReady(paymentConfig)) {
    return false;
  }
  return Boolean(paymentConfig?.cardPayment);
};

export const areSubscriptionsConnectReady = (
  paymentConfig?: Partial<PaymentConfig> | null,
  accountId?: string | null,
): boolean => {
  const resolved = resolveGatedAccountId(paymentConfig, accountId);
  return (
    Boolean(resolved) &&
    isVillageConnectedAccount(paymentConfig, resolved) &&
    isConnectEnvReady(paymentConfig)
  );
};

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
  if (stripeConnectQuery === 'failed') {
    return 'failed';
  }
  if (!storedAccountId) {
    return null;
  }
  if (live && live.accountLinked === false) {
    return 'not_linked';
  }
  if (connectStatus === 'pending') {
    return 'pending';
  }
  if (connectStatus === 'active') {
    return 'active';
  }
  if (stripeConnectQuery === 'pending') {
    return 'pending';
  }
  if (stripeConnectQuery === 'success') {
    if (!live) {
      return 'pending';
    }
    if (live.webhookUrlMatches) {
      return 'active';
    }
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
  accountId?: string | null,
): Promise<Stripe | null> | null => {
  const publishableKey = process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY;
  const connectedAccountId = resolveGatedAccountId(paymentConfig, accountId);
  if (!publishableKey || !connectedAccountId) {
    return null;
  }
  return loadStripe(publishableKey, {
    stripeAccount: connectedAccountId,
  });
};
