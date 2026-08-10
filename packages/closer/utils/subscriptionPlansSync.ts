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
  SubscriptionPlansSyncRequest,
  SubscriptionPlansSyncResponse,
} from '../types/subscriptions';
import api from './api';
import { parseMessageFromError } from './common';
import { filterCitizenAndFreeFromElements } from './subscriptions.helpers';

export const SUBSCRIPTION_PLANS_SYNC_PATH =
  '/stripe/subscription-plans/sync';

const mergeSyncedPlanIds = (
  localElements: SubscriptionPlan[],
  syncedElements: SubscriptionPlan[],
): SubscriptionPlan[] => {
  const bySlug = new Map(
    syncedElements
      .filter((plan) => plan.slug)
      .map((plan) => [plan.slug, plan] as const),
  );

  return localElements.map((plan) => {
    const synced = bySlug.get(plan.slug);
    if (!synced) {
      return plan;
    }
    return {
      ...plan,
      priceId: synced.priceId || plan.priceId,
      productId: synced.productId || plan.productId,
      price:
        typeof synced.price === 'number' && !Number.isNaN(synced.price)
          ? synced.price
          : plan.price,
    };
  });
};

export const syncSubscriptionPlansWithStripe = async (
  elements: SubscriptionPlan[],
  currency: string,
): Promise<SubscriptionPlan[]> => {
  const localElements = filterCitizenAndFreeFromElements(elements);
  const plansToSync = localElements.filter((plan) => Number(plan.price) > 0);

  if (plansToSync.length === 0) {
    return localElements;
  }

  const payload: SubscriptionPlansSyncRequest = {
    currency: currency.toLowerCase(),
    elements: plansToSync.map((plan) => ({
      slug: plan.slug,
      title: plan.title,
      emoji: plan.emoji,
      description: plan.description,
      priceId: plan.priceId || undefined,
      productId: plan.productId || undefined,
      tier: Number(plan.tier) || 0,
      monthlyCredits: Number(plan.monthlyCredits) || 0,
      price: Number(plan.price) || 0,
      available: Boolean(plan.available),
      tiersAvailable: Boolean(plan.tiersAvailable),
      perks: plan.perks || '',
      billingPeriod: plan.billingPeriod || 'month',
    })),
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

    return mergeSyncedPlanIds(localElements, syncedElements);
  } catch (error) {
    throw new Error(parseMessageFromError(error));
  }
};
