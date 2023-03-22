export const closerConfig = {
  PLATFORM_NAME: 'Closer',
  GA_ANALYTICS: false,
  FB_DOMAIN_VERIFICATION: false,
  PLATFORM_LEGAL_ADDRESS: 'TBD, Portugal',
  DEFAULT_TITLE: 'The operating system for regenerative communities',
  SEMANTIC_URL: 'https://dev.closer.earth',
  TEAM_EMAIL: 'team@closer.earth',
  START_TIME: '2021-04-30T15:00:00.000Z',
  EXPOSE_STORE: true,
  NEWSLETTER: false,
  CACHE_DURATION: 6000000, // 1h
  LOGO_HEADER: '/images/logo.png',
  FACEBOOK_URL: 'https://instagram.com/closerearth',
  INSTAGRAM_URL: 'https://instagram.com/closerearth',
  DISCORD_URL: 'https://discord.gg/A5WFMwPRaK',
  TWITTER_URL: 'https://twitter.com/closerearth',
  TELEGRAM_URL: 'https://t.me/closerearth',
  GOVERNANCE_URL: 'https://snapshot.org/#/traditionaldreamfactory.eth',
  // Set which roles are permitted to do certain actions
  PERMISSIONS: {
    event: {
      create: 'event-creator',
    },
    booking: {
      create: 'member',
    },
  },
  ACCOMODATION_COST: [
    {
      name: 'Glamping',
      price: 1,
      iconPath: '/images/token-sale/tent-icon.svg',
    },
    {
      name: 'Van parking',
      price: 0.5,
      iconPath: '/images/token-sale/car-icon.svg',
    },
    {
      name: 'Outdoor Camping',
      price: 0.5,
      iconPath: '/images/token-sale/tent-icon.svg',
    },
    {
      name: 'Private suite',
      description: '*coming 2023*',
      price: 3,
      iconPath: '/images/token-sale/suite-icon.svg',
    },
  ],
  TOKEN_PRICE: 230.23,
  SOURCE_TOKEN: 'CEUR',
  COOKIE_TOKEN: 'closer-token',
};
