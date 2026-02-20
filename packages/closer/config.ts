import { ConfigType } from './types/config';

export const closerConfig = {
  PLATFORM_NAME: 'Closer',
  APP_NAME: 'closer',
  GA_ANALYTICS: false,
  FB_DOMAIN_VERIFICATION: false,
  PLATFORM_LEGAL_ADDRESS:
    'OASA Verein, Industriestrasse 47, c/o Juris Services AG, 6300 Zug, Switzerland',
  DEFAULT_TITLE: 'The operating system for regenerative communities',
  SEMANTIC_URL: 'https://dev.closer.earth',
  TEAM_EMAIL: 'team@closer.earth',
  START_TIME: '2021-04-30T15:00:00.000Z',
  EXPOSE_STORE: true,
  NEWSLETTER: false,
  CACHE_DURATION: 6000000, // 1h
  FACEBOOK_URL: 'https://instagram.com/closerearth',
  INSTAGRAM_URL: 'https://instagram.com/closerearth',
  DISCORD_URL: 'https://discord.gg/A5WFMwPRaK',
  TWITTER_URL: 'https://twitter.com/closerearth',
  TELEGRAM_URL: 'https://t.me/closerearth',
  GOVERNANCE_URL: 'https://snapshot.org/#/traditionaldreamfactory.eth',

  TOKEN_PRICE: 259.44,
  SOURCE_TOKEN: 'EURm',
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
      memberMinDuration: {
        type: 'number',
        default: 3,
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
      chatLink: {
        type: 'text',
        default: '',
      },
      friendsBookingMaxGuests: {
        type: 'number',
        default: 1,
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
      amountRaisedPreCampaign: {
        type: 'number',
        default: 0,
      },
      loansCollectedTotal: {
        type: 'number',
        default: 0,
      },
      campaignVideo: {
        type: 'text',
        default: '',
      },
      campaignTitle: {
        type: 'text',
        default: 'Invest',
      },
      creditPricePerUnit: {
        type: 'number',
        default: 30,
      },
      adjustmentsLabel: {
        type: 'text',
        default: 'Commitments',
      },
      milestones: {
        type: [
          {
            id: 'text',
            title: 'text',
            description: 'text',
            items: 'long-text',
            goal: 'number',
            start: 'text',
            end: 'text',
            ctaUrl: 'text',
          },
        ],
        default: [
          {
            id: 'milestone-1',
            title: 'Buildings option exercise, architecture & engineering fees',
            description:
              'Execute secured option to buy signed in 2023 at €200k (asset expected to appraise at €1M).',
            items: '',
            goal: 236000,
            start: '2025-12-01',
            end: '2026-03-31',
          },
          {
            id: 'milestone-2',
            title: 'Solar roofs, pool completion',
            description:
              'Solar prices are raising. We have a special deal to buy panels at cost, and will stack functionality by turning our panels into an extra waterproofing layer over our roofs to avoid further rain dammage next year. Plus it includes €600+ energy income in the future as we establish a microgrid in Abela.',
            items: '',
            goal: 150000,
            start: '2026-03-31',
            end: '2026-06-01',
          },
          {
            id: 'milestone-3',
            title:
              'Industrial kitchen, 30 seat restaurant & 4 creative studios',
            description:
              'This milestone completes our legal restaurant with 30 seat, a core business driver for our operation - alongside 4 studios with natural light and workspace for artists-in-residence and workshops. We expect some bank or grant co-financing for this step.',
            items: '',
            goal: 150000,
            start: '2026-06-01',
            end: '2026-08-01',
          },
          {
            id: 'milestone-4',
            title: 'Co-living building',
            description:
              'Complete the 12 en-suite rooms, dorm, and 3-bedroom house for full capacity as a licensed coliving destination. This is the community co-budget - for a €750k build that we aim to finance via bank or grants.',
            items: '',
            goal: 150000,
            start: '2026-08-01',
            end: '2026-12-01',
          },
        ],
      },
      packages: {
        type: [
          {
            type: {
              type: 'select',
              enum: ['tokens', 'loan', 'credits', 'subscribe'],
            },
            title: 'text',
            description: 'text',
            tokens: 'number',
            bonus: 'text',
            minAmount: 'text',
            credits: 'number',
            subscribeUrl: 'text',
            ctaUrl: 'text',
          },
        ],
        default: [
          {
            type: 'tokens',
            title: 'First Step',
            description: 'Start your regenerative journey with just 1 token.',
            tokens: 1,
            bonus: '',
            minAmount: '',
            credits: 0,
            subscribeUrl: '',
          },
          {
            type: 'tokens',
            title: 'Supporter',
            description:
              'Support TDF and get meaningful access with 10 tokens.',
            tokens: 10,
            bonus: 'Free weekend stay',
            minAmount: '',
            credits: 0,
            subscribeUrl: '',
          },
          {
            type: 'tokens',
            title: 'Aspiring Citizen',
            description:
              'Our most popular package - commit to 30 nights/year and unlock citizenship path.',
            tokens: 30,
            bonus: 'Free permaculture course',
            minAmount: '',
            credits: 0,
            subscribeUrl: '',
          },
          {
            type: 'loan',
            title: 'Private Lender',
            description:
              'Provide a loan directly to TDF with attractive terms and real estate security.',
            tokens: 0,
            bonus: 'Annual investor gathering',
            minAmount: '50K',
            credits: 0,
            subscribeUrl: '',
          },
          {
            type: 'credits',
            title: 'Pre-book 1 month stay',
            description: 'Pre-purchase 30 credits for a one-month stay.',
            tokens: 0,
            bonus: '',
            minAmount: '',
            credits: 30,
            subscribeUrl: '',
          },
          {
            type: 'subscribe',
            title: 'Monthly Support',
            description: 'Subscribe to support us monthly.',
            tokens: 0,
            bonus: '',
            minAmount: '',
            credits: 0,
            subscribeUrl:
              '/subscriptions/checkout?priceId=price_1N1YLVE9CDXOM807XtNAwiBW',
          },
        ],
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
      logoHeader: {
        type: 'image',
        default: '/images/logo.png',
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
      legalEntityName: {
        type: 'text',
        default: 'Traditional Dream Factory',
      },
      legalStreetAddress: {
        type: 'text',
        default: 'Fábrica de Sonhos Tradicional',
      },
      legalAddressLine2: {
        type: 'text',
        default: '',
      },
      legalPostalCode: {
        type: 'text',
        default: '7540-011',
      },
      legalCity: {
        type: 'text',
        default: 'Abela, Santiago do Cacém',
      },
      legalCountry: {
        type: 'text',
        default: 'Portugal',
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
      telegramUrl: {
        type: 'text',
        default: '',
      },
      discordUrl: {
        type: 'text',
        default: '',
      },
      governanceUrl: {
        type: 'text',
        default: '',
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
      expenseCategories: {
        type: 'text',
        default:
          'Legal & business, Land Infrastructure, Forestry, Tools & Machines, Maintenance, Operations, Energy, Factory, Miscellaneous, Lease, Equipment, Furniture, Water, Buildings Renovations, Shares, Experiment, Donations, Food, Salaries, Events, Stays, Internal op',
      },
      primaryCtaVisitor: {
        type: 'select',
        enum: ['none', 'login', 'bookings', 'learningHub', 'events', 'custom'],
        default: 'login',
      },
      primaryCtaMember: {
        type: 'select',
        enum: ['none', 'bookings', 'learningHub', 'events', 'custom'],
        default: 'bookings',
      },
      primaryCtaCustomUrl: {
        type: 'text',
        default: '',
      },
      primaryCtaCustomText: {
        type: 'text',
        default: '',
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
      utilityFiatCur: {
        type: 'text',
        default: 'EUR',
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
    slug: 'web3',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      reserveToken: {
        type: 'text',
        default: 'cEUR',
      },
      gasToken: {
        type: 'text',
        default: 'CELO',
      },
      bookingToken: {
        type: 'text',
        default: 'TDF',
      },
      maxSupply: {
        type: 'number',
        default: 0,
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
  {
    slug: 'newsletter',
    value: {
      enabled: {
        type: 'boolean',
        default: true,
      },
      substackUrl: {
        type: 'text',
        default: '',
      },
    },
  },
  {
    slug: 'photo-gallery',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      photoIds: {
        type: ['text'],
        default: [],
      },
    },
  },
  {
    slug: 'accounting-entities',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      elements: {
        type: [
          {
            legalName: 'text',
            taxNumber: 'text',
            address: 'text',
            products: {
              type: 'multiselect',
              enum: [
                'accommodations',
                'events',
                'subscriptions',
                'tokens',
                'food',
                'products',
                'payment-link',
                'terminal',
                'expenses',
              ],
            },
          },
        ],
        default: [
          {
            legalName: '',
            taxNumber: '',
            address: '',
            products: [],
          },
        ],
      },
    },
  },
  {
    slug: 'governance',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      quorumPercent: {
        type: 'number',
        default: 10,
      },
    },
  },
  {
    slug: 'events',
    value: {
      enabled: {
        type: 'boolean',
        default: true,
      },
    },
  },
  {
    slug: 'airdrop',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      description: {
        type: 'text',
        default:
          'Reward community members with token airdrops for participation.',
      },
    },
  },
  {
    slug: 'blog',
    value: {
      enabled: {
        type: 'boolean',
        default: true,
      },
    },
  },
  {
    slug: 'courses',
    value: {
      enabled: {
        type: 'boolean',
        default: true,
      },
    },
  },
  {
    slug: 'referral',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
    },
  },
  {
    slug: 'community',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
    },
  },
  {
    slug: 'roles',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
    },
  },
];
