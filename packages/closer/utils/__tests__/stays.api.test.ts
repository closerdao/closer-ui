import type { Stay, StayMoney, StayQuoteResponse } from '../../types/stay';
import {
  STAY_TERMINAL_STATUSES,
  accommodationTokenTotalFromPriceLock,
  buildStayTokenStakePlan,
  canApplyTokenOrCreditsToStay,
  canAugmentTokenOrCreditsPayment,
  canChangeStayPaymentMethod,
  canShowStayTokenCreditPaymentOptions,
  computeCreditsOwed,
  computeFiatDiscountFromStayQuote,
  computeFiatOwed,
  computeTokensOwed,
  formatStayMoney,
  getStayAccommodationNightCount,
  inferPaymentChoiceFromStay,
  isStayAwaitingHostApproval,
  isStayAwaitingPayment,
  isStayCheckoutDraft,
  isStayCollectingRemainingFiat,
  isStayPaid,
  isStayTerminal,
  isVolunteerStay,
  stayUsesTokenAccommodation,
  tokenBalanceToRequestedWei,
} from '../stays.api';

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
  } as Stay);

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

  it('returns false for null or undefined', () => {
    expect(isStayTerminal(null)).toBe(false);
    expect(isStayTerminal(undefined)).toBe(false);
  });
});

describe('isStayPaid / isStayAwaitingPayment', () => {
  it('detects paid stays', () => {
    expect(isStayPaid(baseStay({ status: 'paid' }))).toBe(true);
    expect(isStayPaid(baseStay({ status: 'confirmed' }))).toBe(false);
  });

  it('detects awaiting-payment stays', () => {
    expect(isStayAwaitingPayment(baseStay({ status: 'confirmed' }))).toBe(true);
    expect(isStayAwaitingPayment(baseStay({ status: 'pending-payment' }))).toBe(
      true,
    );
    expect(isStayAwaitingPayment(baseStay({ status: 'paid' }))).toBe(false);
    expect(isStayAwaitingPayment(baseStay({ status: 'draft' }))).toBe(false);
  });

  it('returns false for null or undefined stay', () => {
    expect(isStayPaid(null)).toBe(false);
    expect(isStayPaid(undefined)).toBe(false);
    expect(isStayAwaitingPayment(null)).toBe(false);
    expect(isStayAwaitingPayment(undefined)).toBe(false);
  });
});

describe('isStayCollectingRemainingFiat', () => {
  it('includes tokens-staked and credits-paid for remaining fiat collection', () => {
    expect(
      isStayCollectingRemainingFiat(baseStay({ status: 'tokens-staked' })),
    ).toBe(true);
    expect(
      isStayCollectingRemainingFiat(baseStay({ status: 'credits-paid' })),
    ).toBe(true);
  });

  it('includes confirmed and pending-payment', () => {
    expect(
      isStayCollectingRemainingFiat(baseStay({ status: 'confirmed' })),
    ).toBe(true);
    expect(
      isStayCollectingRemainingFiat(baseStay({ status: 'pending-payment' })),
    ).toBe(true);
  });

  it('excludes paid and draft', () => {
    expect(isStayCollectingRemainingFiat(baseStay({ status: 'paid' }))).toBe(
      false,
    );
    expect(isStayCollectingRemainingFiat(baseStay({ status: 'draft' }))).toBe(
      false,
    );
  });
});

describe('canAugmentTokenOrCreditsPayment', () => {
  it('is true on confirmed when tokens or credits are still owed', () => {
    expect(
      canAugmentTokenOrCreditsPayment(
        baseStay({
          status: 'confirmed',
          tokensTarget: { val: 10, cur: 'TDF' },
          tokensStaked: { val: 3, cur: 'TDF' },
        }),
      ),
    ).toBe(true);
    expect(
      canAugmentTokenOrCreditsPayment(
        baseStay({
          status: 'confirmed',
          creditsTarget: { val: 50, cur: 'credits' },
          creditsPaid: { val: 10, cur: 'credits' },
        }),
      ),
    ).toBe(true);
  });

  it('is false when not awaiting payment or nothing owed', () => {
    expect(canAugmentTokenOrCreditsPayment(baseStay({ status: 'draft' }))).toBe(
      false,
    );
    expect(
      canAugmentTokenOrCreditsPayment(
        baseStay({
          status: 'confirmed',
          tokensTarget: { val: 5, cur: 'TDF' },
          tokensStaked: { val: 5, cur: 'TDF' },
          creditsTarget: { val: 0, cur: 'credits' },
        }),
      ),
    ).toBe(false);
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

  it('normalizes floating-point noise in tokens owed', () => {
    const stay = baseStay({
      tokensTarget: { val: 2, cur: 'TDF' },
      tokensStaked: { val: 1.6, cur: 'TDF' },
    });
    expect(computeTokensOwed(stay)).toBe(0.4);
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

describe('canApplyTokenOrCreditsToStay', () => {
  it('returns false for host-pending regardless of casing', () => {
    expect(canApplyTokenOrCreditsToStay(baseStay({ status: 'pending' }))).toBe(
      false,
    );
    expect(canApplyTokenOrCreditsToStay(baseStay({ status: 'Pending' }))).toBe(
      false,
    );
    expect(
      canApplyTokenOrCreditsToStay(baseStay({ status: ' PENDING ' })),
    ).toBe(false);
  });

  it('returns false for draft regardless of casing', () => {
    expect(canApplyTokenOrCreditsToStay(baseStay({ status: 'draft' }))).toBe(
      false,
    );
    expect(canApplyTokenOrCreditsToStay(baseStay({ status: 'Draft' }))).toBe(
      false,
    );
  });

  it('returns true only for confirmed and pending-payment', () => {
    expect(
      canApplyTokenOrCreditsToStay(baseStay({ status: 'confirmed' })),
    ).toBe(true);
    expect(
      canApplyTokenOrCreditsToStay(baseStay({ status: 'pending-payment' })),
    ).toBe(true);
  });

  it('returns false for paid and terminal statuses', () => {
    expect(canApplyTokenOrCreditsToStay(baseStay({ status: 'paid' }))).toBe(
      false,
    );
    expect(
      canApplyTokenOrCreditsToStay(baseStay({ status: 'cancelled' })),
    ).toBe(false);
  });

  it('detects host pending and draft via helpers', () => {
    expect(isStayAwaitingHostApproval(baseStay({ status: 'Pending' }))).toBe(
      true,
    );
    expect(isStayCheckoutDraft(baseStay({ status: 'Draft' }))).toBe(true);
  });
});

describe('canShowStayTokenCreditPaymentOptions', () => {
  it('returns false when stay is missing', () => {
    expect(canShowStayTokenCreditPaymentOptions(null, true)).toBe(false);
    expect(canShowStayTokenCreditPaymentOptions(undefined, true)).toBe(false);
  });

  it('shows for draft when member only', () => {
    const draft = baseStay({ status: 'draft' });
    expect(canShowStayTokenCreditPaymentOptions(draft, true)).toBe(true);
    expect(canShowStayTokenCreditPaymentOptions(draft, false)).toBe(false);
  });

  it('shows for confirmed when member or non-member', () => {
    const stay = baseStay({ status: 'confirmed' });
    expect(canShowStayTokenCreditPaymentOptions(stay, false)).toBe(true);
    expect(canShowStayTokenCreditPaymentOptions(stay, true)).toBe(true);
  });

  it('shows for pending-payment when member only', () => {
    const stay = baseStay({ status: 'pending-payment' });
    expect(canShowStayTokenCreditPaymentOptions(stay, true)).toBe(true);
    expect(canShowStayTokenCreditPaymentOptions(stay, false)).toBe(false);
  });

  it('hides when token or credits cannot be applied', () => {
    expect(
      canShowStayTokenCreditPaymentOptions(
        baseStay({ status: 'pending' }),
        true,
      ),
    ).toBe(false);
    expect(
      canShowStayTokenCreditPaymentOptions(baseStay({ status: 'paid' }), true),
    ).toBe(false);
  });

  it('never offers tokens or credits on a volunteer or residence stay', () => {
    // Accommodation is 0, but the server would still stake off the listing
    // price and strand the stay in pending-payment.
    expect(
      canShowStayTokenCreditPaymentOptions(
        {
          ...baseStay({ status: 'confirmed' }),
          volunteerInfo: { bookingType: 'volunteer' },
        },
        true,
      ),
    ).toBe(false);
    expect(
      canShowStayTokenCreditPaymentOptions(
        {
          ...baseStay({ status: 'draft' }),
          volunteerInfo: { bookingType: 'residence' },
        },
        true,
      ),
    ).toBe(false);
  });
});

describe('isVolunteerStay', () => {
  it('matches volunteer and residence booking types only', () => {
    expect(
      isVolunteerStay({ volunteerInfo: { bookingType: 'volunteer' } }),
    ).toBe(true);
    expect(
      isVolunteerStay({ volunteerInfo: { bookingType: 'residence' } }),
    ).toBe(true);
    expect(isVolunteerStay({ volunteerInfo: {} })).toBe(false);
    expect(isVolunteerStay(null)).toBe(false);
  });
});

describe('stayUsesTokenAccommodation', () => {
  it('returns true when booking useTokens flag is set', () => {
    expect(stayUsesTokenAccommodation(baseStay({ useTokens: true }))).toBe(
      true,
    );
  });

  it('returns true when stay has partial or full token payment choice', () => {
    const partial = baseStay({
      status: 'confirmed',
      rentalToken: { val: 10, cur: 'TDF' },
      tokensTarget: { val: 3, cur: 'TDF' },
    });
    expect(stayUsesTokenAccommodation(partial)).toBe(true);

    const full = baseStay({
      status: 'confirmed',
      rentalToken: { val: 4, cur: 'TDF' },
      tokensTarget: { val: 4, cur: 'TDF' },
    });
    expect(stayUsesTokenAccommodation(full)).toBe(true);
  });

  it('returns false for fiat-only accommodation when useTokens is unset', () => {
    const stay = baseStay({
      status: 'confirmed',
      rentalToken: { val: 10, cur: 'TDF' },
      tokensTarget: { val: 0, cur: 'TDF' },
    });
    expect(stayUsesTokenAccommodation(stay)).toBe(false);
  });
});

describe('computeFiatDiscountFromStayQuote', () => {
  it('derives discount from negative delta on amount owed', () => {
    const stay = baseStay({
      fiatTarget: { val: 500, cur: 'EUR' },
      fiatPaid: { val: 0, cur: 'EUR' },
    });
    const quote = {
      priceLock: { total: { val: 400, cur: 'EUR' } },
      currentTotal: { val: 400, cur: 'EUR' },
      delta: { fiat: { val: -100, cur: 'EUR' } },
    } as unknown as StayQuoteResponse;
    expect(computeFiatDiscountFromStayQuote(stay, quote)).toEqual({
      amount: 100,
      cur: 'EUR',
    });
  });

  it('uses priceLock total when delta is not finite', () => {
    const stay = baseStay({
      fiatTarget: { val: 500, cur: 'EUR' },
      fiatPaid: { val: 0, cur: 'EUR' },
    });
    const quote = {
      priceLock: { total: { val: 300, cur: 'EUR' } },
      currentTotal: { val: 300, cur: 'EUR' },
      delta: { fiat: { val: Number.NaN, cur: 'EUR' } },
    } as unknown as StayQuoteResponse;
    expect(computeFiatDiscountFromStayQuote(stay, quote)).toEqual({
      amount: 200,
      cur: 'EUR',
    });
  });
});

/*
 * A volunteer season's stay owes exactly `tokensTarget` — what the volunteer
 * chose to stake against a room above the covered one — and the server
 * verifies each night on chain against `tokensTarget / nights`. Nothing here
 * may read `dailyRentalToken` (the listing's full nightly rate) or
 * `rentalToken` (0 on every team booking) to size that stake.
 */
describe('a volunteer season stay', () => {
  const residencyStay = (overrides: Partial<Stay> = {}) =>
    baseStay({
      status: 'confirmed',
      isTeamBooking: true,
      residencyAgreementId: 'agr_1',
      start: '2026-09-01',
      end: '2026-11-30',
      duration: 90,
      adults: 1,
      rentalToken: { val: 0, cur: 'TDF' },
      tokensTarget: { val: 9, cur: 'TDF' },
      tokensStaked: { val: 0, cur: 'TDF' },
      priceLock: {
        dailyRentalToken: { val: 3, cur: 'TDF' },
      } as any,
      ...overrides,
    });

  it('sizes the stake off tokensTarget, never the listing rate', () => {
    expect(getStayAccommodationTokenTotal(residencyStay())).toBe(9);
    expect(
      getStayAccommodationTokenTotal(
        residencyStay({ tokensTarget: { val: 0, cur: 'TDF' } }),
      ),
    ).toBe(0);
  });

  it('stakes tokensTarget / nights on every night of the season', () => {
    const stay = residencyStay();
    const plan = buildStayTokenStakePlan(stay, computeTokensOwed(stay));
    // 9 tokens over 90 nights is 0.1 a night — not the 3 a night the listing
    // charges a guest.
    expect(plan?.dailyValue).toBe(0.1);
    expect(plan?.bookingNights.length).toBe(90);
    expect(plan?.tokenAmount).toBe(9);
  });

  it('offers the token rail once countersigned, whatever the volunteer info says', () => {
    const stay = residencyStay({
      volunteerInfo: { bookingType: 'residence' } as any,
    });
    expect(canShowStayTokenCreditPaymentOptions(stay, false)).toBe(true);
    // Not before a space-host has countersigned.
    expect(
      canShowStayTokenCreditPaymentOptions(
        residencyStay({ status: 'pending' }),
        true,
      ),
    ).toBe(false);
  });

  it('keeps the frozen targets by refusing a payment method switch', () => {
    expect(canChangeStayPaymentMethod(residencyStay())).toBe(false);
  });
});

describe('buildStayTokenStakePlan', () => {
  const backendPriceLock = {
    lines: {
      accommodation: money(230.3),
      accommodationGross: money(700),
      food: money(0),
      utility: money(0),
      event: money(0),
    },
    subtotal: money(230.3),
    vat: money(0),
    platformFee: money(0),
    affiliateFee: money(0),
    total: money(230.3),
    dailyRentalFiat: money(100),
    dailyRentalToken: { val: 7, cur: 'TDF' },
    rentalToken: { val: 49, cur: 'TDF' },
    appliedCredits: { val: 0, cur: 'credits' },
    appliedTokens: { val: 25.97, cur: 'TDF' },
    tokenStakePlan: {
      dates: [
        [2026, 152],
        [2026, 153],
        [2026, 154],
        [2026, 155],
        [2026, 156],
        [2026, 157],
        [2026, 158],
      ],
      pricePerNightWei: '3710000000000000000',
      totalWei: '25970000000000000000',
      total: { val: 25.97, cur: 'TDF' },
      decimals: 18,
      displayDecimals: 6,
    },
    accommodationPricing: {
      fiat: {} as any,
      credits: {} as any,
      token: { effectivePerNight: { val: 7, cur: 'TDF' } } as any,
    },
    currency: 'EUR',
    lockedAt: '2026-05-01',
  };

  it('maps the backend-authoritative dates and uniform wei price verbatim', () => {
    const plan = buildStayTokenStakePlan(
      baseStay({ priceLock: backendPriceLock }),
      999,
    );
    expect(plan).toEqual({
      pricePerNightWei: '3710000000000000000',
      totalWei: '25970000000000000000',
      decimals: 18,
      displayDecimals: 6,
      tokenAmount: 25.97,
      bookingNights: backendPriceLock.tokenStakePlan.dates,
    });
  });

  it('derives a missing totalWei from the authoritative uniform nightly price', () => {
    const plan = buildStayTokenStakePlan(
      baseStay({
        priceLock: {
          ...backendPriceLock,
          tokenStakePlan: {
            ...backendPriceLock.tokenStakePlan,
            totalWei: '' as any,
          },
        },
      }),
    );

    expect(plan?.totalWei).toBe('25970000000000000000');
  });

  it('does not reconstruct a stake plan from listing-era daily prices', () => {
    expect(
      buildStayTokenStakePlan(
        baseStay({
          priceLock: {
            ...backendPriceLock,
            tokenStakePlan: undefined,
          },
        }),
        25.97,
      ),
    ).toBeNull();
  });
});

describe('tokenBalanceToRequestedWei', () => {
  it('preserves fractional wallet balance to token precision', () => {
    expect(tokenBalanceToRequestedWei('4.123456789012345678', 18)).toBe(
      '4123456789012345678',
    );
  });

  it('truncates excess precision instead of rounding above the wallet balance', () => {
    expect(tokenBalanceToRequestedWei('1.2349', 3)).toBe('1234');
  });
});

describe('getStayAccommodationNightCount', () => {
  it('prefers calendar nights from start/end over inconsistent duration', () => {
    expect(
      getStayAccommodationNightCount(
        baseStay({
          start: '2026-11-11',
          end: '2026-11-15',
          duration: 99,
        }),
      ),
    ).toBe(4);
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

  it('blocks change while waiting for host approval', () => {
    expect(canChangeStayPaymentMethod(baseStay({ status: 'pending' }))).toBe(
      false,
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
      creditsTarget: { val: 80, cur: 'credits' },
      priceLock: {
        total: money(0),
        subtotal: money(0),
        vat: money(0),
        platformFee: money(0),
        affiliateFee: money(0),
        dailyRentalFiat: money(50),
        dailyRentalToken: { val: 10, cur: 'TDF' },
        appliedCredits: { val: 80, cur: 'credits' },
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
      tokensTarget: { val: 80, cur: 'TDF' },
      priceLock: {
        total: money(0),
        subtotal: money(0),
        vat: money(0),
        platformFee: money(0),
        affiliateFee: money(0),
        dailyRentalFiat: money(50),
        dailyRentalToken: { val: 10, cur: 'TDF' },
        appliedCredits: { val: 0, cur: 'credits' },
        appliedTokens: { val: 80, cur: 'TDF' },
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
