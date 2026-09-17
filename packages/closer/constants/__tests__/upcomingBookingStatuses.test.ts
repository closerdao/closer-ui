import {
  OCCUPYING_BOOKING_STATUSES,
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

  it('is the dashboard list plus the settling list', () => {
    expect(UPCOMING_BOOKING_STATUSES).toEqual([
      ...dashboardRelevantStatuses,
      ...SETTLING_BOOKING_STATUSES,
    ]);
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

describe('OCCUPYING_BOOKING_STATUSES', () => {
  it('is the paid list plus the settling list', () => {
    expect(OCCUPYING_BOOKING_STATUSES).toEqual([
      ...paidStatuses,
      ...SETTLING_BOOKING_STATUSES,
    ]);
  });

  it('leaves out statuses that do not hold a bed', () => {
    expect(OCCUPYING_BOOKING_STATUSES).not.toContain('pending');
    expect(OCCUPYING_BOOKING_STATUSES).not.toContain('confirmed');
    expect(OCCUPYING_BOOKING_STATUSES).not.toContain('cancelled');
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
