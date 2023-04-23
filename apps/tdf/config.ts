import { SubscriptionPlan, Subscriptions } from 'closer/types/subscriptions';

const config = {
  PORT: 14444,
  PLATFORM_NAME: 'Traditional Dream Factory',
  PLATFORM_LEGAL_ADDRESS: 'Cerca do Aviario, Abela, Portugal',
  DEFAULT_TITLE: 'Traditional Dream Factory',
  DEFAULT_DESCRIPTION: '',
  SEMANTIC_URL: 'https://traditionaldreamfactory.com',
  TEAM_EMAIL: 'traditionaldreamfactory@gmail.com',
  EXPOSE_STORE: true,
  CACHE_DURATION: 300000, // 5min
  INSTAGRAM_URL: 'https://instagram.com/traditionaldreamfactory',
  FACEBOOK_URL: 'https://www.facebook.com/oasaliving',
  TWITTER_URL: 'https://twitter.com/traditionaldreamfactory',
  LOGO_HEADER: '/images/logo.png',
  LOGO_FOOTER: '/images/logo.svg',
  PERMISSIONS: {
    event: {
      create: 'event-creator',
    },
  },
  COOKIE_TOKEN: 'tdf-token',

  SUBSCRIPTIONS: {
    config: {
      currency: 'EUR',
      symbol: '€',
    },
    plans: [
      {
        title: 'Explorer',
        emoji: '🕵🏽‍♀️',
        description: 'Optional subscription plan description',
        priceId: 'free',
        tier: 1,
        monthlyCredits: 0,
        price: 0,
        perks: [
          ' ✔ Access to Events',
          ' ✔ Access to Volunteering',
        ],
        billingPeriod: 'month',
      },
      {
        title: 'Wanderer',
        emoji: '👩🏽‍🌾',
        description: 'Unlock yor stay passes and join our physical community',
        priceId: 'price_1MqtoHGtt5D0VKR2Has7KE5X',
        tier: 2,
        monthlyCredits: 0,
        price: 10,
        perks: [
          ' ✔ Access to Events',
          ' ✔ Access to Volunteering',
          ' 🌟 Access To Stays',
          ' 🌟 Discord Community Access',
          ' 🌟 Access To Exclusive Events',
        ],
        billingPeriod: 'month',
      },

      {
        title: 'Pioneer',
        available: false,
        emoji: '👨🏽‍🚀',
        description:
          'Collect carrots and turn them into stay and event credits',
        priceId: 'price_1Mqtp0Gtt5D0VKR297NwmzIy',
        tier: 3,
        monthlyCredits: 3,
        price: 120,
        perks: [
          ' ✔ Access to Events',
          ' ✔ Access to Volunteering',
          ' ✔ Access To Stays',
          ' ✔ Discord Community Access',
          ' ✔ Access To Exclusive Events',
          ' 🌟 3 Stay credits per month',
          ' 🌟 Impact Reports',
        ],
        billingPeriod: 'month',
      },
    ] as SubscriptionPlan[],
  } as Subscriptions,
  STRIPE_CUSTOMER_PORTAL_URL:
    'https://billing.stripe.com/p/login/test_dR69Cl1Igat5dhK3cc',
};

export default config;
