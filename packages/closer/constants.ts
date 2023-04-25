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
  blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol,
];
export const SUBSCRIPTION_STEPS = [
  'subscriptions',
  'summary',
  'checkout',
  'success',
];

export const DEFAULT_CURRENCY = CURRENCIES[0]; // EUR
export const REFERRAL_ID_LOCAL_STORAGE_KEY = 'referredByUserId';
