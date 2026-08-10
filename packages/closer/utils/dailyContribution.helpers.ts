import type { BookingConfig, FoodOption } from '../types';
import {
  getFoodOptionsForBookingContext,
  type FoodBookingContext,
} from './booking.helpers';

export const parseConfigRate = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export interface VolunteerDailyRates {
  currency: string;
  utilityRate: number | null;
  foodOptions: FoodOption[];
  foodRate: number | null;
  isFoodSelection: boolean;
  foodMinRate: number | null;
  foodMaxRate: number | null;
  accommodationRate: number;
}

export const resolveVolunteerDailyRates = ({
  bookingConfig,
  foodOptions,
  bookingContext = 'volunteer',
}: {
  bookingConfig: BookingConfig | null | undefined;
  foodOptions: FoodOption[];
  bookingContext?: FoodBookingContext;
}): VolunteerDailyRates => {
  const currency = bookingConfig?.utilityFiatCur || 'EUR';
  const utilityRate = parseConfigRate(bookingConfig?.utilityFiatVal);
  const contextOptions = getFoodOptionsForBookingContext(
    foodOptions,
    bookingContext,
  );
  const pricedOptions = contextOptions.filter(
    (option) => typeof option.price === 'number' && Number.isFinite(option.price),
  );
  const prices = pricedOptions.map((option) => option.price);
  const isFoodSelection = pricedOptions.length > 1;
  const foodMinRate = prices.length > 0 ? Math.min(...prices) : null;
  const foodMaxRate = prices.length > 0 ? Math.max(...prices) : null;
  const defaultOption =
    pricedOptions.find((option) => option.isDefault) || pricedOptions[0];
  const foodRate =
    !isFoodSelection && typeof defaultOption?.price === 'number'
      ? defaultOption.price
      : null;

  return {
    currency,
    utilityRate,
    foodOptions: pricedOptions,
    foodRate,
    isFoodSelection,
    foodMinRate,
    foodMaxRate,
    accommodationRate: 0,
  };
};
