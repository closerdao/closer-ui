import { SubscriptionPlan } from '../types/subscriptions';

export const prepareSubscriptions = (subscriptionsConfig: {
  enabled: boolean;
  elements: SubscriptionPlan[];
}): SubscriptionPlan[] => {
  if (!subscriptionsConfig) return [];
  const formattedElements: SubscriptionPlan[] = subscriptionsConfig.elements;
  return formattedElements;
};
