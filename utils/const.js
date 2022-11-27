/*
	System-wide constants
*/
import { BLOCKCHAIN_DAO_TOKEN } from '../config_blockchain.js';

export const BOOKING_PATHS = [
  '/bookings/new/dates',
  '/bookings/new/accomodation',
  '/bookings/new/questionnaire',
  '/bookings/new/summary',
  '/bookings/new/checkout',
  '/bookings/new/confirmation',
];

export const CURRENCIES = ['EUR', BLOCKCHAIN_DAO_TOKEN.symbol];
export const DEFAULT_CURRENCY = CURRENCIES[0]; // EUR
