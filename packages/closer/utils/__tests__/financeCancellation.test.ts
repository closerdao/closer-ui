import { FinanceApplication } from '../../types/subscriptions';
import {
  canCancelFinanceApplication,
  getFinanceCancellationSummary,
  isFinanceApplicationCancelled,
} from '../financeCancellation';

const buildApplication = (
  overrides: Partial<FinanceApplication> = {},
): FinanceApplication =>
  ({
    _id: 'app-1',
    userId: 'user-1',
    status: 'up-to-date',
    iban: 'PT50000000000000000000000',
    tokensToFinance: 30,
    totalToPayInFiat: 9000,
    monthlyPaymentAmount: 300,
    downPaymentAmount: 900,
    isDownPaymentMade: true,
    charges: [],
    ...overrides,
  } as FinanceApplication);

const paidCharge = (val: number) => ({
  status: 'paid',
  amount: { total: { val } },
});

describe('canCancelFinanceApplication', () => {
  it('allows cancelling contracts that are still running', () => {
    expect(
      canCancelFinanceApplication(buildApplication({ status: 'up-to-date' })),
    ).toBe(true);
    expect(
      canCancelFinanceApplication(
        buildApplication({ status: 'pending-payment' }),
      ),
    ).toBe(true);
    expect(
      canCancelFinanceApplication(buildApplication({ status: 'delinquent' })),
    ).toBe(true);
  });

  it('refuses contracts that are already closed', () => {
    expect(
      canCancelFinanceApplication(buildApplication({ status: 'cancelled' })),
    ).toBe(false);
    expect(
      canCancelFinanceApplication(buildApplication({ status: 'completed' })),
    ).toBe(false);
    expect(canCancelFinanceApplication(null)).toBe(false);
  });

  it('refuses a contract the API spelled with one l', () => {
    expect(
      canCancelFinanceApplication(buildApplication({ status: 'canceled' })),
    ).toBe(false);
  });
});

describe('isFinanceApplicationCancelled', () => {
  it('recognises both spellings the API returns', () => {
    expect(
      isFinanceApplicationCancelled(buildApplication({ status: 'cancelled' })),
    ).toBe(true);
    expect(
      isFinanceApplicationCancelled(buildApplication({ status: 'canceled' })),
    ).toBe(true);
  });

  it('leaves running and completed contracts alone', () => {
    expect(
      isFinanceApplicationCancelled(buildApplication({ status: 'up-to-date' })),
    ).toBe(false);
    expect(
      isFinanceApplicationCancelled(buildApplication({ status: 'completed' })),
    ).toBe(false);
    expect(isFinanceApplicationCancelled(null)).toBe(false);
  });
});

describe('getFinanceCancellationSummary', () => {
  it('excludes the forfeited deposit from the amount converted to tokens', () => {
    const summary = getFinanceCancellationSummary(
      buildApplication({
        charges: [paidCharge(900), paidCharge(300), paidCharge(300)],
      }),
    );

    expect(summary.totalPaid).toBe(1500);
    expect(summary.depositAmount).toBe(900);
    expect(summary.isDepositPaid).toBe(true);
    expect(summary.amountToConvert).toBe(600);
    // 600 of the 8100 financed portion of a 30 token contract.
    expect(summary.estimatedTokens).toBeCloseTo(2.222222, 5);
  });

  it('ignores charges that are not paid', () => {
    const summary = getFinanceCancellationSummary(
      buildApplication({
        charges: [
          paidCharge(900),
          { status: 'pending-payment', amount: { total: { val: 300 } } },
        ],
      }),
    );

    expect(summary.totalPaid).toBe(900);
    expect(summary.amountToConvert).toBe(0);
    expect(summary.estimatedTokens).toBe(0);
  });

  it('converts nothing while the deposit is still unpaid', () => {
    const summary = getFinanceCancellationSummary(
      buildApplication({
        status: 'pending-payment',
        isDownPaymentMade: false,
        charges: [],
      }),
    );

    expect(summary.isDepositPaid).toBe(false);
    expect(summary.totalPaid).toBe(0);
    expect(summary.amountToConvert).toBe(0);
  });

  it('never subtracts more deposit than was actually paid', () => {
    const summary = getFinanceCancellationSummary(
      buildApplication({ charges: [paidCharge(400)] }),
    );

    expect(summary.amountToConvert).toBe(0);
  });

  it('caps the token estimate at the full contract', () => {
    const summary = getFinanceCancellationSummary(
      buildApplication({
        charges: [paidCharge(900), paidCharge(20000)],
      }),
    );

    expect(summary.estimatedTokens).toBe(30);
  });

  it('returns zeroes for a missing application', () => {
    expect(getFinanceCancellationSummary(null)).toEqual({
      totalPaid: 0,
      depositAmount: 0,
      isDepositPaid: false,
      amountToConvert: 0,
      estimatedTokens: 0,
    });
  });
});
