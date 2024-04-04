import { CloserCurrencies, Price } from './currency';

export type BookingConditions = {
  memberMaxDuration: number | undefined;
  memberMaxBookingHorizon: number | undefined;
  guestMaxDuration: number | undefined;
  guestMaxBookingHorizon: number | undefined;
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
  utilityDayFiat: Price<CloserCurrencies.EUR>;
  utilityToken: Price<CloserCurrencies.ETH>;
  checkinTime: number;
  checkoutTime: number;
  maxDuration: number;
  minDuration: number;
  volunteerCommitment: string;
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
  seasons: any;
};

export interface Config {
  slug: string;
  value: {
    [key: string]: string | number | boolean | string[];
  };
}

export type BookingRule = {
  title: string;
  description: string;
};

export interface BookingRulesConfig {
  enabled: boolean;
  elements: BookingRule[];
}

export type GeneralConfig = {
  enabled: boolean;
  appName: string;
  platformName: string;
  semanticUrl: string;
  platformLegalAddress: string;
  teamEmail: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  locationLat: string;
  locationLon: string;
  visitorsGuide: string;
  facebookPixelId: string;
  faqsGoogleSheetId: string;
};

export type BookingConfig = {
  guestMaxDuration: number;
  enabled: boolean;
  minDuration: number;
  discountsDaily: number;
  seasonsHighModifier: number;
  seasonsHighEnd: string;
  cancellationPolicyDefault: number;
  memberMaxBookingHorizon: number;
  guestMaxBookingHorizon: number;
  seasonsHighStart: string;
  cancellationPolicyLastday: number;
  checkoutTime: number;
  discountsWeekly: number;
  utilityTokenCur: string;
  utilityTokenVal: number;
  cancellationPolicyLastmonth: number;
  maxDuration: number;
  checkinTime: number;
  discountsMonthly: number;
  utilityDayFiatVal: number;
  memberMaxDuration: number;
  utilityFiatCur: string;
  volunteerCommitment: string;
  cancellationPolicyLastweek: number;
  utilityFiatVal: number;
};

export type PaymentConfig = {
  enabled: boolean;
  cardPayment: string;
  cryptoPayment: string;
  ethereumWalletAddress: string;
  polygonWalletAddress: string;
};

export type FundraisingConfig = {
  videoId: string;
  wandererUrl: string;
  pioneerUrl: string;
  oneMonthSharedUrl: string;
  oneMonthPrivateUrl: string;
  buy5TdfUrl: string;
  buy10TdfUrl: string;
  hostEventUrl: string;
  enabled: boolean;
  creditPrice30Credits: number;
  creditPrice90Credits: number;
  creditPrice180Credits: number;
};
