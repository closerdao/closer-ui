import { SubscriptionPlan } from '../types/subscriptions';

interface Tier {
  unitPrice: number;
  minAmount: number;
  maxAmount: number;
}

const convertStringToTiersArray = (inputString: string): Tier[] => {
  const tiers: Tier[] = [];
  const tierValues = inputString.split(', ');

  for (let i = 0; i < tierValues.length; i += 3) {
    tiers.push({
      unitPrice: Number(tierValues[i].split(': ')[1]),
      minAmount: Number(tierValues[i + 1].split(': ')[1]),
      maxAmount: Number(tierValues[i + 2].split(': ')[1]),
    });
  }

  return tiers;
};

export const prepareSubscriptions = (
  plans: Record<string, any>,
): SubscriptionPlan[] => {
  const formattedPlans: SubscriptionPlan[] = plans.plans;

  return formattedPlans;
};
