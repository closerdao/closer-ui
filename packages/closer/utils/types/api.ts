import { CloserCurrencies, Currency } from './currency';

export type BookingConditions = {
  member: {
    maxDuration: number;
    maxBookingHorizon: number;
  };
  guest: {
    maxDuration: number;
    maxBookingHorizon: number;
  };
};

export type Question = {
  type: 'text' | 'select';
  name: string;
  required?: boolean;
  options?: string[];
};

export type BookingSettings = {
  utilityFiat: Currency<CloserCurrencies.EUR>;
  utilityToken: Currency<CloserCurrencies.ETH>;
  checkinTime: number;
  checkoutTime: number;
  maxDuration: number;
  minDuration: number;
  conditions: BookingConditions;
  discounts: {
    daily: number;
    weekly: number;
    monthly: number;
    highseason: number;
  };
  cancellationPolicy: {
    lastday: 0.5;
    lastweek: 0.5;
    lastmonth: 0.75;
    default: 1;
  };
  questions: Question[];
};
