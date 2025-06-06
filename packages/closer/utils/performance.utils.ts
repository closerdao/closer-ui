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

export const getStartAndEndDate = (
  timeFrame: string,
  fromDate: string,
  toDate: string,
) => {
  let startDate: Date;
  let endDate: Date;

  switch (timeFrame) {
    case 'month':
      startDate = new Date(new Date().setDate(new Date().getDate() - 30));
      endDate = new Date();
      break;
    case 'year':
      startDate = new Date(new Date().setDate(new Date().getDate() - 365));
      endDate = new Date();
      break;
    case 'week':
      startDate = new Date(new Date().setDate(new Date().getDate() - 7));
      endDate = new Date();
      break;
    case 'allTime':
      startDate = new Date(0);
      endDate = new Date();
      break;
    case 'today':
      startDate = new Date(new Date().setHours(0, 0, 0, 0));
      endDate = new Date(new Date().setHours(23, 59, 59, 999));
      break;
    case 'custom':
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      break;
    default:
      startDate = new Date(0);
      endDate = new Date();
      break;
  }

  return { startDate, endDate };
};

export const generateBookingFilter = ({
  fromDate,
  toDate,
  timeFrame,
  options,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
  options: BookingFilterOptions;
}) => {
  const { status } = options;

  const { startDate, endDate } = getStartAndEndDate(
    timeFrame,
    fromDate,
    toDate,
  );

  const limit = 3000;

  const filter = {
    where: {
      ...(status && { status }),
      ...(timeFrame !== 'allTime' && {
        created: {
          $gte: startDate,
          $lte: endDate,
        },
      }),
    },
    ...(limit && { limit }),
  };

  return filter;
};

export const generateTokenSalesFilter = ({
  fromDate,
  toDate,
  timeFrame,
  event,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
  event: string;
}) => {
  const limit = 10000;
  const { startDate, endDate } = getStartAndEndDate(
    timeFrame,
    fromDate,
    toDate,
  );

  const filter = {
    where: {
      category: { $in: ['engagement'] },
      value: { $in: ['token-sale'] },
      event: { $in: [event] },

      ...(timeFrame !== 'allTime' && {
        created: {
          $gte: startDate,
          $lte: endDate,
        },
      }),
    },
    ...(limit && { limit }),
  };

  return filter;
};

export const generateSubscriptionsFilter = ({
  fromDate,
  toDate,
  timeFrame,
  event,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
  event: string;
}) => {
  const limit = 100000;
  const { startDate, endDate } = getStartAndEndDate(
    timeFrame,
    fromDate,
    toDate,
  );

  const filter = {
    where: {
      category: { $in: ['engagement'] },
      value: { $in: ['subscriptions'] },
      event: { $in: [event] },

      ...(timeFrame !== 'allTime' && {
        created: {
          $gte: startDate,
          $lte: endDate,
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
