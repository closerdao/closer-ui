import type { Stay } from '../../types/stay';
import { computeStayCreditsTopUp, computeStayTokensTopUp } from '../stays.api';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

/*
 * A five night stay paid with credits, then extended by two nights. The
 * accommodation total is now seven credits, five of which are already spent.
 */
const extendedCreditsStay = (overrides: Partial<Stay> = {}): Stay =>
  ({
    _id: 'stay_1',
    status: 'pending-payment',
    listing: 'listing_1',
    start: '2026-09-10',
    end: '2026-09-17',
    duration: 7,
    adults: 1,
    creditsPaid: { val: 5, cur: 'credits' },
    creditsTarget: { val: 5, cur: 'credits' },
    createdBy: 'user_1',
    created: '2026-09-01',
    updated: '2026-09-14',
    ...overrides,
  }) as Stay;

describe('computeStayCreditsTopUp', () => {
  it('offers to cover only the added nights, sending the new total', () => {
    const topUp = computeStayCreditsTopUp(extendedCreditsStay(), 10, 7);
    expect(topUp).toEqual({
      canAugment: true,
      alreadyApplied: 5,
      delta: 2,
      total: 7,
    });
  });

  it('caps the top-up at the remaining credit balance', () => {
    const topUp = computeStayCreditsTopUp(extendedCreditsStay(), 1, 7);
    expect(topUp.delta).toBe(1);
    expect(topUp.total).toBe(6);
  });

  it('has nothing to add when the balance is empty', () => {
    const topUp = computeStayCreditsTopUp(extendedCreditsStay(), 0, 7);
    expect(topUp.canAugment).toBe(true);
    expect(topUp.delta).toBe(0);
    expect(topUp.total).toBe(5);
  });

  it('does not augment when nothing was spent yet (method still changeable)', () => {
    const topUp = computeStayCreditsTopUp(
      extendedCreditsStay({ creditsPaid: { val: 0, cur: 'credits' } }),
      10,
      7,
    );
    expect(topUp.canAugment).toBe(false);
    expect(topUp.total).toBe(7);
  });

  it('does not augment once the stay is paid or the total is already covered', () => {
    expect(
      computeStayCreditsTopUp(extendedCreditsStay({ status: 'paid' }), 10, 7)
        .canAugment,
    ).toBe(false);
    expect(
      computeStayCreditsTopUp(extendedCreditsStay(), 10, 5).canAugment,
    ).toBe(false);
  });
});

describe('computeStayTokensTopUp', () => {
  it('tops up staked tokens by the added nights', () => {
    const stay = extendedCreditsStay({
      creditsPaid: { val: 0, cur: 'credits' },
      creditsTarget: { val: 0, cur: 'credits' },
      tokensStaked: { val: 5, cur: 'TDF' },
      tokensTarget: { val: 5, cur: 'TDF' },
    });
    expect(computeStayTokensTopUp(stay, 3, 7)).toEqual({
      canAugment: true,
      alreadyApplied: 5,
      delta: 2,
      total: 7,
    });
  });
});
