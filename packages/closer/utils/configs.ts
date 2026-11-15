import api, { formatSearch } from './api';
import {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  trpc,
} from './trpc';

type ListInput = Parameters<typeof trpc.config.list.query>[0];
type CreateInput = Parameters<typeof trpc.config.create.mutate>[0];
type UpdateData = Parameters<typeof trpc.config.update.mutate>[0]['data'];
type ReplaceData = Parameters<typeof trpc.config.replace.mutate>[0]['data'];

// What the platform store reads off an axios response.
type Body = { data: { results: any } };
const body = (results: unknown): Body => ({ data: { results } });

// Legacy `GET /config` with the store's query params; `cache: false` skips the axios GET cache.
export const fetchConfigs = async (
  options: Record<string, any>,
  noCache: boolean,
): Promise<Body> => {
  if (!isTrpcEnabled('8.4a')) {
    return api.get('/config', {
      params: {
        ...options,
        where: options.where && formatSearch(options.where),
      },
      ...((noCache ? { cache: false } : {}) as object),
    });
  }
  const results = await trpc.config.list
    .query({ limit: options.limit, sortBy: options.sort_by } as ListInput)
    .catch(throwApiError);
  return body(results);
};

// Legacy `GET /config/:slug`.
export const fetchConfig = async (
  slug: string,
  noCache = false,
): Promise<Body> => {
  if (!isTrpcEnabled('8.4a')) {
    return api.get(
      `/config/${slug}`,
      (noCache ? { cache: false } : {}) as object,
    );
  }
  const results = await trpc.config.get
    .query({ idOrSlug: slug })
    .catch(throwApiErrorWithLegacy404);
  return body(results);
};

// Legacy `POST /config`.
export const createConfig = async (
  data: Record<string, unknown>,
): Promise<Body> => {
  if (!isTrpcEnabled('8.4a')) return api.post('/config', data);
  const results = await trpc.config.create
    .mutate(data as CreateInput)
    .catch(throwApiError);
  return body(results);
};

// Legacy `PATCH /config/:slug`.
export const updateConfig = async (
  slug: string,
  data: Record<string, unknown>,
): Promise<Body> => {
  if (!isTrpcEnabled('8.4a')) return api.patch(`/config/${slug}`, data);
  const results = await trpc.config.update
    .mutate({ idOrSlug: slug, data: data as UpdateData })
    .catch(throwApiErrorWithLegacy404);
  return body(results);
};

// Legacy `PUT /config/:slug`.
export const replaceConfig = async (
  slug: string,
  data: Record<string, unknown>,
): Promise<Body> => {
  if (!isTrpcEnabled('8.4a')) return api.put(`/config/${slug}`, data);
  const results = await trpc.config.replace
    .mutate({ idOrSlug: slug, data: data as ReplaceData })
    .catch(throwApiErrorWithLegacy404);
  return body(results);
};
