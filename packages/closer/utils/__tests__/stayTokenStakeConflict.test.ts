import type { StakeHoldingCandidate } from '../../types/booking';
import { pickStayHoldingNights } from '../stayTokenStakeConflict';

const stay = { _id: 'new', start: '2027-01-10', end: '2027-01-14' };

const booking = (overrides: Record<string, unknown>) =>
  ({
    _id: 'other',
    start: '2027-01-08',
    end: '2027-01-12',
    status: 'paid',
    tokensStaked: { val: 4, cur: 'TDF' },
    ...overrides,
  }) as StakeHoldingCandidate;

describe('pickStayHoldingNights', () => {
  it('picks an overlapping stay with tokens staked', () => {
    const held = booking({});
    expect(pickStayHoldingNights(stay, [held])).toBe(held);
  });

  it('counts a legacy stake recorded only by its transaction', () => {
    const held = booking({ tokensStaked: undefined, transactionId: '0xabc' });
    expect(pickStayHoldingNights(stay, [held])).toBe(held);
  });

  it('ignores the stay itself, stays that do not overlap, and fiat stays', () => {
    expect(
      pickStayHoldingNights(stay, [
        booking({ _id: 'new' }),
        booking({ start: '2027-01-14', end: '2027-01-16' }),
        booking({ tokensStaked: { val: 0, cur: 'TDF' } }),
      ]),
    ).toBeNull();
  });
});
