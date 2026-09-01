import { ACCOUNTING_ENTITY_PRODUCT_SLUGS } from './constants/accountingEntities.constants';
import { ISO_COUNTRY_CODES_FOR_CONFIG } from './constants/countryLocales';
import {
  THEME_COLOR_TOKENS,
  THEME_DEFAULTS,
  THEME_FONTS,
  THEME_FONT_SLOTS,
  colorTokenConfigKey,
  fontSlotConfigKey,
} from './theming';
import { ConfigType } from './types/config';

const THEME_FONT_IDS = THEME_FONTS.map((font) => font.id);

/**
 * Per-token colour overrides, one field per token the compiled theme declares.
 * They default to '' meaning "use the value derived from the source colours" —
 * which is what keeps a village on a coherent palette until it deliberately
 * reaches for a single token. Generated from the same catalogue the theme is
 * built from, so a token can never exist in one and not the other.
 */
const THEME_TOKEN_OVERRIDE_FIELDS = Object.fromEntries(
  THEME_COLOR_TOKENS.map(({ token }) => [
    colorTokenConfigKey(token),
    { type: 'color', default: '' },
  ]),
);

/** Font-slot overrides (`serif`, `display`, `accent`, `accent-alt`). */
const THEME_FONT_SLOT_FIELDS = Object.fromEntries(
  THEME_FONT_SLOTS.map((slot) => [
    fontSlotConfigKey(slot),
    { type: 'select', enum: THEME_FONT_IDS, default: '' },
  ]),
);

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
      citizenTelegramGroupUrl: {
        type: 'text',
        default: '',
      },
      maintenanceMinNights: {
        type: 'number',
        default: 28,
      },
      maintenanceNightsWindowYears: {
        type: 'number',
        default: 2,
      },
      maintenanceMinVotes: {
        type: 'number',
        default: 1,
      },
      maintenanceVoteWindowYears: {
        type: 'number',
        default: 1,
      },
      maintenanceAltMinVotes: {
        type: 'number',
        default: 3,
      },
      maintenanceAltVoteWindowYears: {
        type: 'number',
        default: 3,
      },
      foundingCitizenCutoffDate: {
        type: 'text',
        default: '2024-12-18',
      },
      presenceReminderMonths: {
        type: 'number',
        default: 6,
      },
      presenceFinalReminderMonths: {
        type: 'number',
        default: 3,
      },
      funnelRecommendedLimit: {
        type: 'number',
        default: 50,
      },
      funnelRecommendedMinNights: {
        type: 'number',
        default: 7,
      },
      recommendedNightsWeight: {
        type: 'number',
        default: 0.6,
      },
      recommendedTokensWeight: {
        type: 'number',
        default: 0.4,
      },
      atRiskMonthsBeforeWindowEnd: {
        type: 'number',
        default: 6,
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
        default: 0.3,
      },
      discountsMonthly: {
        type: 'number',
        default: 0.5,
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
      successPage: {
        type: 'text',
        default: '',
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
            billingPeriod: {
              type: 'select',
              enum: ['month', 'year'],
            },
            firstMonthFree: 'boolean',
            monthlyCredits: 'number',
            tier: 'number',
            perks: 'long-text',
            available: 'boolean',
            tiersAvailable: 'boolean',
            priceId: 'readonly-text',
            productId: 'readonly-text',
            couponId: 'readonly-text',
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
            firstMonthFree: false,
            monthlyCredits: 0,
            tier: 1,
            perks: '',
            available: true,
            tiersAvailable: false,
            priceId: '',
            productId: '',
            couponId: '',
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
        // Day-one default: the platform's own logo, shipped in each app's
        // public/images; a village's real logo replaces it via config.
        default: '/images/logo.png',
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
      callBookingLink: {
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
      // Hard ceiling on how long a financed purchase may be stretched
      // (e.g. 6, 180 for 15y, 360 for 30y). Buyers may still pick a shorter term.
      maxFinancingMonths: {
        type: 'number',
        default: 36,
      },
      // Carrying cost for financed tokens, in place of a flat token price
      // markup. Applied to the financed principal when quoting monthly dues
      // (e.g. 7 = 7% per annum).
      financingAprPercent: {
        type: 'number',
        default: 0,
      },
      // Floor on the quoted monthly installment. Packages that amortise below
      // this at the chosen term cannot be contracted.
      minMonthlyPayment: {
        type: 'number',
        default: 0,
      },
      // Optional comma-separated preset terms buyers can pick from. Values
      // above maxFinancingMonths are ignored; when empty the UI offers a
      // free-form months input up to the max.
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
  /**
   * Controls the language switcher in the navigation. The locales a platform
   * can offer are fixed at build time by `next.config.js` (`i18n.locales`);
   * `languages` narrows that list to the ones the switcher shows. An empty
   * list means every built locale. The toggle defaults to the legacy
   * `NEXT_PUBLIC_FEATURE_LOCALE_SWITCH` flag so existing platforms keep their
   * switcher until an admin changes the setting.
   */
  {
    slug: 'localization',
    value: {
      enabled: {
        type: 'boolean',
        default: process.env.NEXT_PUBLIC_FEATURE_LOCALE_SWITCH === 'true',
      },
      languages: {
        type: ['text'],
        default: [],
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
            walletAddress: 'text',
            // Only one Stripe account can be connected per platform today, so
            // this is effectively "use the platform Stripe account or not";
            // the value stays a select so more accounts can join the enum later.
            stripeAccount: {
              type: 'select',
              enum: ['none', 'default'],
            },
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
            walletAddress: '',
            stripeAccount: 'none',
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
    slug: 'quests',
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
      // Stay credits awarded when a referred user signs up.
      creditsToReferrer: {
        type: 'number',
        default: 1,
      },
      creditsToFriend: {
        type: 'number',
        default: 2,
      },
      maxCreditsPerMonth: {
        type: 'number',
        default: 6,
      },
      // Tokens owed to a citizen whose referral becomes a citizen. Zero
      // disables the program. The bonus rate applies until bonusEndDate
      // (YYYY-MM-DD, inclusive), then the base rate takes over on its own.
      tokensPerCitizenReferred: {
        type: 'number',
        default: 0,
      },
      bonusTokensPerCitizenReferred: {
        type: 'number',
        default: 0,
      },
      bonusEndDate: {
        type: 'text',
        default: '',
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
  /**
   * The volunteer season tool (`/roles/[id]`). A role with `isResidency` opens
   * it, and what it lays out is participation in an environmental volunteer
   * program: the season, the indicative rhythm, the room and board the
   * promoting association covers, and the bilingual agreement recording it.
   *
   * There is no salary, cash-out or early-exit penalty here, deliberately.
   * Volunteering is unpaid and freely ended: the association covers the
   * volunteer's costs as support in kind, and a euro ever paid out — or
   * charged — through this tool would be the thing that turns a lawful
   * volunteer program into undeclared work. What the association budgets for a
   * role still sizes the community token allocation, but that arithmetic stays
   * internal: a volunteer is shown a quantity of tokens whose fair market
   * value is zero, there being no liquid market for them. Paid team roles are
   * arranged separately, under a work or services contract.
   *
   * The tool is off unless a platform opts in with
   * `NEXT_PUBLIC_FEATURE_RESIDENCY`, which only sets the starting value — once
   * an admin saves the setting the config doc is what counts.
   *
   * Nothing but `enabled` carries a default. These are one association's legal
   * frame — its name, its law, its seasons — and a default here is written
   * into every platform's config document the first time an admin saves this
   * form. /roles/[id] reads the saved document alone and names whatever is
   * still unset, rather than laying out a season against values nobody chose.
   *
   * What the program feeds and powers its volunteers with is not here either:
   * that comes off the platform's own booking setup, so a village keeps one
   * set of answers rather than two that can drift apart.
   */
  {
    slug: 'residency',
    value: {
      enabled: {
        type: 'boolean',
        default: process.env.NEXT_PUBLIC_FEATURE_RESIDENCY === 'true',
      },
      // The promoting organisation (organização promotora), in whose name the
      // agreement is concluded — usually the association behind the village,
      // not the village brand.
      associationName: {
        type: 'text',
      },
      // The volunteering framework the program runs under, named in the banner
      // and throughout the agreement, e.g. "Lei n.º 71/98".
      legalFramework: {
        type: 'text',
      },
      // Optional page explaining volunteering against paid team roles.
      legalFrameworkUrl: {
        type: 'text',
      },
      // The court named in the agreement's general provisions.
      jurisdiction: {
        type: 'text',
      },
      // The association's own particulars, as the agreement's parties block
      // and signature line state them: tax number (NIPC), registered office,
      // and who signs for it in what capacity. Left blank, the agreement keeps
      // a visible "[•]" where the detail belongs rather than an empty clause.
      associationTaxNumber: {
        type: 'text',
      },
      associationAddress: {
        type: 'text',
      },
      signatoryName: {
        type: 'text',
      },
      signatoryOffice: {
        type: 'text',
      },
      // Where a volunteer writes to exercise their data protection rights
      // (agreement clause 11.2).
      privacyContactEmail: {
        type: 'text',
      },
      // The program coordinator's name and contact, named in Annex I.
      coordinatorContact: {
        type: 'text',
      },
      // Courtesy notice both sides aim to give. Volunteering ends freely: this
      // is what the community asks for, never a penalty.
      noticeWeeks: {
        type: 'number',
      },
      /*
       * Three inputs `POST /residencies/apply` refuses to file a season
       * without ("…not fully configured… Missing: sweatRate…"), so they live
       * here for the admin to state. The page renders none of them: the
       * association's own arithmetic runs server-side, and what a volunteer
       * is shown is a quantity of tokens whose fair market value is zero.
       *
       * `expenseReimbursementDays`: days within which documented expenses are
       * reimbursed. `sweatRate` / `sweatMaxBonus`: how much of a role's budget
       * the association adds per $Sweat held, and the ceiling on that — 0 and
       * 0 size the allocation from the role's budget alone.
       */
      expenseReimbursementDays: {
        type: 'number',
      },
      sweatRate: {
        type: 'number',
      },
      sweatMaxBonus: {
        type: 'number',
      },
      // Whether the association actually holds a personal accident policy for
      // program activities. Off by default and never assumed: an association
      // that has not taken one out must not have the season slip promise it.
      providesInsurance: {
        type: 'boolean',
        default: false,
      },
      // Insurer and policy number, identified in Annex I. Only read when
      // `providesInsurance` is on.
      insurancePolicy: {
        type: 'text',
      },
      // Top of the $Presence ladder, used to scale the tier bar.
      presenceScaleMax: {
        type: 'number',
      },
      // Version stamped onto every accepted agreement, so a later change to
      // the template does not rewrite what someone already signed.
      agreementVersion: {
        type: 'text',
      },
      // Optional override for the bilingual Volunteer Agreement the page ships
      // with (`components/Residency/agreementTemplate.ts`). Placeholders in
      // `residency.helpers.ts` (`{{seasonLabel}}`, `{{halfDaysPerWeek}}`, …)
      // are filled from the live season; a role can override this in turn.
      agreementTemplate: {
        type: 'long-text',
      },
      // Steps of the volunteer's journey. Recognition only — priority on a
      // window, a mentor role — never money: nothing on this ladder converts.
      presenceTiers: {
        type: [
          {
            label: 'text',
            minPresence: 'number',
            unlocks: 'text',
          },
        ],
      },
      // `startMonth` is 1-12 so the admin form reads like a calendar.
      seasons: {
        type: [
          {
            id: 'text',
            label: 'text',
            startMonth: 'number',
            durationMonths: 'number',
            pace: {
              type: 'select',
              enum: ['high', 'slow'],
            },
          },
        ],
      },
      acknowledgements: {
        type: [
          {
            id: 'text',
            label: 'long-text',
          },
        ],
      },
    },
  },
  /**
   * Edited in /dashboard/theming rather than the generic config form, and
   * expanded into the whole Tailwind palette by `buildTheme`. The defaults are
   * the neutral greyscale in `theming.js` — the single place those values are
   * written, so the schema, the editor and the compiled theme cannot drift.
   */
  {
    slug: 'theming',
    value: {
      enabled: {
        type: 'boolean',
        default: true,
      },
      primaryColor: {
        type: 'color',
        default: THEME_DEFAULTS.primaryColor,
      },
      secondaryColor: {
        type: 'color',
        default: THEME_DEFAULTS.secondaryColor,
      },
      backgroundColor: {
        type: 'color',
        default: THEME_DEFAULTS.backgroundColor,
      },
      foregroundColor: {
        type: 'color',
        default: THEME_DEFAULTS.foregroundColor,
      },
      fontFamilyBody: {
        type: 'select',
        enum: THEME_FONT_IDS,
        default: THEME_DEFAULTS.fontFamilyBody,
      },
      fontFamilyHeading: {
        type: 'select',
        enum: THEME_FONT_IDS,
        default: THEME_DEFAULTS.fontFamilyHeading,
      },
      ...THEME_FONT_SLOT_FIELDS,
      ...THEME_TOKEN_OVERRIDE_FIELDS,
    },
  },
];
