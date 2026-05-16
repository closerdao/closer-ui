import type { Price } from './currency';
import { CloserCurrencies } from './currency';
import type { Listing } from './booking';

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
  total?: Price<CloserCurrencies.EUR>;
  numberOfUnitsRequired?: number;
  maxUnits?: number;
  bookingRate?: BookingRate;
  discount?: number;
  discounts?: DurationDiscounts;
  available?: boolean;
};

export type StaySearchResponse = DurationDiscountScope & {
  results: StaySearchListing[];
  availability: Record<string, unknown>;
};
