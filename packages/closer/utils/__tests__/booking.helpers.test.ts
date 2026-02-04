import { CURRENCIES } from '../../constants';
import { CloserCurrencies } from '../../types';
import { PaymentType } from '../../types/booking';
import {
  getAccommodationTotal,
  getBookingPaymentType,
  getDisplayTotalFromComponents,
  getFiatTotal,
  getFoodTotal,
  getPaymentDelta,
  getPaymentType,
  getUtilityTotal,
} from '../booking.helpers';

describe('getFiatTotal', () => {
  it('returns 0 for team booking', () => {
    expect(
      getFiatTotal({
        isTeamBooking: true,
        eventTotal: 10,
        utilityTotal: 20,
        foodTotal: 15,
        accommodationFiatTotal: 100,
        useTokens: false,
        useCredits: false,
      }),
    ).toBe(0);
  });

  it('excludes accommodation when useTokens is true', () => {
    expect(
      getFiatTotal({
        isTeamBooking: false,
        eventTotal: 0,
        utilityTotal: 10,
        foodTotal: 12,
        accommodationFiatTotal: 60,
        useTokens: true,
        useCredits: false,
      }),
    ).toBe(22);
  });

  it('excludes accommodation when useCredits is true', () => {
    expect(
      getFiatTotal({
        isTeamBooking: false,
        eventTotal: 0,
        utilityTotal: 5,
        foodTotal: 0,
        accommodationFiatTotal: 90,
        useTokens: false,
        useCredits: true,
      }),
    ).toBe(5);
  });

  it('includes all components for fiat-only booking', () => {
    expect(
      getFiatTotal({
        isTeamBooking: false,
        eventTotal: 20,
        utilityTotal: 10,
        foodTotal: 24,
        accommodationFiatTotal: 60,
        useTokens: false,
        useCredits: false,
      }),
    ).toBe(114);
  });
});

describe('getUtilityTotal', () => {
  it('returns 0 when utilityOptionEnabled is false', () => {
    expect(
      getUtilityTotal({
        utilityFiatVal: 5,
        updatedAdults: 2,
        updatedDuration: 3,
        discountRate: 1,
        isTeamBooking: false,
        isUtilityOptionEnabled: false,
      }),
    ).toBe(0);
  });

  it('returns 0 for team booking', () => {
    expect(
      getUtilityTotal({
        utilityFiatVal: 5,
        updatedAdults: 2,
        updatedDuration: 3,
        discountRate: 1,
        isTeamBooking: true,
        isUtilityOptionEnabled: true,
      }),
    ).toBe(0);
  });

  it('returns 0 when utilityFiatVal is undefined', () => {
    expect(
      getUtilityTotal({
        utilityFiatVal: undefined,
        updatedAdults: 2,
        updatedDuration: 3,
        discountRate: 1,
        isTeamBooking: false,
        isUtilityOptionEnabled: true,
      }),
    ).toBe(0);
  });

  it('returns utilityFiatVal * adults * duration * discountRate when enabled', () => {
    expect(
      getUtilityTotal({
        utilityFiatVal: 2,
        updatedAdults: 3,
        updatedDuration: 4,
        discountRate: 0.9,
        isTeamBooking: false,
        isUtilityOptionEnabled: true,
      }),
    ).toBe(2 * 3 * 4 * 0.9);
  });
});

describe('getFoodTotal', () => {
  it('returns 0 when foodOptionEnabled is false', () => {
    expect(
      getFoodTotal({
        isHourlyBooking: false,
        foodPrice: 12,
        durationInDays: 2,
        adults: 2,
        isFoodOptionEnabled: false,
        isTeamMember: false,
      }),
    ).toBe(0);
  });

  it('returns 0 for team member', () => {
    expect(
      getFoodTotal({
        isHourlyBooking: false,
        foodPrice: 12,
        durationInDays: 2,
        adults: 2,
        isFoodOptionEnabled: true,
        isTeamMember: true,
      }),
    ).toBe(0);
  });

  it('returns 0 for hourly booking', () => {
    expect(
      getFoodTotal({
        isHourlyBooking: true,
        foodPrice: 12,
        durationInDays: 2,
        adults: 2,
        isFoodOptionEnabled: true,
        isTeamMember: false,
      }),
    ).toBe(0);
  });

  it('returns 0 when foodPrice is 0', () => {
    expect(
      getFoodTotal({
        isHourlyBooking: false,
        foodPrice: 0,
        durationInDays: 2,
        adults: 2,
        isFoodOptionEnabled: true,
        isTeamMember: false,
      }),
    ).toBe(0);
  });

  it('returns foodPrice * adults * durationInDays when enabled', () => {
    expect(
      getFoodTotal({
        isHourlyBooking: false,
        foodPrice: 12,
        durationInDays: 3,
        adults: 2,
        isFoodOptionEnabled: true,
        isTeamMember: false,
      }),
    ).toBe(72);
  });
});

describe('getDisplayTotalFromComponents', () => {
  it('excludes foodFiat when foodOptionEnabled is false', () => {
    const result = getDisplayTotalFromComponents({
      rentalFiat: { val: 60, cur: CloserCurrencies.EUR },
      utilityFiat: { val: 10, cur: CloserCurrencies.EUR },
      foodFiat: { val: 24, cur: CloserCurrencies.EUR },
      foodOptionEnabled: false,
      utilityOptionEnabled: true,
    });
    expect(result.val).toBe(70);
    expect(result.cur).toBe(CloserCurrencies.EUR);
  });

  it('excludes utilityFiat when utilityOptionEnabled is false', () => {
    const result = getDisplayTotalFromComponents({
      rentalFiat: { val: 60, cur: CloserCurrencies.EUR },
      utilityFiat: { val: 10, cur: CloserCurrencies.EUR },
      foodFiat: { val: 24, cur: CloserCurrencies.EUR },
      foodOptionEnabled: true,
      utilityOptionEnabled: false,
    });
    expect(result.val).toBe(84);
  });

  it('uses fallback currency when no component provides cur', () => {
    const result = getDisplayTotalFromComponents({
      fallbackCur: CloserCurrencies.TDF,
      foodOptionEnabled: true,
      utilityOptionEnabled: true,
    });
    expect(result.cur).toBe(CloserCurrencies.TDF);
    expect(result.val).toBe(0);
  });

  it('sums and rounds to 2 decimals', () => {
    const result = getDisplayTotalFromComponents({
      rentalFiat: { val: 30.111, cur: CloserCurrencies.EUR },
      utilityFiat: { val: 5.222, cur: CloserCurrencies.EUR },
      foodFiat: { val: 12.333, cur: CloserCurrencies.EUR },
      foodOptionEnabled: true,
      utilityOptionEnabled: true,
    });
    expect(result.val).toBe(47.67);
  });
});

describe('getAccommodationTotal', () => {
  const baseListing = {
    name: 'Room',
    category: 'room',
    photos: [],
    slug: 'room',
    description: '',
    fiatPrice: { val: 30, cur: CloserCurrencies.EUR },
    tokenPrice: { val: 0.5, cur: CloserCurrencies.TDF },
    rooms: 1,
    beds: 1,
    quantity: 1,
    private: false,
    visibleBy: [],
    createdBy: 'user',
    updated: '',
    created: '',
    attributes: [],
    managedBy: [],
    _id: 'id',
  };

  it('returns 0 when listing is undefined', () => {
    expect(
      getAccommodationTotal({
        listing: undefined,
        useTokens: false,
        useCredits: false,
        adults: 2,
        durationInDaysOrHours: 3,
        discountRate: 1,
        volunteerId: undefined,
        isTeamBooking: false,
      }),
    ).toBe(0);
  });

  it('returns 0 when volunteerId is set', () => {
    expect(
      getAccommodationTotal({
        listing: baseListing as any,
        useTokens: false,
        useCredits: false,
        adults: 2,
        durationInDaysOrHours: 3,
        discountRate: 1,
        volunteerId: 'vol-1',
        isTeamBooking: false,
      }),
    ).toBe(0);
  });

  it('returns 0 for team booking', () => {
    expect(
      getAccommodationTotal({
        listing: baseListing as any,
        useTokens: false,
        useCredits: false,
        adults: 2,
        durationInDaysOrHours: 3,
        discountRate: 1,
        volunteerId: undefined,
        isTeamBooking: true,
      }),
    ).toBe(0);
  });

  it('uses fiatPrice for fiat booking (shared: adults multiplier)', () => {
    expect(
      getAccommodationTotal({
        listing: baseListing as any,
        useTokens: false,
        useCredits: false,
        adults: 2,
        durationInDaysOrHours: 3,
        discountRate: 1,
        volunteerId: undefined,
        isTeamBooking: false,
      }),
    ).toBe(180);
  });

  it('uses tokenPrice when useTokens is true', () => {
    expect(
      getAccommodationTotal({
        listing: baseListing as any,
        useTokens: true,
        useCredits: false,
        adults: 2,
        durationInDaysOrHours: 3,
        discountRate: 1,
        volunteerId: undefined,
        isTeamBooking: false,
      }),
    ).toBe(3);
  });

  it('uses tokenPrice when useCredits is true', () => {
    expect(
      getAccommodationTotal({
        listing: baseListing as any,
        useTokens: false,
        useCredits: true,
        adults: 2,
        durationInDaysOrHours: 3,
        discountRate: 1,
        volunteerId: undefined,
        isTeamBooking: false,
      }),
    ).toBe(3);
  });

  it('uses multiplier 1 for private listing', () => {
    const privateListing = { ...baseListing, private: true };
    expect(
      getAccommodationTotal({
        listing: privateListing as any,
        useTokens: false,
        useCredits: false,
        adults: 3,
        durationInDaysOrHours: 2,
        discountRate: 1,
        volunteerId: undefined,
        isTeamBooking: false,
      }),
    ).toBe(60);
  });

  it('uses hourly price and discountRate 1 when priceDuration is hour', () => {
    const hourlyListing = {
      ...baseListing,
      priceDuration: 'hour',
      fiatHourlyPrice: { val: 10, cur: CloserCurrencies.EUR },
      tokenHourlyPrice: { val: 0.2, cur: CloserCurrencies.TDF },
    };
    expect(
      getAccommodationTotal({
        listing: hourlyListing as any,
        useTokens: false,
        useCredits: false,
        adults: 2,
        durationInDaysOrHours: 4,
        discountRate: 0.8,
        volunteerId: undefined,
        isTeamBooking: false,
      }),
    ).toBe(80);
  });
});

describe('getPaymentType', () => {
  it('returns FIAT when isAdditionalFiatPayment is true', () => {
    expect(
      getPaymentType({
        useCredits: true,
        duration: 5,
        currency: CURRENCIES[0],
        maxNightsToPayWithTokens: 10,
        maxNightsToPayWithCredits: 10,
        isAdditionalFiatPayment: true,
      }),
    ).toBe(PaymentType.FIAT);
  });

  it('returns FIAT for EUR when not useCredits', () => {
    expect(
      getPaymentType({
        useCredits: false,
        duration: 5,
        currency: CURRENCIES[0],
        maxNightsToPayWithTokens: 0,
        maxNightsToPayWithCredits: 3,
      }),
    ).toBe(PaymentType.FIAT);
  });

  it('returns FULL_CREDITS when maxNightsToPayWithCredits >= duration and useCredits', () => {
    expect(
      getPaymentType({
        useCredits: true,
        duration: 5,
        currency: CURRENCIES[0],
        maxNightsToPayWithTokens: 0,
        maxNightsToPayWithCredits: 10,
      }),
    ).toBe(PaymentType.FULL_CREDITS);
  });

  it('returns PARTIAL_CREDITS when maxNightsToPayWithCredits < duration and useCredits', () => {
    expect(
      getPaymentType({
        useCredits: true,
        duration: 10,
        currency: CURRENCIES[0],
        maxNightsToPayWithTokens: 0,
        maxNightsToPayWithCredits: 4,
      }),
    ).toBe(PaymentType.PARTIAL_CREDITS);
  });

  it('returns FULL_TOKENS for token currency when maxNightsToPayWithTokens >= duration', () => {
    expect(
      getPaymentType({
        useCredits: false,
        duration: 5,
        currency: CURRENCIES[1],
        maxNightsToPayWithTokens: 10,
        maxNightsToPayWithCredits: 0,
      }),
    ).toBe(PaymentType.FULL_TOKENS);
  });

  it('returns PARTIAL_TOKENS for token currency when maxNightsToPayWithTokens < duration', () => {
    expect(
      getPaymentType({
        useCredits: false,
        duration: 10,
        currency: CURRENCIES[1],
        maxNightsToPayWithTokens: 4,
        maxNightsToPayWithCredits: 0,
      }),
    ).toBe(PaymentType.PARTIAL_TOKENS);
  });
});

describe('getBookingPaymentType', () => {
  it('returns PARTIAL_CREDITS when useCredits and rentalFiat has value', () => {
    expect(
      getBookingPaymentType({
        useCredits: true,
        useTokens: false,
        rentalFiat: { val: 20, cur: CloserCurrencies.EUR },
      }),
    ).toBe(PaymentType.PARTIAL_CREDITS);
  });

  it('returns FULL_CREDITS when useCredits and no rentalFiat', () => {
    expect(
      getBookingPaymentType({
        useCredits: true,
        useTokens: false,
        rentalFiat: { val: 0, cur: CloserCurrencies.EUR },
      }),
    ).toBe(PaymentType.FULL_CREDITS);
  });

  it('returns FULL_TOKENS when useTokens and no rentalFiat', () => {
    expect(
      getBookingPaymentType({
        useCredits: false,
        useTokens: true,
        rentalFiat: { val: 0, cur: CloserCurrencies.EUR },
      }),
    ).toBe(PaymentType.FULL_TOKENS);
  });

  it('returns PARTIAL_TOKENS when useTokens and rentalFiat has value', () => {
    expect(
      getBookingPaymentType({
        useCredits: false,
        useTokens: true,
        rentalFiat: { val: 30, cur: CloserCurrencies.EUR },
      }),
    ).toBe(PaymentType.PARTIAL_TOKENS);
  });

  it('returns FIAT when neither useCredits nor useTokens', () => {
    expect(
      getBookingPaymentType({
        useCredits: false,
        useTokens: false,
        rentalFiat: { val: 100, cur: CloserCurrencies.EUR },
      }),
    ).toBe(PaymentType.FIAT);
  });
});

describe('getPaymentDelta', () => {
  const rentalToken = { val: 10, cur: CloserCurrencies.TDF };

  it('returns null when fiat-only and delta is zero', () => {
    expect(
      getPaymentDelta(100, 100, false, false, rentalToken, 0, CloserCurrencies.EUR),
    ).toBeNull();
  });

  it('returns fiat delta only for fiat-only booking when total increased', () => {
    const result = getPaymentDelta(
      100,
      110,
      false,
      false,
      rentalToken,
      0,
      CloserCurrencies.EUR,
    );
    expect(result).not.toBeNull();
    expect(result!.fiat.val).toBe(10);
    expect(result!.fiat.cur).toBe(CloserCurrencies.EUR);
    expect(result!.token.val).toBe(0);
  });

  it('returns fiat delta for fiat-only when total decreased (refund)', () => {
    const result = getPaymentDelta(
      100,
      80,
      false,
      false,
      rentalToken,
      0,
      CloserCurrencies.EUR,
    );
    expect(result).not.toBeNull();
    expect(result!.fiat.val).toBe(-20);
  });

  it('returns token and fiat deltas when useTokens and accommodation delta non-zero', () => {
    const result = getPaymentDelta(
      50,
      55,
      true,
      false,
      rentalToken,
      15,
      CloserCurrencies.EUR,
    );
    expect(result).not.toBeNull();
    expect(result!.token.val).toBe(5);
    expect(result!.credits.val).toBe(0);
    expect(result!.fiat.val).toBe(5);
  });

  it('returns credits and fiat deltas when useCredits and accommodation delta non-zero', () => {
    const result = getPaymentDelta(
      50,
      52,
      false,
      true,
      rentalToken,
      12,
      CloserCurrencies.EUR,
    );
    expect(result).not.toBeNull();
    expect(result!.credits.val).toBe(2);
    expect(result!.token.val).toBe(0);
    expect(result!.fiat.val).toBe(2);
  });

  it('returns null when useTokens and accommodation delta is zero', () => {
    expect(
      getPaymentDelta(50, 50, true, false, rentalToken, 10, CloserCurrencies.EUR),
    ).toBeNull();
  });
});
