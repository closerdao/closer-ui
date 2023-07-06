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
  VISITORS_GUIDE:
    'https://docs.google.com/document/d/198vWYEQCC1lELQa8f76Jcw3l3UDiPcBKt04PGFKnUvg/edit',

  STRIPE_CUSTOMER_PORTAL_URL:
    'https://billing.stripe.com/p/login/test_dR69Cl1Igat5dhK3cc',
  
    // ACCOMODATION_COST: [
    //   {
    //     name: 'Glamping',
    //     price: 1,
    //     iconPath: '/images/token-sale/tent-icon.svg',
    //   },
    //   {
    //     name: 'Van parking',
    //     price: 0.5,
    //     iconPath: '/images/token-sale/car-icon.svg',
    //   },
    //   {
    //     name: 'Outdoor Camping',
    //     price: 0.5,
    //     iconPath: '/images/token-sale/tent-icon.svg',
    //   },
    //   {
    //     name: 'Private suite',
    //     description: '*coming 2023*',
    //     price: 3,
    //     iconPath: '/images/token-sale/suite-icon.svg',
    //   },
    // ],
    TOKEN_PRICE: 230.23,
    SOURCE_TOKEN: 'CEUR',
  STAY_BOOKING_ALLOWED_PLANS: ['wanderer', 'pioneer', 'sheep'],
  MIN_INSTANT_BOOKING_ALLOWED_PLAN: 'wanderer',
  FACEBOOK_PIXEL_ID: '761004479106346',
};

export default config;
