import {
  SETTLING_BOOKING_STATUSES,
  UPCOMING_BOOKING_STATUSES,
  dashboardRelevantStatuses,
  paidStatuses,
} from '../shared.constants';

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

describe('dashboardRelevantStatuses', () => {
  it('leaves settling stays out of the host dashboard query', () => {
    expect(dashboardRelevantStatuses).not.toContain('pending-payment');
    expect(dashboardRelevantStatuses).not.toContain('pending-refund');
  });

  it('covers the paid, pending and confirmed statuses the counters use', () => {
    expect(dashboardRelevantStatuses).toEqual([
      ...paidStatuses,
      'pending',
      'confirmed',
    ]);
  });
});

describe('SETTLING_BOOKING_STATUSES', () => {
  it('only holds the statuses the settling card counts', () => {
    expect(SETTLING_BOOKING_STATUSES).toEqual([
      'pending-payment',
      'pending-refund',
    ]);
  });
});
