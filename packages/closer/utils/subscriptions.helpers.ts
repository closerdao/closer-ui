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
  const formattedPlans: SubscriptionPlan[] = [];
  let i = 1;

  while (plans[`plan${i}Slug`]) {
    const plan: SubscriptionPlan = {
      slug: plans[`plan${i}Slug`].value,
      title: plans[`plan${i}Title`].value,
      emoji: plans[`plan${i}Emoji`]?.value,
      description: plans[`plan${i}Description`].value,
      priceId: plans[`plan${i}PriceId`].value,
      tier: plans[`plan${i}Tier`].value,
      monthlyCredits: plans[`plan${i}MonthlyCredits`]?.value,
      price: plans[`plan${i}Price`].value,
      perks: plans[`plan${i}Perks`].value.split(','),
      billingPeriod: plans[`plan${i}BillingPeriod`].value,
    };

    if (i > 1) {
      plan.available = plans[`plan${i}Available`]?.value;
    }
    if (i == 3) {
      const tiers = plans[`plan${i}Tiers`].value;
      plan.tiers = convertStringToTiersArray(tiers);
    }

    formattedPlans.push(plan);
    i++;
  }

  return formattedPlans;
};
