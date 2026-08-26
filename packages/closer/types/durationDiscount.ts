import type { Listing } from './booking';
import type { Price } from './currency';
import { CloserCurrencies } from './currency';

export type BookingRate = 'daily' | 'weekly' | 'monthly';

export type DurationDiscounts = {
  daily: number;
  weekly: number;
  monthly: number;
};

export type DurationDiscountScope = {
  duration: number;
  bookingRate: BookingRate;
  discount: number;
  discounts: DurationDiscounts;
};

export type StaySearchListing = Listing & {
  rentalFiat?: Price<CloserCurrencies.EUR>;
  rentalToken?: Price<CloserCurrencies.TDF>;
  total?: Price<CloserCurrencies.EUR>;
  numberOfUnitsRequired?: number;
  maxUnits?: number;
  bookingRate?: BookingRate;
  discount?: number;
  discounts?: DurationDiscounts;
  accommodationDiscount?: {
    duration: { tier: BookingRate; fraction: number };
    passport: { fraction: number };
    combinedFraction: number;
  };
  accommodationPricing?: {
    fiat: {
      gross: Price<CloserCurrencies.EUR>;
      discounted: Price<CloserCurrencies.EUR>;
      discountAmount: Price<CloserCurrencies.EUR>;
      effectivePerNight: Price<CloserCurrencies.EUR>;
    };
  };
  available?: boolean;
};

export type StaySearchResponse = DurationDiscountScope & {
  results: StaySearchListing[];
  availability: Record<string, unknown>;
};
