import {
  financeApplicationStatusBadgeVariant,
  financeApplicationStatusLabelKey,
} from '../orderStatusBadge';

describe('financeApplicationStatusLabelKey', () => {
  it('labels both spellings of a cancelled contract', () => {
    expect(financeApplicationStatusLabelKey('cancelled')).toBe(
      'order_status_cancelled',
    );
    expect(financeApplicationStatusLabelKey('canceled')).toBe(
      'order_status_cancelled',
    );
  });

  it('still labels the running statuses', () => {
    expect(financeApplicationStatusLabelKey('pending-payment')).toBe(
      'order_status_pending_payment',
    );
    expect(financeApplicationStatusLabelKey('up-to-date')).toBe(
      'order_status_up_to_date',
    );
  });

  it('falls back to unknown for a status it has never seen', () => {
    expect(financeApplicationStatusLabelKey('exploded')).toBe(
      'order_status_unknown',
    );
  });
});

describe('financeApplicationStatusBadgeVariant', () => {
  it('marks both spellings of a cancelled contract as destructive', () => {
    expect(financeApplicationStatusBadgeVariant('cancelled')).toBe(
      'destructive',
    );
    expect(financeApplicationStatusBadgeVariant('canceled')).toBe(
      'destructive',
    );
  });
});
