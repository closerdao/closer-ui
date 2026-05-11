import {
  STAY_TERMINAL_STATUSES,
  accommodationTokenTotalFromPriceLock,
  canChangeStayPaymentMethod,
  computeCreditsOwed,
  computeFiatOwed,
  computeTokensOwed,
  formatStayMoney,
  inferPaymentChoiceFromStay,
  isStayAwaitingPayment,
  isStayPaid,
  isStayTerminal,
} from '../stays.api';

import type { Stay, StayMoney } from '../../types/stay';

const baseStay = (overrides: Partial<Stay> = {}): Stay =>
  ({
    _id: 'stay_1',
    status: 'draft',
    listing: 'listing_1',
    start: '2026-06-01',
    end: '2026-06-05',
    duration: 4,
    adults: 2,
    children: 0,
    infants: 0,
    pets: 0,
    createdBy: 'user_1',
    created: '2026-05-01',
    updated: '2026-05-01',
    ...overrides,
  }) as Stay;

const money = (val: number, cur = 'EUR'): StayMoney => ({ val, cur });

describe('formatStayMoney', () => {
  it('returns empty string for falsy money', () => {
    expect(formatStayMoney(undefined)).toBe('');
    expect(formatStayMoney(null)).toBe('');
  });

  it('formats money objects to a string', () => {
    const out = formatStayMoney(money(100, 'EUR'));
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});

describe('isStayTerminal', () => {
  it('STAY_TERMINAL_STATUSES contains cancelled and rejected', () => {
    expect(STAY_TERMINAL_STATUSES).toContain('cancelled');
    expect(STAY_TERMINAL_STATUSES).toContain('rejected');
  });

  it('returns true for cancelled status string', () => {
    expect(isStayTerminal('cancelled')).toBe(true);
    expect(isStayTerminal('rejected')).toBe(true);
  });

  it('returns false for non-terminal statuses', () => {
    expect(isStayTerminal('draft')).toBe(false);
    expect(isStayTerminal('paid')).toBe(false);
    expect(isStayTerminal('confirmed')).toBe(false);
  });

  it('accepts a stay object', () => {
    expect(isStayTerminal(baseStay({ status: 'cancelled' }))).toBe(true);
    expect(isStayTerminal(baseStay({ status: 'paid' }))).toBe(false);
  });
});

describe('isStayPaid / isStayAwaitingPayment', () => {
  it('detects paid stays', () => {
    expect(isStayPaid(baseStay({ status: 'paid' }))).toBe(true);
    expect(isStayPaid(baseStay({ status: 'confirmed' }))).toBe(false);
  });

  it('detects awaiting-payment stays', () => {
    expect(isStayAwaitingPayment(baseStay({ status: 'confirmed' }))).toBe(true);
    expect(
      isStayAwaitingPayment(baseStay({ status: 'pending-payment' })),
    ).toBe(true);
    expect(isStayAwaitingPayment(baseStay({ status: 'paid' }))).toBe(false);
    expect(isStayAwaitingPayment(baseStay({ status: 'draft' }))).toBe(false);
  });
});

describe('compute*Owed', () => {
  it('returns the gap between target and paid for fiat', () => {
    const stay = baseStay({
      fiatTarget: money(100),
      fiatPaid: money(40),
    });
    expect(computeFiatOwed(stay)).toBe(60);
  });

  it('falls back to priceLock.total when fiatTarget is missing', () => {
    const stay = baseStay({
      priceLock: {
        total: money(120),
        subtotal: money(120),
        vat: money(0),
        platformFee: money(0),
        affiliateFee: money(0),
        dailyRentalFiat: money(30),
        dailyRentalToken: { val: 30, cur: 'TDF' },
        appliedCredits: { val: 0, cur: 'credits' },
        appliedTokens: { val: 0, cur: 'TDF' },
        currency: 'EUR',
        lockedAt: '2026-05-01',
        lines: {
          accommodation: money(120),
          accommodationGross: money(120),
          food: money(0),
          utility: money(0),
          event: money(0),
        },
      },
    });
    expect(computeFiatOwed(stay)).toBe(120);
  });

  it('clamps to zero when paid exceeds target', () => {
    const stay = baseStay({
      fiatTarget: money(50),
      fiatPaid: money(70),
    });
    expect(computeFiatOwed(stay)).toBe(0);
  });

  it('computes credits and tokens owed', () => {
    const stay = baseStay({
      creditsTarget: { val: 30, cur: 'credits' },
      creditsPaid: { val: 10, cur: 'credits' },
      tokensTarget: { val: 5, cur: 'TDF' },
      tokensStaked: { val: 2, cur: 'TDF' },
    });
    expect(computeCreditsOwed(stay)).toBe(20);
    expect(computeTokensOwed(stay)).toBe(3);
  });

  it('returns zero when no targets are set', () => {
    const stay = baseStay();
    expect(computeFiatOwed(stay)).toBe(0);
    expect(computeCreditsOwed(stay)).toBe(0);
    expect(computeTokensOwed(stay)).toBe(0);
  });
});

describe('accommodationTokenTotalFromPriceLock', () => {
  const pl = (daily: number) => ({
    dailyRentalToken: { val: daily, cur: 'TDF' },
  });

  it('multiplies by adults for shared listings', () => {
    expect(accommodationTokenTotalFromPriceLock(pl(1), 6, 2, false)).toBe(12);
  });

  it('does not multiply by adults for private listings', () => {
    expect(accommodationTokenTotalFromPriceLock(pl(1), 6, 2, true)).toBe(6);
  });
});

describe('canChangeStayPaymentMethod', () => {
  it('allows change in non-terminal status with no funds spent', () => {
    expect(canChangeStayPaymentMethod(baseStay({ status: 'draft' }))).toBe(
      true,
    );
    expect(canChangeStayPaymentMethod(baseStay({ status: 'confirmed' }))).toBe(
      true,
    );
  });

  it('blocks change once credits have been spent', () => {
    const stay = baseStay({
      status: 'confirmed',
      creditsPaid: { val: 5, cur: 'credits' },
    });
    expect(canChangeStayPaymentMethod(stay)).toBe(false);
  });

  it('blocks change once tokens have been staked', () => {
    const stay = baseStay({
      status: 'confirmed',
      tokensStaked: { val: 5, cur: 'TDF' },
    });
    expect(canChangeStayPaymentMethod(stay)).toBe(false);
  });

  it('blocks change for terminal status', () => {
    expect(canChangeStayPaymentMethod(baseStay({ status: 'cancelled' }))).toBe(
      false,
    );
    expect(canChangeStayPaymentMethod(baseStay({ status: 'rejected' }))).toBe(
      false,
    );
  });
});

describe('inferPaymentChoiceFromStay', () => {
  it('defaults to fiat when no credits/tokens applied', () => {
    expect(inferPaymentChoiceFromStay(baseStay())).toBe('fiat');
  });

  it('returns full-credits when credits cover full token cost', () => {
    const stay = baseStay({
      adults: 1,
      duration: 4,
      creditsTarget: { val: 40, cur: 'credits' },
      priceLock: {
        total: money(0),
        subtotal: money(0),
        vat: money(0),
        platformFee: money(0),
        affiliateFee: money(0),
        dailyRentalFiat: money(50),
        dailyRentalToken: { val: 10, cur: 'TDF' },
        appliedCredits: { val: 40, cur: 'credits' },
        appliedTokens: { val: 0, cur: 'TDF' },
        currency: 'EUR',
        lockedAt: '2026-05-01',
        lines: {
          accommodation: money(0),
          accommodationGross: money(200),
          food: money(0),
          utility: money(0),
          event: money(0),
        },
      },
    });
    expect(inferPaymentChoiceFromStay(stay)).toBe('full-credits');
  });

  it('returns partial-credits when credits are below full cost', () => {
    const stay = baseStay({
      adults: 1,
      duration: 4,
      creditsTarget: { val: 10, cur: 'credits' },
      priceLock: {
        total: money(150),
        subtotal: money(150),
        vat: money(0),
        platformFee: money(0),
        affiliateFee: money(0),
        dailyRentalFiat: money(50),
        dailyRentalToken: { val: 10, cur: 'TDF' },
        appliedCredits: { val: 10, cur: 'credits' },
        appliedTokens: { val: 0, cur: 'TDF' },
        currency: 'EUR',
        lockedAt: '2026-05-01',
        lines: {
          accommodation: money(150),
          accommodationGross: money(200),
          food: money(0),
          utility: money(0),
          event: money(0),
        },
      },
    });
    expect(inferPaymentChoiceFromStay(stay)).toBe('partial-credits');
  });

  it('returns full-tokens when tokens cover full token cost', () => {
    const stay = baseStay({
      adults: 1,
      duration: 4,
      tokensTarget: { val: 40, cur: 'TDF' },
      priceLock: {
        total: money(0),
        subtotal: money(0),
        vat: money(0),
        platformFee: money(0),
        affiliateFee: money(0),
        dailyRentalFiat: money(50),
        dailyRentalToken: { val: 10, cur: 'TDF' },
        appliedCredits: { val: 0, cur: 'credits' },
        appliedTokens: { val: 40, cur: 'TDF' },
        currency: 'EUR',
        lockedAt: '2026-05-01',
        lines: {
          accommodation: money(0),
          accommodationGross: money(200),
          food: money(0),
          utility: money(0),
          event: money(0),
        },
      },
    });
    expect(inferPaymentChoiceFromStay(stay)).toBe('full-tokens');
  });

  it('returns partial-tokens when tokens are below full cost', () => {
    const stay = baseStay({
      adults: 1,
      duration: 4,
      tokensTarget: { val: 5, cur: 'TDF' },
      priceLock: {
        total: money(150),
        subtotal: money(150),
        vat: money(0),
        platformFee: money(0),
        affiliateFee: money(0),
        dailyRentalFiat: money(50),
        dailyRentalToken: { val: 10, cur: 'TDF' },
        appliedCredits: { val: 0, cur: 'credits' },
        appliedTokens: { val: 5, cur: 'TDF' },
        currency: 'EUR',
        lockedAt: '2026-05-01',
        lines: {
          accommodation: money(150),
          accommodationGross: money(200),
          food: money(0),
          utility: money(0),
          event: money(0),
        },
      },
    });
    expect(inferPaymentChoiceFromStay(stay)).toBe('partial-tokens');
  });

  it('prefers tokens over credits when both target are set', () => {
    const stay = baseStay({
      duration: 4,
      creditsTarget: { val: 5, cur: 'credits' },
      tokensTarget: { val: 5, cur: 'TDF' },
    });
    expect(inferPaymentChoiceFromStay(stay)).toBe('partial-tokens');
  });

  it('returns full-tokens when guest-weighted accommodation matches tokens target', () => {
    const stay = baseStay({
      adults: 2,
      duration: 6,
      tokensTarget: { val: 12, cur: 'TDF' },
      priceLock: {
        total: money(0),
        subtotal: money(0),
        vat: money(0),
        platformFee: money(0),
        affiliateFee: money(0),
        dailyRentalFiat: money(50),
        dailyRentalToken: { val: 1, cur: 'TDF' },
        appliedCredits: { val: 0, cur: 'credits' },
        appliedTokens: { val: 12, cur: 'TDF' },
        currency: 'EUR',
        lockedAt: '2026-05-01',
        lines: {
          accommodation: money(0),
          accommodationGross: money(200),
          food: money(0),
          utility: money(0),
          event: money(0),
        },
      },
    });
    expect(inferPaymentChoiceFromStay(stay)).toBe('full-tokens');
  });

  it('respects an explicit totalAccommodationTokens override', () => {
    const stay = baseStay({
      duration: 4,
      creditsTarget: { val: 40, cur: 'credits' },
    });
    expect(inferPaymentChoiceFromStay(stay, 40)).toBe('full-credits');
    expect(inferPaymentChoiceFromStay(stay, 100)).toBe('partial-credits');
  });
});
