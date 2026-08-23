/**
 * Frontend client for POST /stripe/subscription-plans/sync
 *
 * Backend contract (implement outside this UI repo):
 * - Auth: admin
 * - Body: { currency: string, elements: SubscriptionPlanSyncInput[] }
 * - Skip / reject slug === "citizen" and priceId === "free"
 * - For each paid plan: create/update Stripe Product; create a new Price when
 *   amount/interval changed or priceId is missing; archive superseded Prices
 * - Response: { elements: SubscriptionPlan[] } with priceId + productId filled
 * - On Stripe/key errors: return a clear error message; FE will not patch config
 */
import {
  SubscriptionPlan,
  SubscriptionPlanSyncInput,
  SubscriptionPlansSyncRequest,
  SubscriptionPlansSyncResponse,
} from '../types/subscriptions';
import api from './api';
import { parseMessageFromError } from './common';
import { filterCitizenAndFreeFromElements } from './subscriptions.helpers';

export const SUBSCRIPTION_PLANS_SYNC_PATH =
  '/stripe/subscription-plans/sync';

/**
 * A stored priceId/productId can point at an object the current Stripe account
 * has never heard of — plans copied between platforms, a key swapped from test
 * to live, or an object deleted in the Stripe dashboard. The backend fails the
 * whole sync when it cannot retrieve one, which leaves the admin stuck: the
 * stale id lives in config, so every save re-sends it and fails again. We treat
 * that as "this id is gone" and re-sync without it, which is the same path a
 * brand new plan takes, so Stripe mints a fresh price.
 */
const MISSING_STRIPE_OBJECT_PATTERNS = [
  /was not found on the stripe connected account/i,
  /no such (price|product|plan|coupon)/i,
  /resource_missing/i,
];

const STRIPE_ID_PATTERN = /\b(?:price|prod|coupon)_[A-Za-z0-9]+/g;

const isMissingStripeObjectError = (message: string): boolean =>
  MISSING_STRIPE_OBJECT_PATTERNS.some((pattern) => pattern.test(message));

const extractStripeIds = (message: string): string[] =>
  message.match(STRIPE_ID_PATTERN) || [];

const isStale = (staleIds: Set<string>, id?: string): boolean =>
  Boolean(id && staleIds.has(id));

const mergeSyncedPlanIds = (
  localElements: SubscriptionPlan[],
  syncedElements: SubscriptionPlan[],
  staleIds: Set<string>,
): SubscriptionPlan[] => {
  const bySlug = new Map(
    syncedElements
      .filter((plan) => plan.slug)
      .map((plan) => [plan.slug, plan] as const),
  );

  return localElements.map((plan) => {
    const synced = bySlug.get(plan.slug);
    // Never fall back to an id Stripe told us does not exist.
    const localPriceId = isStale(staleIds, plan.priceId) ? '' : plan.priceId;
    const localProductId = isStale(staleIds, plan.productId)
      ? ''
      : plan.productId;
    const localCouponId = isStale(staleIds, plan.couponId) ? '' : plan.couponId;

    if (!synced) {
      return {
        ...plan,
        priceId: localPriceId,
        productId: localProductId,
        couponId: localCouponId,
      };
    }
    return {
      ...plan,
      priceId: synced.priceId || localPriceId,
      productId: synced.productId || localProductId,
      couponId: synced.couponId || localCouponId,
      firstMonthFree:
        typeof synced.firstMonthFree === 'boolean'
          ? synced.firstMonthFree
          : plan.firstMonthFree,
      price:
        typeof synced.price === 'number' && !Number.isNaN(synced.price)
          ? synced.price
          : plan.price,
      billingPeriod: synced.billingPeriod || plan.billingPeriod,
    };
  });
};

const buildSyncElements = (
  plansToSync: SubscriptionPlan[],
  staleIds: Set<string>,
): SubscriptionPlanSyncInput[] =>
  plansToSync.map((plan) => ({
    slug: plan.slug,
    title: plan.title,
    emoji: plan.emoji,
    description: plan.description,
    priceId: isStale(staleIds, plan.priceId) ? undefined : plan.priceId || undefined,
    productId: isStale(staleIds, plan.productId)
      ? undefined
      : plan.productId || undefined,
    couponId: isStale(staleIds, plan.couponId) ? undefined : plan.couponId || undefined,
    firstMonthFree: Boolean(plan.firstMonthFree),
    tier: Number(plan.tier) || 0,
    monthlyCredits: Number(plan.monthlyCredits) || 0,
    price: Number(plan.price) || 0,
    available: Boolean(plan.available),
    tiersAvailable: Boolean(plan.tiersAvailable),
    perks: plan.perks || '',
    billingPeriod: plan.billingPeriod || 'month',
  }));

export const syncSubscriptionPlansWithStripe = async (
  elements: SubscriptionPlan[],
  currency: string,
): Promise<SubscriptionPlan[]> => {
  const localElements = filterCitizenAndFreeFromElements(elements);
  const plansToSync = localElements.filter((plan) => Number(plan.price) > 0);

  if (plansToSync.length === 0) {
    return localElements;
  }

  const sentIds = new Set(
    plansToSync
      .flatMap((plan) => [plan.priceId, plan.productId, plan.couponId])
      .filter((id): id is string => Boolean(id)),
  );
  const staleIds = new Set<string>();
  // The backend reports the first id it cannot resolve, so several stale ids
  // take several rounds. One attempt per id we sent is the most that can help.
  const maxAttempts = sentIds.size + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const payload: SubscriptionPlansSyncRequest = {
      currency: currency.toLowerCase(),
      elements: buildSyncElements(plansToSync, staleIds),
    };

    try {
      const response = await api.post(SUBSCRIPTION_PLANS_SYNC_PATH, payload);
      const data = response?.data as
        | SubscriptionPlansSyncResponse
        | { results?: SubscriptionPlansSyncResponse }
        | undefined;
      const syncedElements =
        data && 'elements' in data && Array.isArray(data.elements)
          ? data.elements
          : data &&
              'results' in data &&
              data.results &&
              Array.isArray(data.results.elements)
            ? data.results.elements
            : null;

      if (!syncedElements) {
        throw new Error('Invalid response from subscription plans sync');
      }

      return mergeSyncedPlanIds(localElements, syncedElements, staleIds);
    } catch (error) {
      const message = parseMessageFromError(error);
      const newStaleIds = isMissingStripeObjectError(message)
        ? extractStripeIds(message).filter(
            (id) => sentIds.has(id) && !staleIds.has(id),
          )
        : [];

      if (newStaleIds.length === 0) {
        throw new Error(message);
      }

      newStaleIds.forEach((id) => staleIds.add(id));
    }
  }

  throw new Error(
    'Could not sync subscription plans with Stripe: the stored Stripe ids do not exist on this account.',
  );
};
