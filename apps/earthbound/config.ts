const config = {
  platformAllowedConfigs: [
    'booking',
    'general',
    'booking-rules',
    'payment',
    'emails',
    'volunteering',

    // 'learningHub',
    // 'subscriptions',
  ],
  PORT: 14444,
  APP_NAME: 'earthbound',
  DEFAULT_TIMEZONE: 'Europe/Stockholm',

  EXPOSE_STORE: true,
  CACHE_DURATION: 300000, // 5min
  LOGO_HEADER: '/images/earthbound-logo.png',
  PERMISSIONS: {
    event: {
      create: 'event-creator',
    },
  },

  STRIPE_CUSTOMER_PORTAL_URL:
    'https://billing.stripe.com/p/login/test_dR69Cl1Igat5dhK3cc',

  TOKEN_PRICE: 230.23,
  SOURCE_TOKEN: 'CEUR',
  STAY_BOOKING_ALLOWED_PLANS: ['wanderer', 'pioneer', 'sheep'],
  MIN_INSTANT_BOOKING_ALLOWED_PLAN: 'wanderer',
};

export default config;
