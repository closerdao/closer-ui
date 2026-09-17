import {
  getNextFinancePaymentRemainingDue,
  isAllowedFinancePaymentProofFile,
} from '../financeApplyPayment';

describe('isAllowedFinancePaymentProofFile', () => {
  it('accepts images and PDFs', () => {
    expect(
      isAllowedFinancePaymentProofFile(
        new File(['x'], 'a.png', { type: 'image/png' }),
      ),
    ).toBe(true);
    expect(
      isAllowedFinancePaymentProofFile(
        new File(['x'], 'a.pdf', { type: 'application/pdf' }),
      ),
    ).toBe(true);
  });

  it('rejects other types', () => {
    expect(
      isAllowedFinancePaymentProofFile(
        new File(['x'], 'a.txt', { type: 'text/plain' }),
      ),
    ).toBe(false);
  });
});

describe('getNextFinancePaymentRemainingDue', () => {
  it('returns remaining due on the first unpaid month', () => {
    const remaining = getNextFinancePaymentRemainingDue(
      {
        paymentsScheduled: {
          '2026-01': {
            status: 'paid',
            amountDue: 250,
            amountPaid: 250,
            paymentDate: '',
          },
          '2026-02': {
            status: 'pending',
            amountDue: 250,
            amountPaid: 100,
            paymentDate: '',
          },
        },
      } as any,
      250,
    );
    expect(remaining).toBe(150);
  });

  it('falls back to the monthly installment when amountDue is missing', () => {
    const remaining = getNextFinancePaymentRemainingDue(
      {
        paymentsScheduled: {
          '2026-01': { status: 'pending', amountPaid: 0, paymentDate: '' },
        },
      } as any,
      433.33,
    );
    expect(remaining).toBe(433.33);
  });
});
