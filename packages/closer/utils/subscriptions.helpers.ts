import { SubscriptionPlan, SubscriptionsConfig } from '../types/subscriptions';

export const isPaidSubscriptionPlan = (
  plan?: SubscriptionPlan | null,
): plan is SubscriptionPlan => {
  if (!plan) {
    return false;
  }

  const priceId = plan.priceId?.trim();
  if (!priceId || priceId === 'free') {
    return false;
  }

  if (plan.slug === 'citizen') {
    return false;
  }

  return true;
};

export const filterPaidSubscriptionPlans = (
  plans: SubscriptionPlan[] = [],
): SubscriptionPlan[] => plans.filter(isPaidSubscriptionPlan);

export const prepareSubscriptions = (
  subscriptionsConfig?: SubscriptionsConfig | null,
): SubscriptionPlan[] => {
  if (!subscriptionsConfig?.elements) {
    return [];
  }

  return subscriptionsConfig.elements;
};

export const getPaidSubscriptionPlans = (
  subscriptionsConfig?: SubscriptionsConfig | null,
  options?: { availableOnly?: boolean },
): SubscriptionPlan[] => {
  const plans = filterPaidSubscriptionPlans(
    prepareSubscriptions(subscriptionsConfig),
  );

  if (options?.availableOnly === false) {
    return plans;
  }

  return plans.filter((plan) => plan.available);
};

export const filterCitizenAndFreeFromElements = (
  elements: SubscriptionPlan[] = [],
): SubscriptionPlan[] =>
  elements.filter(
    (plan) =>
      plan?.slug !== 'citizen' &&
      plan?.priceId !== 'free' &&
      Boolean(plan),
  );
