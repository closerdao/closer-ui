const config = {
  PORT: 14444,
  APP_NAME: 'foz',
  PLATFORM_NAME: 'Foz',
  PLATFORM_LEGAL_ADDRESS: 'Foz da Cova full address',
  DEFAULT_TITLE: 'Foz',
  DEFAULT_DESCRIPTION: '',
  SEMANTIC_URL: 'https://fozdacova.world/',
  TEAM_EMAIL: 'fozdacova@gmail.com',
  EXPOSE_STORE: true,
  CACHE_DURATION: 300000, // 5min
  INSTAGRAM_URL: 'https://www.instagram.com/explore/tags/fozdacova/',
  FACEBOOK_URL: 'https://www.facebook.com/',
  TWITTER_URL: 'https://twitter.com/',
  LOGO_HEADER: '',
  LOGO_FOOTER: '/images/logo.svg',
  LOCATION_COORDINATES: { lat: 40.112851842555756, lng: -8.015835544223801 },
  PERMISSIONS: {
    event: {
      create: 'event-creator',
    },
  },
  VISITORS_GUIDE:
    'https://docs.google.com/document/d/198vWYEQCC1lELQa8f76Jcw3l3UDiPcBKt04PGFKnUvg/edit',

  STRIPE_CUSTOMER_PORTAL_URL:
    'https://billing.stripe.com/p/login/test_dR69Cl1Igat5dhK3cc',

  TOKEN_PRICE: 230.23,
  SOURCE_TOKEN: 'CEUR',
  STAY_BOOKING_ALLOWED_PLANS: ['wanderer', 'pioneer', 'sheep'],
  MIN_INSTANT_BOOKING_ALLOWED_PLAN: 'wanderer',
  FACEBOOK_PIXEL_ID: '',
  FAQS_GOOGLE_SHEET_ID: '1dlaVEfLwHAbXCwoiDGzUd3w8d7YYnGl5dbPDINKmRUg',
};

export default config;
