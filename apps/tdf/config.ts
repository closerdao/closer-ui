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
  SUBSCRIPTION_PLANS: [
    {
      title: 'Free',
      description: 'Join out digital community for free',
      priceID: 'stripe price id',
      tier: 1,
      monthlyCredits: 0,
      price: 0,
      perks: ['Volonteer positions', 'Free e-book', 'Weekly newsletter'],
      billingPeriod: 'month',
    },
    {
      title: 'Plan 2',
      description: 'Unlock yor stay passes and join aour physical community',
      priceID: 'stripe price id',
      tier: 2,
      monthlyCredits: 100,
      price: 10,
      perks: ['Volonteer positions', 'Free e-book', 'Weekly newsletter'],
      billingPeriod: 'month',
    },
    {
      title: 'Another plan',
      description: 'Collect carrots and turn them into stay and event credits',
      priceID: 'stripe price id',
      tier: 3,
      monthlyCredits: 100,
      price: 30,
      perks: ['Volonteer positions', 'Free e-book', 'Weekly newsletter', 'Free stays', 'free events'],
      billingPeriod: 'month',
    },
  ],
};

export default config;
