import { UPCOMING_BOOKING_STATUSES, paidStatuses } from '../shared.constants';

describe('UPCOMING_BOOKING_STATUSES', () => {
  it('keeps stays awaiting a payment delta in the upcoming list', () => {
    expect(UPCOMING_BOOKING_STATUSES).toContain('pending-payment');
  });

  it('keeps stays awaiting a refund in the upcoming list', () => {
    expect(UPCOMING_BOOKING_STATUSES).toContain('pending-refund');
  });

  it('covers every paid status', () => {
    paidStatuses.forEach((status) => {
      expect(UPCOMING_BOOKING_STATUSES).toContain(status);
    });
  });
});
