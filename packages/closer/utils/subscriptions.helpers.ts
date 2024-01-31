import { SubscriptionPlan } from '../types/subscriptions';

interface Tier {
  unitPrice: number;
  minAmount: number;
  maxAmount: number;
}

export const prepareSubscriptions = (subscriptionsConfig: {
  enabled: boolean;
  entries: SubscriptionPlan[];
}): SubscriptionPlan[] => {
  if (subscriptionsConfig) {
    const formattedPlans: SubscriptionPlan[] = subscriptionsConfig.entries;
    return formattedPlans;
  }
  return [];
};
