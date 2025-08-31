import { SubscriptionPlan } from 'closer/types/subscriptions';

export const subscriptionsConfig: {
  enabled: boolean;
  elements: SubscriptionPlan[];
} = {
  enabled: true,
  elements: [
    {
      slug: 'explorer',
      title: 'Explorer',
      emoji: '🕵🏽‍♀️',
      description: 'DIP YOUR TOE BEFORE BUCKLING UP FOR THE ADVENTURE',
      priceId: 'free',
      tier: 1,
      monthlyCredits: 0,
      price: 0,
      perks: 'Events, Volunteer',
      billingPeriod: 'month',
      available: true,
      tiersAvailable: false,
    },
    {
      slug: 'wanderer',
      title: 'Wanderer',
      emoji: '👩🏽‍🌾',
      description: 'Stay in the loop and see if TDF is for you',
      priceId: 'price_1N1YLVE9CDXOM807XtNAwiBW',
      tier: 2,
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
      tier: 3,
      monthlyCredits: 1,
      price: 30,
      perks: 'Get 25% discount on stays by pre-paying every month',
      billingPeriod: 'monthly',
      available: true,
      tiersAvailable: true,
    },
    {
      slug: 'sheep',
      title: 'Sheep',
      emoji: '',
      description:
        'BE THE DREAM. MAKE TDF ONE OF YOUR HOMES. GET YOUR $TDF AND MAKE SURE TO GET YOUR CITIZENSHIP',
      priceId: '',
      tier: 4,
      monthlyCredits: 0,
      price: 0,
      perks: '',
      billingPeriod: '',
      available: false,
      tiersAvailable: false,
    },
  ],
};
