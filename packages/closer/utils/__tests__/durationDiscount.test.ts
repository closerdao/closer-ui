import {
  computeGrossAccommodationFromDiscounted,
  durationDiscountPercent,
  getBookingRateFromNights,
  isDurationDiscountFraction,
  resolveDurationDiscountsFromSettings,
} from '../durationDiscount';

describe('durationDiscount', () => {
  describe('getBookingRateFromNights', () => {
    it('maps nights to daily, weekly, and monthly tiers', () => {
      expect(getBookingRateFromNights(1)).toBe('daily');
      expect(getBookingRateFromNights(6)).toBe('daily');
      expect(getBookingRateFromNights(7)).toBe('weekly');
      expect(getBookingRateFromNights(27)).toBe('weekly');
      expect(getBookingRateFromNights(28)).toBe('monthly');
    });
  });

  describe('resolveDurationDiscountsFromSettings', () => {
    it('prefers flat booking settings fields over nested discounts', () => {
      expect(
        resolveDurationDiscountsFromSettings({
          discountsDaily: 0,
          discountsWeekly: 0.34,
          discountsMonthly: 0.67,
          discounts: { daily: 0.1, weekly: 0.2, monthly: 0.3 },
        }),
      ).toEqual({ daily: 0, weekly: 0.34, monthly: 0.67 });
    });

    it('falls back to nested discounts when flat fields are absent', () => {
      expect(
        resolveDurationDiscountsFromSettings({
          discounts: { daily: 0, weekly: 0.25, monthly: 0.5 },
        }),
      ).toEqual({ daily: 0, weekly: 0.25, monthly: 0.5 });
    });
  });

  describe('computeGrossAccommodationFromDiscounted', () => {
    it('derives pre-discount accommodation from rentalFiat and fraction', () => {
      expect(
        computeGrossAccommodationFromDiscounted(
          { val: 231, cur: 'EUR' },
          0.34,
        ),
      ).toBeCloseTo(350, 5);
    });

    it('returns null when discount does not apply', () => {
      expect(
        computeGrossAccommodationFromDiscounted({ val: 100, cur: 'EUR' }, 0),
      ).toBeNull();
    });
  });

  describe('durationDiscountPercent', () => {
    it('converts fraction to rounded percent', () => {
      expect(durationDiscountPercent(0.34)).toBe(34);
      expect(durationDiscountPercent(0.335)).toBe(34);
    });
  });

  describe('isDurationDiscountFraction', () => {
    it('accepts open-interval (0, 1) fractions only', () => {
      expect(isDurationDiscountFraction(0.34)).toBe(true);
      expect(isDurationDiscountFraction(0)).toBe(false);
      expect(isDurationDiscountFraction(1)).toBe(false);
    });
  });
});
