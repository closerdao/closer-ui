import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import type { Stay } from '../../types/stay';
import {
  StayTokenCreditHint,
  getStayTokenCreditHintTiming,
} from './StayTokenCreditHint';

const mockEligibility = jest.fn();
jest.mock('../../hooks/useStayCreditsEligibility', () => ({
  useStayCreditsEligibility: (stay: Stay | null) => mockEligibility(stay),
}));

const money = (val: number, cur = 'EUR') => ({ val, cur });
const stay = (overrides: Partial<Stay> = {}) =>
  ({
    _id: 'stay_1',
    status: 'confirmed',
    start: '2026-11-01',
    end: '2026-11-04',
    duration: 3,
    adults: 1,
    rentalToken: money(3, 'TDF'),
    priceLock: { dailyRentalToken: money(1, 'TDF') },
    ...overrides,
  }) as Stay;

const originalWeb3 = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING;
beforeEach(() => {
  process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'false';
  mockEligibility.mockReturnValue({
    creditsBalance: 5,
    canApplyCreditsAtStart: true,
  });
});
afterAll(() => {
  process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = originalWeb3;
});

describe('getStayTokenCreditHintTiming', () => {
  test('offers it now to a member drafting a stay', () => {
    expect(getStayTokenCreditHintTiming(stay({ status: 'draft' }), true)).toBe(
      'available',
    );
  });

  test('defers to confirmation for a non-member draft or a pending stay', () => {
    expect(getStayTokenCreditHintTiming(stay({ status: 'draft' }), false)).toBe(
      'after-confirmation',
    );
    expect(
      getStayTokenCreditHintTiming(stay({ status: 'pending' }), true),
    ).toBe('after-confirmation');
  });

  test('offers it on a confirmed stay that has no method chosen yet', () => {
    expect(getStayTokenCreditHintTiming(stay(), false)).toBe('available');
  });

  test('stays silent once credits or tokens are chosen or paid', () => {
    expect(
      getStayTokenCreditHintTiming(
        stay({ creditsTarget: money(2, 'credits') }),
        true,
      ),
    ).toBeNull();
    expect(
      getStayTokenCreditHintTiming(stay({ useTokens: true }), true),
    ).toBeNull();
    expect(
      getStayTokenCreditHintTiming(stay({ status: 'paid' }), true),
    ).toBeNull();
  });

  test('never applies to volunteer, residency or token-less stays', () => {
    expect(
      getStayTokenCreditHintTiming(
        stay({ volunteerInfo: { bookingType: 'volunteer' } } as Partial<Stay>),
        true,
      ),
    ).toBeNull();
    expect(
      getStayTokenCreditHintTiming(
        stay({ residencyAgreementId: 'agr_1' }),
        true,
      ),
    ).toBeNull();
    expect(
      getStayTokenCreditHintTiming(
        stay({ rentalToken: money(0, 'TDF'), priceLock: undefined }),
        true,
      ),
    ).toBeNull();
  });
});

describe('StayTokenCreditHint', () => {
  test('tells a member with credits they can use them on the payment step', () => {
    renderWithNextIntl(
      <StayTokenCreditHint stay={stay({ status: 'draft' })} isMember />,
    );
    expect(screen.getByTestId('stay-token-credit-hint')).toHaveTextContent(
      'You have 5 credits you can put toward your accommodation on the payment step.',
    );
  });

  test('mentions tokens and confirmation for a non-member when web3 is on', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
    renderWithNextIntl(
      <StayTokenCreditHint stay={stay({ status: 'draft' })} isMember={false} />,
    );
    expect(screen.getByTestId('stay-token-credit-hint')).toHaveTextContent(
      /Once your stay is confirmed, you can pay for your accommodation with credits or \w+\./,
    );
  });

  test('renders nothing without usable credits or tokens', () => {
    mockEligibility.mockReturnValue({
      creditsBalance: 5,
      canApplyCreditsAtStart: false,
    });
    renderWithNextIntl(<StayTokenCreditHint stay={stay()} isMember />);
    expect(screen.queryByTestId('stay-token-credit-hint')).toBeNull();
  });

  test('skips the credits lookup when no hint can apply', () => {
    renderWithNextIntl(
      <StayTokenCreditHint stay={stay({ status: 'paid' })} isMember />,
    );
    expect(mockEligibility).toHaveBeenLastCalledWith(null);
    expect(screen.queryByTestId('stay-token-credit-hint')).toBeNull();
  });
});
