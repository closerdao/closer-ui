module.exports = {
  PLATFORM: 'closer',
  PLATFORM_NAME: 'Closer',
  GA_ANALYTICS: false,
  FB_DOMAIN_VERIFICATION: false,
  PLATFORM_LEGAL_ADDRESS: 'TBD, Portugal',
  DEFAULT_TITLE: 'Closer: the operating system for sovereign communities',
  DEFAULT_DESCRIPTION: '',
  SEMANTIC_URL: 'https://dev.closer.earth',
  TEAM_EMAIL: 'team@closer.earth',
  START_TIME: '2021-04-30T15:00:00.000Z',
  EXPOSE_STORE: true,
  // API_URL: 'http://localhost:4002',
  API_URL: 'https://api.oasa.co',
  CDN_URL: 'https://cdn.oasa.co/photo/',
  NEWSLETTER: false,
  LOG_REQUESTS: false,
  CACHE_DURATION: 6000000, // 1h
  STRIPE_TEST_KEY: 'pk_test_51Gv17cGtt5D0VKR2Gt2RUVIDfrHRGJTfMSwRFpdbF5B4VfZ2zFOxM62ckAj4aQN5q6mDexpjZAqQKLpKdmwcnQfJ00sJwfbVWK',
  STRIPE_PUB_KEY: 'pk_live_YxOUUf7iOvQj104TG4JyWMAE003w80ISH6',
  LOGO_HEADER: '/images/logo.png',
  LOGO_WIDTH: undefined,
  REGISTRATION_MODE: 'open', // curated, paid, open
  // LOGO_FOOTER: "",
  FACEBOOK_URL: 'https://instagram.com/closerearth',
  INSTAGRAM_URL: 'https://instagram.com/closerearth',
  DISCORD_URL: 'https://discord.gg/A5WFMwPRaK',
  TWITTER_URL: 'https://twitter.com/closerearth',
  TELEGRAM_URL: 'https://t.me/closerearth',
  FEATURES: {
    events: true,
    booking: true,
    bookingVolunteers: true
  },
  // Set which roles are permitted to do certain actions
  PERMISSIONS: {
    event: {
      create: 'event-creator'
    },
    booking: {
      create: 'member'
    }
  },
  SIGNUP_FIELDS: [
    {
      name: 'community',
      label: 'Tell us about your community',
      placeholder: 'A DAO for regenerative coffee farmers'
    }
  ],
}
