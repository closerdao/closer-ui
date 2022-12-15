/*
	System-wide constants
*/
import { BLOCKCHAIN_DAO_TOKEN } from '../config_blockchain.js';

export const BOOKING_STEPS = [
  '/bookings/create/dates',
  '/bookings/create/accomodation',
  '/bookings/questionnaire',
  '/bookings/summary',
  '/bookings/checkout',
  '/bookings/confirmation',
];

export const CURRENCIES = ['EUR', BLOCKCHAIN_DAO_TOKEN.symbol];
export const DEFAULT_CURRENCY = CURRENCIES[0]; // EUR
