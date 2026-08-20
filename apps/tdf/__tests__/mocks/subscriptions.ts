import { SubscriptionPlan } from 'closer/types/subscriptions';

export const subscriptionsConfig: {
  enabled: boolean;
  elements: SubscriptionPlan[];
} = {
  enabled: true,
  elements: [
    {
      slug: 'wanderer',
      title: 'Wanderer',
      emoji: '👩🏽‍🌾',
      description: 'Stay in the loop and see if TDF is for you',
      priceId: 'price_1N1YLVE9CDXOM807XtNAwiBW',
      productId: 'prod_wanderer',
      tier: 1,
      monthlyCredits: 0,
      price: 10,
      perks:
        'Co-living access, Community calls, Discord Access, Learning Hub, E-book: “HOW TO BUILD A REGENERATIVE VILLAGE”',
      billingPeriod: 'month',
      available: true,
      tiersAvailable: false,
    },
    {
      slug: 'pioneer',
      title: 'Pioneer',
      emoji: '👨🏽‍🚀',
      description: 'BE THE LOOP. CONTINUOUSLY SUPPORT AND COME TO TDF',
      priceId: 'price_1ODOI1E9CDXOM807s4nGf4zz',
      productId: 'prod_pioneer',
      tier: 2,
      monthlyCredits: 1,
      price: 30,
      perks: 'Get 25% discount on stays by pre-paying every month, Co-living access, Community calls',
      billingPeriod: 'monthly',
      available: true,
      tiersAvailable: true,
    },
  ],
};
