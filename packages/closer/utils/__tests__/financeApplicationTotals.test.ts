import { FinanceApplication } from '../../types/subscriptions';
import {
  getFinanceRepaymentProgress,
  getFinanceTotalRepayable,
} from '../financeApplicationTotals';

const buildApplication = (
  overrides: Partial<FinanceApplication> = {},
): FinanceApplication =>
  ({
    _id: 'app-1',
    userId: 'user-1',
    status: 'up-to-date',
    iban: 'PT50000201231234567890154',
    tokensToFinance: 20,
    totalToPayInFiat: 6718.22,
    monthlyPaymentAmount: 100,
    downPaymentAmount: 671.82,
    charges: [],
    ...overrides,
  } as FinanceApplication);

const scheduleOf = (months: number, amountDue?: number) =>
  Object.fromEntries(
    Array.from({ length: months }, (_, i) => [
      `2026-${String(i + 1).padStart(2, '0')}`,
      {
        status: 'pending' as const,
        amountDue,
        amountPaid: 0,
        paymentDate: `2026-${String(i + 1).padStart(2, '0')}-01`,
      },
    ]),
  );

describe('getFinanceTotalRepayable', () => {
  it('prefers the figure stamped on the contract', () => {
    const application = buildApplication({
      pricingContext: { totalRepayable: 7200.5 },
      paymentsScheduled: scheduleOf(60, 100),
    });

    expect(getFinanceTotalRepayable(application)).toBe(7200.5);
  });

  it('reconstructs deposit plus scheduled dues for contracts without one', () => {
    const application = buildApplication({
      downPaymentAmount: 671.82,
      paymentsScheduled: scheduleOf(60, 110.5),
    });

    // 671.82 + (60 x 110.50)
    expect(getFinanceTotalRepayable(application)).toBe(7301.82);
  });

  it('falls back to the locked monthly payment when a month has no written due', () => {
    const application = buildApplication({
      downPaymentAmount: 100,
      monthlyPaymentAmount: 50,
      paymentsScheduled: scheduleOf(4),
    });

    // 100 + (4 x 50)
    expect(getFinanceTotalRepayable(application)).toBe(300);
  });

  it('falls back to the contract total when there is no schedule', () => {
    const application = buildApplication({ paymentsScheduled: {} });

    expect(getFinanceTotalRepayable(application)).toBe(6718.22);
  });

  it('ignores a stamped value that is absent or not a positive number', () => {
    const application = buildApplication({
      pricingContext: { totalRepayable: 0 },
      paymentsScheduled: {},
    });

    expect(getFinanceTotalRepayable(application)).toBe(6718.22);
  });

  it('returns zero for a missing application', () => {
    expect(getFinanceTotalRepayable(null)).toBe(0);
  });
});

describe('getFinanceRepaymentProgress', () => {
  it('reports the paid share of the contract', () => {
    expect(getFinanceRepaymentProgress(250, 1000)).toBe(0.25);
  });

  it('clamps an overpaid contract to a full bar', () => {
    expect(getFinanceRepaymentProgress(1200, 1000)).toBe(1);
  });

  it('reports nothing when the contract total is unknown', () => {
    expect(getFinanceRepaymentProgress(100, 0)).toBe(0);
  });
});
