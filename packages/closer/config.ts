import { ACCOUNTING_ENTITY_PRODUCT_SLUGS } from './constants/accountingEntities.constants';
import { ISO_COUNTRY_CODES_FOR_CONFIG } from './constants/countryLocales';
import { ConfigType } from './types/config';

export const CURRENCY_ISO_SYMBOL = {
  AED: 'AED',
  AFN: '؋',
  ALL: 'ALL',
  AMD: '֏',
  AOA: 'Kz',
  ARS: '$',
  AUD: '$',
  AWG: 'AWG',
  AZN: '₼',
  BAM: 'KM',
  BBD: '$',
  BDT: '৳',
  BHD: 'BHD',
  BIF: 'BIF',
  BMD: '$',
  BND: '$',
  BOB: 'Bs',
  BOV: 'BOV',
  BRL: 'R$',
  BSD: '$',
  BTN: 'BTN',
  BWP: 'P',
  BYN: 'BYN',
  BZD: '$',
  CAD: '$',
  CDF: 'CDF',
  CHE: 'CHE',
  CHF: 'CHF',
  CHW: 'CHW',
  CLF: 'CLF',
  CLP: '$',
  CNY: '¥',
  COP: '$',
  COU: 'COU',
  CRC: '₡',
  CUC: '$',
  CUP: '$',
  CVE: 'CVE',
  CZK: 'Kč',
  DJF: 'DJF',
  DKK: 'kr',
  DOP: '$',
  DZD: 'DZD',
  EGP: 'E£',
  ERN: 'ERN',
  ETB: 'ETB',
  EUR: '€',
  FJD: '$',
  FKP: '£',
  GBP: '£',
  GEL: '₾',
  GHS: 'GH₵',
  GIP: '£',
  GMD: 'GMD',
  GNF: 'FG',
  GTQ: 'Q',
  GYD: '$',
  HKD: '$',
  HNL: 'L',
  HTG: 'HTG',
  HUF: 'Ft',
  IDR: 'Rp',
  ILS: '₪',
  INR: '₹',
  IQD: 'IQD',
  IRR: 'IRR',
  ISK: 'kr',
  JMD: '$',
  JOD: 'JOD',
  JPY: '¥',
  KES: 'KES',
  KGS: '⃀',
  KHR: '៛',
  KMF: 'CF',
  KPW: '₩',
  KRW: '₩',
  KWD: 'KWD',
  KYD: '$',
  KZT: '₸',
  LAK: '₭',
  LBP: 'L£',
  LKR: 'Rs',
  LRD: '$',
  LSL: 'LSL',
  LYD: 'LYD',
  MAD: 'MAD',
  MDL: 'MDL',
  MGA: 'Ar',
  MKD: 'MKD',
  MMK: 'K',
  MNT: '₮',
  MOP: 'MOP',
  MRU: 'MRU',
  MUR: 'Rs',
  MVR: 'MVR',
  MWK: 'MWK',
  MXN: '$',
  MXV: 'MXV',
  MYR: 'RM',
  MZN: 'MZN',
  NAD: '$',
  NGN: '₦',
  NIO: 'C$',
  NOK: 'kr',
  NPR: 'Rs',
  NZD: '$',
  OMR: 'OMR',
  PAB: 'PAB',
  PEN: 'PEN',
  PGK: 'PGK',
  PHP: '₱',
  PKR: 'Rs',
  PLN: 'zł',
  PYG: '₲',
  QAR: 'QAR',
  RON: 'lei',
  RSD: 'RSD',
  RUB: '₽',
  RWF: 'RF',
  SAR: 'SAR',
  SBD: '$',
  SCR: 'SCR',
  SDG: 'SDG',
  SEK: 'kr',
  SGD: '$',
  SHP: '£',
  SLE: 'SLE',
  SOS: 'SOS',
  SRD: '$',
  SSP: '£',
  STN: 'Db',
  SVC: 'SVC',
  SYP: '£',
  SZL: 'SZL',
  THB: '฿',
  TJS: 'TJS',
  TMT: 'TMT',
  TND: 'TND',
  TOP: 'T$',
  TRY: '₺',
  TTD: '$',
  TWD: '$',
  TZS: 'TZS',
  UAH: '₴',
  UGX: 'UGX',
  USD: '$',
  USN: 'USN',
  UYI: 'UYI',
  UYU: '$',
  UZS: 'UZS',
  VED: 'VED',
  VEF: 'Bs',
  VND: '₫',
  VUV: 'VUV',
  WST: 'WST',
  XAF: 'FCFA',
  XCD: '$',
  XCG: 'Cg.',
  XDR: 'XDR',
  XOF: 'F CFA',
  XPF: 'CFPF',
  XSU: 'XSU',
  XUA: 'XUA',
  YER: 'YER',
  ZAR: 'R',
  ZMW: 'ZK',
  ZWL: 'ZWL',
} as const;

export type Iso4217CurrencyCode = keyof typeof CURRENCY_ISO_SYMBOL;

export const ISO_4217_CURRENCY_CODES = Object.keys(
  CURRENCY_ISO_SYMBOL,
).sort() as Iso4217CurrencyCode[];

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
      minVouches: {
        type: 'number',
        default: 3,
      },
      minVouchingStayDuration: {
        type: 'number',
        default: 14,
      },
      tokensRequired: {
        type: 'number',
        default: 30,
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
      showBadges: {
        type: 'boolean',
        default: true,
      },
      elements: {
        type: [
          {
            slug: 'text',
            title: 'text',
            emoji: 'text',
            badge: 'image',
            description: 'text',
            price: 'number',
            billingPeriod: 'text',
            monthlyCredits: 'number',
            tier: 'number',
            perks: 'long-text',
            available: 'boolean',
            tiersAvailable: 'boolean',
            priceId: 'readonly-text',
            productId: 'readonly-text',
          },
        ],
        default: [
          {
            slug: '',
            title: '',
            emoji: '',
            badge: '',
            description: '',
            price: 0,
            billingPeriod: 'month',
            monthlyCredits: 0,
            tier: 1,
            perks: '',
            available: true,
            tiersAvailable: false,
            priceId: '',
            productId: '',
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
        // No default milestones: campaign content is village-specific (#946).
        default: [],
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
        // No default packages: the old defaults carried TDF marketing copy and
        // a live Stripe price id — a fresh village must never render another
        // village's checkout (#946).
        default: [],
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
      // Identity/branding fields below deliberately carry no `default` —
      // getDefaultConfigValue synthesizes a neutral type-zero ('' / 0 / []) so
      // an unconfigured village never inherits another village's identity
      // (#946). Policy defaults (enabled flags, rates, durations) stay.
      appName: {
        type: 'text',
      },
      logoHeader: {
        type: 'image',
      },
      favicon: {
        type: 'image',
        default: '',
      },
      platformName: {
        type: 'text',
      },
      semanticUrl: {
        type: 'text',
      },
      platformLegalAddress: {
        type: 'text',
      },
      legalEntityName: {
        type: 'text',
      },
      legalStreetAddress: {
        type: 'text',
      },
      legalAddressLine2: {
        type: 'text',
        default: '',
      },
      legalPostalCode: {
        type: 'text',
      },
      legalCity: {
        type: 'text',
      },
      legalCountry: {
        type: 'text',
      },
      country: {
        type: 'select',
        enum: [...ISO_COUNTRY_CODES_FOR_CONFIG],
      },
      teamEmail: {
        type: 'text',
      },
      instagramUrl: {
        type: 'text',
      },
      facebookUrl: {
        type: 'text',
      },
      twitterUrl: {
        type: 'text',
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
      },
      locationLon: {
        type: 'text',
      },
      visitorsGuide: {
        type: 'text',
      },
      facebookPixelId: {
        type: 'text',
        default: '',
      },
      faqsGoogleSheetId: {
        type: 'text',
      },
      minVouchingStayDuration: {
        type: 'number',
        default: 14,
      },
      expenseCategories: {
        type: 'text',
      },
      primaryCtaVisitor: {
        type: 'select',
        enum: [
          'none',
          'login',
          'bookings',
          'learningHub',
          'events',
          'application',
          'custom',
        ],
        default: 'login',
      },
      primaryCtaMember: {
        type: 'select',
        enum: [
          'none',
          'bookings',
          'learningHub',
          'events',
          'application',
          'custom',
        ],
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
    slug: 'applications',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
      /** Label of the navigation button that opens the modal. */
      ctaText: {
        type: 'text',
        default: 'Apply now',
      },
      eyebrow: {
        type: 'text',
        default: 'Get started',
      },
      title: {
        type: 'text',
        default: 'Apply to join',
      },
      description: {
        type: 'text',
        default: 'Tell us a little about yourself and we will get back to you.',
      },
      submitButtonText: {
        type: 'text',
        default: 'Send application',
      },
      disclaimer: {
        type: 'text',
        default: '',
      },
      successTitle: {
        type: 'text',
        default: 'Thank you!',
      },
      successMessage: {
        type: 'text',
        default: 'We read every application. Expect a reply within a few days.',
      },
      /**
       * The questions the applicant is asked. `name` is the key the answer is
       * stored under — `name`, `email` and `phone` map to the columns of the
       * application model, anything else lands on `application.fields`.
       */
      fields: {
        type: [
          {
            name: 'text',
            label: 'text',
            type: {
              type: 'select',
              enum: [
                'text',
                'longtext',
                'email',
                'phone',
                'number',
                'url',
                'date',
                'select',
                'country',
              ],
            },
            options: 'text',
            placeholder: 'text',
            required: 'boolean',
          },
        ],
        default: [
          {
            name: 'name',
            label: 'Your name',
            type: 'text',
            options: '',
            placeholder: 'Jane Doe',
            required: true,
          },
          {
            name: 'email',
            label: 'Your email',
            type: 'email',
            options: '',
            placeholder: 'jane@example.com',
            required: true,
          },
          {
            name: 'communitySize',
            label: 'How big is your community?',
            type: 'select',
            options: '1-15 people, 15-50 people, 51-150 people, 150+ people',
            placeholder: '',
            required: false,
          },
        ],
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
      fiatCur: {
        type: 'select',
        enum: [...ISO_4217_CURRENCY_CODES],
        default: 'EUR',
      },
      utilityFiatCur: {
        type: 'select',
        enum: [...ISO_4217_CURRENCY_CODES],
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
    // Was `web3`; stored config documents still use that slug, so
    // `getLegacyTokenConfigValue` reads through to it. The financed-purchase
    // terms live here rather than on `citizenship`: financing tokens and
    // applying for citizenship are separate flows, and either can happen
    // without the other.
    slug: 'token',
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
      },
      maxSupply: {
        type: 'number',
        default: 0,
      },
      downPaymentPercent: {
        type: 'number',
        default: 10,
      },
      // Neutral by default: platforms that have not opted into the new section
      // yet fall back to these, and a 0% modifier keeps the financed price
      // identical to the spot token price.
      tokenPriceModifierPercent: {
        type: 'number',
        default: 0,
      },
      // Comma separated list of the repayment terms buyers can pick from. A
      // single entry hides the picker and just uses that term.
      financingDurationsMonths: {
        type: 'text',
        default: '36',
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
            iban: 'text',
            address: 'text',
            accountingDescription: 'text',
            products: {
              type: 'multiselect',
              enum: [...ACCOUNTING_ENTITY_PRODUCT_SLUGS],
            },
          },
        ],
        default: [
          {
            legalName: '',
            taxNumber: '',
            iban: '',
            address: '',
            products: [],
            accountingDescription: '',
          },
        ],
      },
      vatByProductType: {
        type: 'vat-by-product-type',
        default: {},
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
    slug: 'cohousing',
    value: {
      enabled: {
        type: 'boolean',
        default: false,
      },
    },
  },
  {
    slug: 'engagement',
    value: {
      enabled: {
        type: 'boolean',
        default: true,
      },
      ctaLink: {
        type: 'text',
        default: '',
      },
      ctaText: {
        type: 'text',
        default: '',
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
