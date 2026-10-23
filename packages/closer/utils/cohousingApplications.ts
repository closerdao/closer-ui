import type { CohousingApplication } from '../types/cohousingApplication';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type Platform = Record<string, any>;

type WriteInput = Parameters<typeof trpc.cohousingApplication.create.mutate>[0];
type AdminCreateInput = Parameters<
  typeof trpc.cohousingApplication.adminCreate.mutate
>[0];

// The store `where`s the UI sends: the applicant, or the co-signer's user id.
export type CohousingApplicationWhere = {
  createdBy?: string;
  'cosigner.userId'?: string;
};

export type CohousingApplicationFilter = {
  where?: CohousingApplicationWhere;
  limit?: number;
  page?: number;
  sort_by?: string;
};

// The store's `get(filter)`; resolves the store's action, never rejects.
export const loadCohousingApplications = (
  platform: Platform,
  filter: CohousingApplicationFilter,
  opts: { force?: boolean } = {},
) =>
  isTrpcEnabled()
    ? platform.cohousingapplication.get(filter, {
        ...opts,
        load: () =>
          trpc.cohousingApplication.list
            .query({
              ...(filter.where?.createdBy !== undefined && {
                createdBy: filter.where.createdBy,
              }),
              ...(filter.where?.['cosigner.userId'] !== undefined && {
                cosignerUserId: filter.where['cosigner.userId'],
              }),
              ...(filter.limit !== undefined && { limit: filter.limit }),
              ...(filter.page !== undefined && { page: filter.page }),
              sortBy: filter.sort_by ?? '-created',
            })
            .catch(throwApiError),
      })
    : platform.cohousingapplication.get(filter, opts);

// The store's `getOne(id)`; resolves the store's action, never rejects.
export const loadCohousingApplication = (
  platform: Platform,
  id: string,
  opts: { force?: boolean } = {},
) =>
  isTrpcEnabled()
    ? platform.cohousingapplication.getOne(id, {
        ...opts,
        load: () =>
          trpc.cohousingApplication.get.query({ id }).catch(throwApiError),
      })
    : platform.cohousingapplication.getOne(id, opts);

// The store's `patch(id, data)`; resolves the store's action, never rejects.
export const patchCohousingApplication = (
  platform: Platform,
  id: string,
  data: Record<string, unknown>,
) =>
  isTrpcEnabled()
    ? platform.cohousingapplication.patch(id, data, {
        load: () =>
          trpc.cohousingApplication.update
            .mutate({ id, data: data as WriteInput })
            .catch(throwApiError),
      })
    : platform.cohousingapplication.patch(id, data);

// Legacy `GET /my/CohousingApplication`.
export const fetchMyCohousingApplications = async (): Promise<
  CohousingApplication[]
> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get('/my/CohousingApplication');
    return data?.results ?? data;
  }
  const result = await trpc.cohousingApplication.mine
    .query()
    .catch(throwApiError);
  return result as CohousingApplication[];
};

// Legacy `POST /CohousingApplication`.
export const createCohousingApplication = async (
  data: Record<string, unknown>,
): Promise<CohousingApplication> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/CohousingApplication', data);
    return res.data?.results;
  }
  const result = await trpc.cohousingApplication.create
    .mutate(data as WriteInput)
    .catch(throwApiError);
  return result as CohousingApplication;
};

// Legacy `POST /admin/cohousingapplication`: a team member opens one for any user.
export const adminCreateCohousingApplication = async (
  data: Record<string, unknown>,
): Promise<CohousingApplication> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/admin/cohousingapplication', data);
    return res.data?.results;
  }
  const result = await trpc.cohousingApplication.adminCreate
    .mutate(data as AdminCreateInput)
    .catch(throwApiError);
  return result as CohousingApplication;
};
