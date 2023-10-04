import { CloserCurrencies, Price } from './currency';

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

export type VolunteerOpportunity = {
  name: string;
  category: string;
  photo: string;
  slug: string;
  description: string;
  start: string;
  end: string;
  visibleBy: any[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: any[];
  managedBy: any[];
  _id: string;
};


export type Question = {
  type: 'text' | 'select';
  name: string;
  required?: boolean;
  options?: string[];
};

export type BookingSettings = {
  utilityFiat: Price<CloserCurrencies.EUR>;
  utilityToken: Price<CloserCurrencies.ETH>;
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
