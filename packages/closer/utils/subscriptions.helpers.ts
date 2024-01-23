import { SubscriptionPlan } from '../types/subscriptions';

interface Tier {
  unitPrice: number;
  minAmount: number;
  maxAmount: number;
}

export const prepareSubscriptions = (subscriptionsConfig: {
  enabled: boolean;
  plans: SubscriptionPlan[];
}): SubscriptionPlan[] => {
  if (subscriptionsConfig) {
    const formattedPlans: SubscriptionPlan[] = subscriptionsConfig.plans;
    return formattedPlans;
  }
  return [];
};
