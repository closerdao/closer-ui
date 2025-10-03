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
  status?: BookingStatus | BookingStatus[];
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
  const now = new Date();

  switch (timeFrame) {
    case 'currentMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'previousMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'last7Days':
      startDate = new Date(new Date().setDate(new Date().getDate() - 7));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'last4Weeks':
      startDate = new Date(new Date().setDate(new Date().getDate() - 28));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'currentYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
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
      startDate = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
      endDate = new Date(new Date(toDate).setHours(23, 59, 59, 999));
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
  const { startDate, endDate } = getStartAndEndDate(
    timeFrame,
    fromDate,
    toDate,
  );

  return {
    where: {
      ...(options.status && {
        ...(Array.isArray(options.status)
          ? { status: { $in: options.status } }
          : { status: options.status }),
      }),
      ...(timeFrame !== 'allTime' && {
        created: {
          $gte: startDate,
          $lte: endDate,
        },
      }),
    },
  };
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

export const generateCitizenshipFilter = ({
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
      value: { $in: ['citizenship'] },
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

export const generatePageViewFilter = ({
  fromDate,
  toDate,
  timeFrame,
  page,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
  page: string;
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
      value: { $in: [page] },
      event: { $in: ['page-view'] },

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

export const generateButtonClickFilter = ({
  fromDate,
  toDate,
  timeFrame,
  buttonType,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
  buttonType: string;
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
      value: { $in: [buttonType] },
      event: { $in: ['subscribe-button-click'] },

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

export const generateTokenBasketFilter = ({
  fromDate,
  toDate,
  timeFrame,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
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
      value: { $in: ['token-sale'] },
      event: { $in: ['token-sale-success'] },

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

export const generateFinancedTokenStartedFilter = ({
  fromDate,
  toDate,
  timeFrame,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
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
      value: { $in: ['citizenship'] },
      event: { $in: ['financed-token-purchase-started'] },

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

export const generateFinancedTokenBasketFilter = ({
  fromDate,
  toDate,
  timeFrame,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
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
      value: { $in: ['citizenship'] },
      event: { $in: ['financed-token-purchase-completed'] },

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

export const generateSubscribeButtonClickFilter = ({
  fromDate,
  toDate,
  timeFrame,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
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
      value: { $in: ['subscription'] },
      event: { $in: ['subscribe-button-click'] },

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

export const generateManageSubscriptionButtonClickFilter = ({
  fromDate,
  toDate,
  timeFrame,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
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
      value: { $in: ['subscription'] },
      event: { $in: ['manage-subscription-button-click'] },

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

export const generateCreateAccountButtonClickFilter = ({
  fromDate,
  toDate,
  timeFrame,
}: {
  fromDate: string;
  toDate: string;
  timeFrame: string;
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
      value: { $in: ['subscription'] },
      event: { $in: ['create-account-button-click'] },

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
