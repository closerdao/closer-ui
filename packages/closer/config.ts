import { ConfigType } from './types/config';

export const closerConfig = {
  PLATFORM_NAME: 'Closer',
  APP_NAME: 'closer',
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

  TOKEN_PRICE: 230.23,
  SOURCE_TOKEN: 'CEUR',
};

export const configDescription: ConfigType[] = [
  /* in closer repo
    These are all the configs that exist within the platform
     */
  {
    slug: 'citizenship',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      isSpaceHostVouchRequired: {
        type: 'boolean',
        default: true,
      },
      downPaymentPercent: {
        type: 'number',
        default: 10,
      },
      tokenPriceModifierPercent: {
        type: 'number',
        default: 5,
      },
      minVouches: {
        type: 'number',
        default: 3,
      },
      minVouchingStayDuration: {
        type: 'number',
        default: 14,
      },
    },
  },
  {
    slug: 'booking',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      foodOptionEnabled: {
        type: 'boolean',
        default: false,
      },
      utilityOptionEnabled: {
        type: 'boolean',
        default: false,
      },
      utilityFiatVal: {
        type: 'number',
        default: 2,
      },
      utilityFiatCur: {
        type: 'text',
        default: 'EUR',
      },
      utilityDayFiatVal: {
        type: 'number',
        default: 3,
      },
      utilityTokenVal: {
        type: 'number',
        default: 0.01,
      },
      utilityTokenCur: {
        type: 'text',
        default: 'ETH',
      },
      checkinTime: {
        type: 'number',
        default: 14,
      },
      checkoutTime: {
        type: 'number',
        default: 11,
      },
      maxDuration: {
        type: 'number',
        default: 180,
      },
      minDuration: {
        type: 'number',
        default: 1,
      },
      maxBookingHorizon: {
        type: 'number',
        default: 180,
      },
      volunteerCommitment: {
        type: 'text',
        default: '4h/day',
      },
      memberMaxDuration: {
        type: 'number',
        default: 180,
      },
      memberMaxBookingHorizon: {
        type: 'number',
        default: 365,
      },
      discountsDaily: {
        type: 'number',
        default: 0,
      },
      discountsWeekly: {
        type: 'number',
        default: 0.33,
      },
      discountsMonthly: {
        type: 'number',
        default: 0.66,
      },
      seasonsHighStart: {
        type: 'text',
        default: 'April',
      },
      seasonsHighEnd: {
        type: 'text',
        default: 'November',
      },
      seasonsHighModifier: {
        type: 'number',
        default: 1.3,
      },
      cancellationPolicyLastday: {
        type: 'number',
        default: 0.5,
      },
      cancellationPolicyLastweek: {
        type: 'number',
        default: 0.5,
      },
      cancellationPolicyLastmonth: {
        type: 'number',
        default: 0.75,
      },
      cancellationPolicyDefault: {
        type: 'number',
        default: 1,
      },
      pickUpEnabled: {
        type: 'boolean',
        default: false,
      },
    },
  },
  {
    slug: 'subscriptions',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      elements: {
        type: [
          {
            slug: 'text',
            title: 'text',
            emoji: 'text',
            description: 'text',
            priceId: 'text',
            tier: 'number',
            monthlyCredits: 'number',
            price: 'number',
            perks: 'text',
            billingPeriod: 'text',
            available: 'boolean',
            tiersAvailable: 'boolean',
          },
        ],
        default: [
          {
            slug: '',
            title: '',
            emoji: '',
            description: '',
            priceId: '',
            tier: 0,
            monthlyCredits: 0,
            price: 0,
            perks: '',
            billingPeriod: '',
            available: true,
            tiersAvailable: false,
          },
        ],
      },
    },
  },
  {
    slug: 'booking-rules',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      elements: {
        type: [
          {
            title: 'text',
            description: 'text',
          },
        ],
        default: [
          {
            title: '',
            description: '',
          },
        ],
      },
    },
  },
  
  {
    slug: 'volunteering',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      volunteeringMinStay: {
        type: 'number',
        default: 14,
      },
      residenceMinStay: {
        type: 'number',
        default: 30,
      },
      residenceTimeFrame: {
        type: 'text',
        default: 'October 2024 - December 2025',
      },
      skills: {
        type: 'text',
        default:
          'Gardening & Permaculture, Carpentry & Construction, Hospitality & Space Care, Cooking, Photography',
      },
      diet: {
        type: 'text',
        default: 'Vegetarian, Vegan, Gluten-free, Dairy-free, Non-Vegetarian',
      },
      shouldResidentsPayUtilities: {
        type: 'boolean',
        default: true,
      },
    },
  },
  {
    slug: 'fundraiser',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      creditPrice30Credits: {
        type: 'number',
        default: '50',
      },
      creditPrice90Credits: {
        type: 'number',
        default: '30',
      },
      creditPrice180Credits: {
        type: 'number',
        default: '20',
      },

      videoId: {
        type: 'text',
        default: 'btBqOboLdOg',
      },
      wandererUrl: {
        type: 'text',
        default:
          '/subscriptions/checkout?priceId=price_1N1YLVE9CDXOM807XtNAwiBW',
      },
      pioneerUrl: {
        type: 'text',
        default:
          '/subscriptions/checkout?priceId=price_1O7ddSE9CDXOM807UGJZ5TEP',
      },
      oneMonthSharedUrl: {
        type: 'text',
        default: 'https://buy.stripe.com/9AQcPH10w8rh0485ko',
      },
      oneMonthPrivateUrl: {
        type: 'text',
        default: 'https://buy.stripe.com/eVa7vneRm8rh048aEH',
      },
      buy5TdfUrl: {
        type: 'text',
        default: '/token/checkout?tokens=5',
      },
      buy10TdfUrl: {
        type: 'text',
        default: '/token/checkout?tokens=10',
      },
      hostEventUrl: {
        type: 'text',
        default: 'mailto: space@traditionaldreamfactory.com',
      },
    },
  },
  {
    slug: 'general',
    value: {
      enabled: {
        type: 'boolean',
        default: true,
      },
      timeZone: {
        type: 'select',
        enum: [
          'UTC',
          'America/New_York',
          'America/Chicago',
          'America/Denver',
          'America/Los_Angeles',
          'America/Anchorage',
          'America/Honolulu',
          'Asia/Kolkata',
          'Asia/Shanghai',
          'Asia/Tokyo',
          'Asia/Dubai',
          'Asia/Bangkok',
          'Europe/London',
          'Europe/Lisbon',
          'Europe/Berlin',
          'Europe/Paris',
          'Europe/Moscow',
          'Australia/Sydney',
          'Australia/Perth',
          'Africa/Cairo',
          'Africa/Johannesburg',
        ],
        default: 'Europe/Lisbon',
      },
      appName: {
        type: 'text',
        default: 'tdf',
      },
      platformName: {
        type: 'text',
        default: 'Traditional Dream Factory',
      },
      semanticUrl: {
        type: 'text',
        default: 'traditionaldreamfactory.com',
      },
      platformLegalAddress: {
        type: 'text',
        default:
          'Fábrica de Sonhos Tradicional, 7540-011, Abela, Santiago do Cacém, Portugal',
      },
      teamEmail: {
        type: 'text',
        default: 'traditionaldreamfactory@gmail.com',
      },
      instagramUrl: {
        type: 'text',
        default: 'https://instagram.com/traditionaldreamfactory',
      },
      facebookUrl: {
        type: 'text',
        default: 'https://www.facebook.com/oasaliving',
      },
      twitterUrl: {
        type: 'text',
        default: 'https://twitter.com/traditionaldreamfactory',
      },
      locationLat: {
        type: 'text',
        default: '38.003164469592555',
      },
      locationLon: {
        type: 'text',
        default: '-8.55915483117878',
      },
      visitorsGuide: {
        type: 'text',
        default:
          'https://docs.google.com/document/d/198vWYEQCC1lELQa8f76Jcw3l3UDiPcBKt04PGFKnUvg/edit',
      },
      facebookPixelId: {
        type: 'text',
        default: '761004479106346',
      },
      faqsGoogleSheetId: {
        type: 'text',
        default: '1dlaVEfLwHAbXCwoiDGzUd3w8d7YYnGl5dbPDINKmRUg',
      },
      minVouchingStayDuration: {
        type: 'number',
        default: 14,
      },
    },
  },
  {
    slug: 'payment',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      cardPayment: {
        type: 'boolean',
        default: true,
      },
      cryptoPayment: {
        type: 'boolean',
        default: false,
      },
      polygonWalletAddress: {
        type: 'text',
        default: '',
      },
      ethereumWalletAddress: {
        type: 'text',
        default: '',
      },
      vatRate: {
        type: 'number',
        default: 0.23,
      },
    },
  },
  {
    slug: 'learningHub',
    value: {
      enabled: {
        type: 'boolean',
        default: true,
      },
    },
  },
  {
    slug: 'affiliate',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      tokenSaleCommissionPercent: {
        type: 'number',
        default: 3,
      },
      financedTokenSaleCommissionPercent: {
        type: 'number',
        default: 3,
      },
      subscriptionCommissionPercent: {
        type: 'number',
        default: 30,
      },
      staysCommissionPercent: {
        type: 'number',
        default: 10,
      },
      eventsCommissionPercent: {
        type: 'number',
        default: 10,
      },
      productsCommissionPercent: {
        type: 'number',
        default: 10,
      },
    },
  },
  {
    slug: 'webinar',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      isDayOfMonth: {
        type: 'boolean',
        default: false,
      },
      dayOfMonth: {
        type: 'number',
        default: 1,
      },
      weekDay: {
        type: 'select',
        enum: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
      },
      weekPosition: {
        type: 'select',
        enum: ['First', 'Second', 'Third', 'Fourth', 'Last'],
      },
      time: {
        type: 'time',
        default: '10:00',
      },
    },
  },
];
