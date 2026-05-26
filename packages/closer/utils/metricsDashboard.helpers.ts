import { isAxiosError } from 'axios';

import type {
  BookingFunnelResults,
  CitizenshipLikeFunnelResults,
  FundraiserFunnelResults,
  SignupFunnelResults,
  SubscriptionsFunnelResults,
  TokenFunnelResults,
} from '../types/metricsDashboard';

export function readMetricsApiMessage(err: unknown): string | null {
  if (!isAxiosError(err)) return null;
  const d = err.response?.data;
  if (
    d &&
    typeof d === 'object' &&
    'error' in d &&
    typeof (d as { error?: unknown }).error === 'string'
  ) {
    return (d as { error: string }).error;
  }
  return null;
}

export function coerceNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export const emptyTokenFunnel = (): TokenFunnelResults => ({
  tokenPageViews: 0,
  calculator: 0,
  checkout: 0,
  success: 0,
  tokensSoldPointSum: 0,
});

export const emptyBookingFunnel = (): BookingFunnelResults => ({
  availabilityChecks: 0,
  pageViews: 0,
  listingViews: 0,
  intentOrFlow: 0,
  completionSignals: 0,
  categoryTotal: 0,
  categoryPointSum: 0,
});

export const emptySubscriptionsFunnel = (): SubscriptionsFunnelResults => ({
  stripeFirstPayment: 0,
  subscriptionsPageViews: 0,
  subscriptionsCategoryTotal: 0,
  checkoutOrSubscribe: 0,
  completionSignals: 0,
  engagementSubscriptionTouch: 0,
  subscriptionsPointSum: 0,
});

export const emptyCitizenshipLikeFunnel = (): CitizenshipLikeFunnelResults => ({
  pageViews: 0,
  applicationFlow: 0,
  milestones: 0,
  categoryTotal: 0,
  categoryPointSum: 0,
});

export const emptySignupFunnel = (): SignupFunnelResults => ({
  pageViews: 0,
  formOrRegister: 0,
  submitOrCreate: 0,
  verifyOrActivate: 0,
  categoryTotal: 0,
  categoryPointSum: 0,
});

export const emptyFundraiserFunnel = (): FundraiserFunnelResults => ({
  pageViews: 0,
  donateIntent: 0,
  paymentFlow: 0,
  successSignals: 0,
  categoryTotal: 0,
  categoryPointSum: 0,
});

export function normalizeTokenFunnel(raw: unknown): TokenFunnelResults {
  const b = emptyTokenFunnel();
  if (!raw || typeof raw !== 'object') return b;
  const o = raw as Record<string, unknown>;
  return {
    tokenPageViews: coerceNumber(o.tokenPageViews),
    calculator: coerceNumber(o.calculator),
    checkout: coerceNumber(o.checkout),
    success: coerceNumber(o.success),
    tokensSoldPointSum: coerceNumber(o.tokensSoldPointSum),
  };
}

export function normalizeBookingFunnel(raw: unknown): BookingFunnelResults {
  const b = emptyBookingFunnel();
  if (!raw || typeof raw !== 'object') return b;
  const o = raw as Record<string, unknown>;
  return {
    availabilityChecks: coerceNumber(o.availabilityChecks),
    pageViews: coerceNumber(o.pageViews),
    listingViews: coerceNumber(o.listingViews),
    intentOrFlow: coerceNumber(o.intentOrFlow),
    completionSignals: coerceNumber(o.completionSignals),
    categoryTotal: coerceNumber(o.categoryTotal),
    categoryPointSum: coerceNumber(o.categoryPointSum),
  };
}

export function normalizeSubscriptionsFunnel(
  raw: unknown,
): SubscriptionsFunnelResults {
  const b = emptySubscriptionsFunnel();
  if (!raw || typeof raw !== 'object') return b;
  const o = raw as Record<string, unknown>;
  return {
    stripeFirstPayment: coerceNumber(o.stripeFirstPayment),
    subscriptionsPageViews: coerceNumber(o.subscriptionsPageViews),
    subscriptionsCategoryTotal: coerceNumber(o.subscriptionsCategoryTotal),
    checkoutOrSubscribe: coerceNumber(o.checkoutOrSubscribe),
    completionSignals: coerceNumber(o.completionSignals),
    engagementSubscriptionTouch: coerceNumber(o.engagementSubscriptionTouch),
    subscriptionsPointSum: coerceNumber(o.subscriptionsPointSum),
  };
}

export function normalizeCitizenshipLikeFunnel(
  raw: unknown,
): CitizenshipLikeFunnelResults {
  const b = emptyCitizenshipLikeFunnel();
  if (!raw || typeof raw !== 'object') return b;
  const o = raw as Record<string, unknown>;
  return {
    pageViews: coerceNumber(o.pageViews),
    applicationFlow: coerceNumber(o.applicationFlow),
    milestones: coerceNumber(o.milestones),
    categoryTotal: coerceNumber(o.categoryTotal),
    categoryPointSum: coerceNumber(o.categoryPointSum),
  };
}

export function normalizeSignupFunnel(raw: unknown): SignupFunnelResults {
  const b = emptySignupFunnel();
  if (!raw || typeof raw !== 'object') return b;
  const o = raw as Record<string, unknown>;
  return {
    pageViews: coerceNumber(o.pageViews),
    formOrRegister: coerceNumber(o.formOrRegister),
    submitOrCreate: coerceNumber(o.submitOrCreate),
    verifyOrActivate: coerceNumber(o.verifyOrActivate),
    categoryTotal: coerceNumber(o.categoryTotal),
    categoryPointSum: coerceNumber(o.categoryPointSum),
  };
}

export function normalizeFundraiserFunnel(raw: unknown): FundraiserFunnelResults {
  const b = emptyFundraiserFunnel();
  if (!raw || typeof raw !== 'object') return b;
  const o = raw as Record<string, unknown>;
  return {
    pageViews: coerceNumber(o.pageViews),
    donateIntent: coerceNumber(o.donateIntent),
    paymentFlow: coerceNumber(o.paymentFlow),
    successSignals: coerceNumber(o.successSignals),
    categoryTotal: coerceNumber(o.categoryTotal),
    categoryPointSum: coerceNumber(o.categoryPointSum),
  };
}
