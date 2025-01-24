export interface DateRange {
  value: '7d' | '30d' | '90d' | '365d' | 'all';
  label: string;
}

export type BookingStatus =
  | 'open'
  | 'confirmed'
  | 'cancelled'
  | 'pending'
  | 'paid'
  | 'checked-in'
  | 'checked-out';

export const getDays = (dateRange: DateRange): number => {
  switch (dateRange.value) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '365d':
      return 365;
    default:
      return 0;
  }
};

export interface BookingFilterOptions {
  userId?: string;
  status?: BookingStatus;
  additionalWhere?: Record<string, unknown>;
  limit?: number;
}

/**
 * Generates a filter object for bookings with date range and status
 * @param dateRange - The date range to filter by
 * @param options - Additional filter options including status and user ID
 * @returns Filter object for platform booking queries
 */
export const generateBookingFilter = (
  dateRange: DateRange,
  options: BookingFilterOptions = {},
) => {
  const { status } = options;

  const limit = 3000;

  const filter = {
    where: {
      ...(status && { status }),
      ...(dateRange.value !== 'all' && {
        created: {
          $gte: new Date(
            new Date().setDate(new Date().getDate() - getDays(dateRange)),
          ),
        },
      }),
    },
    ...(limit && { limit }),
  };

  return filter;
};

export const generateTokenSalesFilter = (
  dateRange: DateRange,
  event: string,
) => {
  const limit = 10000;

  const filter = {
    where: {
      category: { $in: ['engagement'] },
      value: { $in: ['token-sale'] },
      event: { $in: [event] },

      ...(dateRange.value !== 'all' && {
        created: {
          $gte: new Date(
            new Date().setDate(new Date().getDate() - getDays(dateRange)),
          ).getTime(),
        },
      }),
    },
    ...(limit && { limit }),
  };

  return filter;
};

export const generateSubscriptionsFilter = (
  dateRange: DateRange,
  event: string,
) => {
  const limit = 100000;

  const filter = {
    where: {
      category: { $in: ['engagement'] },
      value: { $in: ['subscriptions'] },
      event: { $in: [event] },

      ...(dateRange.value !== 'all' && {
        created: {
          $gte: new Date(
            new Date().setDate(new Date().getDate() - getDays(dateRange)),
          ).getTime(),
        },
      }),
    },
    ...(limit && { limit }),
  };

  return filter;
};

export const DATE_RANGES: readonly DateRange[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last 365 days' },
  { value: 'all', label: 'All time' },
] as const;
