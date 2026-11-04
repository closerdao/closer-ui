import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';
import type { Application } from './villageApplication.utils';

type Platform = Record<string, any>;

type CreateInput = Parameters<typeof trpc.application.create.mutate>[0];
type UpdateInput = Parameters<typeof trpc.application.update.mutate>[0]['data'];
type FilterInput = NonNullable<
  Parameters<typeof trpc.application.count.query>[0]
>;

type Bound = string | number | Date;

// The store `where`s the UI sends: a status or `$in` list, an owner (`$in: [null, []]` for none), a created window.
export type ApplicationWhere = {
  status?: string | { $in: string[] };
  managedBy?: string | { $in: (string | null | never[])[] };
  created?: { $gte?: Bound; $lte?: Bound };
};

export type ApplicationFilter = {
  where?: ApplicationWhere;
  limit?: number;
  page?: number;
};

const iso = (date: Bound) => new Date(date).toISOString();

export const toApplicationFilterInput = (
  where: ApplicationWhere = {},
): FilterInput => {
  const { status, managedBy, created } = where;
  const owner =
    typeof managedBy === 'object' && managedBy !== null
      ? (managedBy.$in.find((id) => typeof id === 'string') ?? null)
      : managedBy;
  return {
    ...(status !== undefined && {
      status: typeof status === 'object' ? status.$in : status,
    }),
    ...(owner !== undefined && { managedBy: owner }),
    ...(created?.$gte !== undefined && { createdAfter: iso(created.$gte) }),
    ...(created?.$lte !== undefined && { createdBefore: iso(created.$lte) }),
  };
};

// The store's `get(filter)`, newest first; resolves the store's action, never rejects.
export const loadApplications = (
  platform: Platform,
  filter: ApplicationFilter,
  opts: { force?: boolean } = {},
) =>
  isTrpcEnabled()
    ? platform.application.get(filter, {
        ...opts,
        load: async () =>
          trpc.application.list
            .query({
              ...toApplicationFilterInput(filter.where),
              ...(filter.limit !== undefined && { limit: filter.limit }),
              ...(filter.page !== undefined && { page: filter.page }),
              sortBy: '-created',
            })
            .catch(throwApiError),
      })
    : platform.application.get(filter, opts);

// The store's `getCount(filter)`, where `findCount(filter)` reads it.
export const loadApplicationCount = (
  platform: Platform,
  filter: ApplicationFilter,
) =>
  isTrpcEnabled()
    ? platform.application.getCount(filter, {
        load: async () =>
          trpc.application.count
            .query(toApplicationFilterInput(filter.where))
            .catch(throwApiError),
      })
    : platform.application.getCount(filter);

// The store's `patch(id, data)`; resolves the store's action, never rejects.
export const patchApplication = (
  platform: Platform,
  id: string,
  data: Record<string, unknown>,
) =>
  isTrpcEnabled()
    ? platform.application.patch(id, data, {
        load: () =>
          trpc.application.update
            .mutate({ id, data: data as UpdateInput })
            .catch(throwApiError),
      })
    : platform.application.patch(id, data);

// Legacy `GET /application/:id`.
export const fetchApplicationById = async (
  id: string,
): Promise<Application> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get(`/application/${id}`);
    return data?.results || data;
  }
  const result = await trpc.application.get.query({ id }).catch(throwApiError);
  return result as Application;
};

// Legacy `POST /application`; tRPC ignores keys the model has no field for, as legacy did.
export const createApplication = async (
  data: Record<string, unknown>,
): Promise<Application> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/application', data);
    return res.data?.results || res.data;
  }
  const result = await trpc.application.create
    .mutate(data as CreateInput)
    .catch(throwApiError);
  return result as Application;
};
