import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type Platform = Record<string, any>;

type FilterInput = NonNullable<
  Parameters<typeof trpc.financeApplication.list.query>[0]
>;

// The store `where`s the UI sends: the buyer, one status or an `$in` list, an id.
export type FinanceApplicationWhere = {
  userId?: string;
  status?: string | { $in: string[] };
  _id?: string;
};

export type FinanceApplicationFilter = {
  where?: FinanceApplicationWhere;
  limit?: number;
  page?: number;
  sort_by?: string;
  _refresh?: number;
};

export const toFinanceApplicationFilterInput = (
  where: FinanceApplicationWhere = {},
): FilterInput => ({
  ...(where.userId !== undefined && { userId: where.userId }),
  ...(where.status !== undefined && {
    status: typeof where.status === 'object' ? where.status.$in : where.status,
  }),
  ...(where._id !== undefined && { id: where._id }),
});

// The store's `get(filter)`; resolves the store's action, never rejects.
export const loadFinanceApplications = (
  platform: Platform,
  filter: FinanceApplicationFilter,
  opts: { force?: boolean } = {},
) =>
  isTrpcEnabled()
    ? platform.financeapplication.get(filter, {
        ...opts,
        load: () =>
          trpc.financeApplication.list
            .query({
              ...toFinanceApplicationFilterInput(filter.where),
              ...(filter.limit !== undefined && { limit: filter.limit }),
              ...(filter.page !== undefined && { page: filter.page }),
              sortBy: filter.sort_by ?? '-created',
            })
            .catch(throwApiError),
      })
    : platform.financeapplication.get(filter, opts);

// The store's `getCount(filter)`, where `findCount(filter)` reads it.
export const loadFinanceApplicationCount = (
  platform: Platform,
  filter: FinanceApplicationFilter,
) =>
  isTrpcEnabled()
    ? platform.financeapplication.getCount(filter, {
        load: () =>
          trpc.financeApplication.count
            .query(toFinanceApplicationFilterInput(filter.where))
            .catch(throwApiError),
      })
    : platform.financeapplication.getCount(filter);

// The store's `getOne(id)`, where `findOne(id)` reads it; resolves the store's action, never rejects.
export const loadFinanceApplication = (
  platform: Platform,
  id: string,
  opts: { force?: boolean } = {},
) =>
  isTrpcEnabled()
    ? platform.financeapplication.getOne(id, {
        ...opts,
        load: () =>
          trpc.financeApplication.get.query({ id }).catch(throwApiError),
      })
    : platform.financeapplication.getOne(id, opts);
