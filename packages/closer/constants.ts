import { blockchainConfig } from './config_blockchain';
import { CloserCurrencies } from './types/currency';

export const REFUND_PERIODS = {
  MONTH: 30,
  WEEK: 7,
  DAY: 1,
  LASTDAY: 0,
};

export const BOOKING_STEPS = [
  'dates',
  'accomodation',
  'questions',
  'summary',
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
  {
    value: blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol,
    label: `$${blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol}`,
    symbol: `$${blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol}`,
  },
];

export const SUBSCRIPTION_STEPS = [
  'subscriptions',
  'summary',
  'checkout',
  'success',
];

export const TOKEN_SALE_STEPS = [
  'before-you-begin',
  'nationality',
  'token-counter',
  'your-info',
  'checkout',
  'success',
];

export const DEFAULT_CURRENCY = CURRENCIES[0]; // EUR
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
  { label: 'Event', value: 'event' },
  { label: 'Stay', value: 'stay' },
];

export const USER_ROLE_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Admin', value: 'admin' },
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

export const BONDING_CURVE = {
  COEFFICIENTS: {
    a: -11680057722,
    b: 32000461777723,
    c: 420,
  },
};

export const SALES_CONFIG = {
  MAX_WALLET_BALANCE: 915,
  MAX_TOKENS_PER_TRANSACTION: 100,
};
