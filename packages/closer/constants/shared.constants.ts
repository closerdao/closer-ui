import { blockchainConfig } from '../config_blockchain';
import { CloserCurrencies } from '../types/currency';

export const SHARED_ACCOMMODATION_PREFERENCES = [
  { label: 'Flexible', value: 'flexible' },
  { label: 'Male Only', value: 'male only' },
  { label: 'Female Only', value: 'female only' },
];

export const REFUND_PERIODS = {
  MONTH: 30,
  WEEK: 7,
  DAY: 1,
  LASTDAY: 0,
};

export const BOOKING_STEPS = [
  'dates',
  'accomodation',
  'food',
  'rules',
  'questions',
  'summary',
  'checkout',
  // 'confirmation',
];
export const PRODUCT_SALE_STEPS = [
  'learn',
  'checkout',
  'confirmation',
];

export const CURRENCIES: CloserCurrencies[] = [
  CloserCurrencies.EUR,
  CloserCurrencies.TDF,
  // blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol,
];

export const CURRENCIES_WITH_LABELS = [
  {
    value: CloserCurrencies.EUR,
    label: 'Euros',
    symbol: '€',
  },
  process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true'
    ? {
        value: blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol,
        label: `${blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol}`,
        symbol: `$${blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol}`,
      }
    : {
        value: 'credits',
        label: 'credits',
        symbol: 'credits',
      },
];

export const SUBSCRIPTION_STEPS = [
  'subscriptions',
  'summary',
  'checkout',
  'success',
];

export const SUBSCRIPTION_CITIZEN_STEPS = [
  'validation',
  'select-flow',
  'apply',
  'success',
];

export const TOKEN_SALE_STEPS = [
  'before-you-begin',
  'checklist-crypto',
  'nationality',
  'checkout',
  'success',
];

export const TOKEN_SALE_STEPS_BANK_TRANSFER = [
  'before-you-begin',
  'nationality',
  'bank-transfer',
  'success',
];

export const DEFAULT_CURRENCY = CloserCurrencies.EUR; // EUR
export const REFERRAL_ID_LOCAL_STORAGE_KEY = 'referredByUserId';

export const BOOKING_STATUS_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Paid', value: 'paid' },
  { label: 'Tokens-staked', value: 'tokens-staked' },
  { label: 'Credits-paid', value: 'credits-paid' },
  { label: 'Checked-in', value: 'checked-in' },
  { label: 'Checked-out', value: 'checked-out' },
];

export const BOOKING_TYPE_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Volunteering', value: 'volunteer' },
  { label: 'Residency', value: 'residency' },
  { label: 'Event', value: 'event' },
  { label: 'Stay', value: 'stay' },
];

export const USER_ROLE_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Admin', value: 'admin' },
  { label: 'Content-creator', value: 'content-creator' },
  { label: 'Event creator', value: 'event-creator' },
  { label: 'Space host', value: 'space-host' },
  { label: 'Steward', value: 'steward' },
  { label: 'Community-curator', value: 'community-curator' },
  { label: 'Member', value: 'member' },
];

export const USER_MEMBER_STATUS_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Member', value: 'member' },
  { label: 'Not member', value: 'Not Memebr' },
];

export const ACTIONS = [
  { label: 'Send carrots', value: 'Send carrots' },
  { label: 'Export selected (CSV)', value: 'Export selected (CSV)' },
  { label: 'Add role', value: 'Add role' },
  { label: 'Remove role', value: 'Remove role' },
  { label: 'Copy emails', value: 'Copy emails' },
  { label: 'Unlink wallet', value: 'Unlink wallet' },
];

export const SUBSCRIPTION_TIER_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Explorer', value: 'explorer' },
  { label: 'Wanderer', value: 'wanderer' },
  { label: 'Pioneer', value: 'pioneer' },
  { label: 'Sheep', value: 'sheep' },
];

export const USER_CREATED_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Last week', value: 'last-week' },
  { label: 'Last month', value: 'last-month' },
  { label: 'Last 3 months', value: 'last-3-months' },
  { label: 'Last 6 months', value: 'last-6-months' },
];

export const USER_SORT_OPTIONS = ['-created', 'screenname'];
export const USER_SORT_TITLE_OPTIONS = ['Newest first', 'Name'];

export const INVESTMENT_COMPARISON = [
  {
    amount: '€1,100',
    renting: {
      term: ['1 Month'],
      extraCosts: ['Food - €500', 'Utility - €200', 'Co-working - €400'],
    },
    tdf: {
      term: ['~4 $TDF', '4 days per year'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '€3,300',
    renting: {
      term: ['3 Months'],
      extraCosts: [
        'Food - €500 x 3',
        'Utility - €200 x 3',
        'Co-working - €400 x 3',
      ],
    },
    tdf: {
      term: ['~14 $TDF', '2 weeks per year'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '€7,000',
    renting: {
      term: ['6 Months'],
      extraCosts: [
        'Food - €500 x 6',
        'Utility - €200 x 6',
        'Co-working - €400 x 6',
      ],
    },
    tdf: {
      term: ['~30 $TDF', '1 month per year'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '€21,000',
    renting: {
      term: ['19 Months'],
      extraCosts: [
        'Food - €500 x 19',
        'Utility - €200 x 19',
        'Co-working - €400 x 19',
      ],
    },
    tdf: {
      term: ['~90 $TDF', '3 months per year'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '€84,680',
    renting: {
      term: ['6 years'],
      extraCosts: [
        'Food - €500 x 72',
        'Utility - €200 x 72',
        'Co-working - €400 x 72',
      ],
    },
    tdf: {
      term: ['~365 $TDF', 'You just Got a full time home!'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '278,000',
    renting: {
      term: ['Finally Bought a home!'],
      extraCosts: ['Food - €500', 'Utility - €200', 'Co-working - €400'],
    },
    tdf: {
      term: ['You spend the rest on building regen startups'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
];

export const BONDING_CURVE = {
  COEFFICIENTS: {
    a: -11680057722,
    b: 32000461777723,
    c: 420,
  },
};

export const SALES_CONFIG = {
  MAX_WALLET_BALANCE: 1500,
  MAX_TOKENS_PER_TRANSACTION: 100,
};

// Token booking errors
export const BOOKING_EXISTS_ERROR =
  'execution reverted: BookingFacet: Booking already exists';
export const USER_REJECTED_TRANSACTION_ERROR = 'user rejected transaction';

export const MAX_BOOKINGS_TO_FETCH = 3000;
export const BOOKINGS_PER_PAGE = 36;

export const MAX_CREDITS_PER_MONTH = 90;

export const HOME_PAGE_CATEGORY = 'home page';

export const MAX_USERS_TO_FETCH = 3000;

export const MAX_LISTINGS_TO_FETCH = 100;

export const DEFAULT_AVAILABILITY_RANGE_TO_CHECK = 120;

export const paidStatuses = [
  'paid',
  'tokens-staked',
  'credits-paid',
  'checked-in',
  'checked-out',
];
export const dashboardRelevantStatuses = [
  ...paidStatuses,
  'pending',
  'confirmed',
];

export const STRIPE_AMOUNT_MULTIPLIER = 100;

export const GNOSIS_SAFE_ADDRESS = '0x5E810b93c51981eccA16e030Ea1cE8D8b1DEB83b';
export const BLOG_POSTS_PER_PAGE = 9;

export const DEFAULT_BLOG_IMAGE_ID = '66a7da14aca528c59057785e';
