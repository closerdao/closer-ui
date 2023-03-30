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
};

export default config;
