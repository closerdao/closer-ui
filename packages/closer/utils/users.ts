import type { User } from '../contexts/auth/types';
import api, { formatSearch } from './api';
import {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  trpc,
  trpcFor,
} from './trpc';

type Platform = Record<string, any>;
type Client = typeof trpc;

type AdminListInput = Exclude<
  Parameters<typeof trpc.user.adminList.query>[0],
  void | undefined
>;
type UserFilters = Omit<AdminListInput, 'limit' | 'page' | 'sortBy'>;
export type UserUpdate = Parameters<typeof trpc.user.updateMe.mutate>[0];

// A legacy `where` on User, as the store and the pages build it.
export type UserWhere = Record<string, any>;

export type UserFilter = {
  where?: UserWhere;
  sort_by?: string;
  limit?: number;
  page?: number;
};

export const HOST_ROLES = ['space-host', 'steward', 'team'];

// The procedure's page cap; legacy had none.
const MAX_LIMIT = 500;

// Filters only admins and curators (affiliateApplication: also affiliate-managers) may use.
const PRIVATE_FILTERS: (keyof UserFilters)[] = [
  'email',
  'kycPassed',
  'citizenshipApplied',
  'citizenshipStatus',
  'citizenshipCreatedAfter',
  'citizenshipCreatedBefore',
  'minPresence',
  'walletConnected',
  'walletConnectedAfter',
  'walletConnectedBefore',
  'subscribedAfter',
  'subscribedBefore',
  'affiliateApplicationStatus',
];

const iso = (date: unknown) => new Date(date as string).toISOString();

const range = (
  { $gte, $lte }: { $gte?: unknown; $lte?: unknown },
  after: keyof UserFilters,
  before: keyof UserFilters,
): UserFilters => ({
  ...($gte !== undefined && { [after]: iso($gte) }),
  ...($lte !== undefined && { [before]: iso($lte) }),
});

// The pages escape what they put in a `$regex`; the procedures match literal text.
const unescapeRegex = (pattern: string) => pattern.replace(/\\(.)/g, '$1');

const toFilter = (key: string, value: any): UserFilters => {
  switch (key) {
    case '$and':
      return Object.assign({}, ...value.map(toFilters));
    // Only the citizen funnel sends `$or`: any sign of a citizenship application.
    case '$or':
      return { citizenshipApplied: true };
    case '_id':
      return { ids: value.$in ?? [value.$eq] };
    case 'roles':
      if (typeof value === 'string') return { roles: [value] };
      if (value.$in) return { roles: value.$in };
      if (value.$nin) return { excludeRoles: value.$nin };
      return { excludeRoles: [value.$ne] };
    case '_search':
      return { search: value };
    case 'screenname':
      return { name: unescapeRegex(value.$regex) };
    case 'email':
      return { email: unescapeRegex(value.$regex) };
    case 'referredBy':
      return { referredBy: value };
    case 'subscription.plan':
      if (typeof value === 'string') return { plans: [value] };
      if (value.$in) return { plans: value.$in };
      return { hasPlan: value.$exists };
    case 'created':
      return range(value, 'createdAfter', 'createdBefore');
    case 'affiliate':
      return { affiliate: true };
    case 'kycPassed':
      return { kycPassed: value };
    case 'citizenship.status':
      return { citizenshipStatus: value };
    case 'citizenship.createdAt':
      return range(
        value,
        'citizenshipCreatedAfter',
        'citizenshipCreatedBefore',
      );
    case 'stats.all_time.presence':
      return { minPresence: value.$gte };
    case 'actions.wallet-connected':
      return value.$exists
        ? { walletConnected: true }
        : range(value, 'walletConnectedAfter', 'walletConnectedBefore');
    case 'subscription.subscribeDate':
      return range(value, 'subscribedAfter', 'subscribedBefore');
    case 'affiliateApplication.status':
      return { affiliateApplicationStatus: value };
    default:
      throw new Error(`No user filter for where.${key}`);
  }
};

const toFilters = (where: UserWhere = {}): UserFilters => {
  const filters: UserFilters = Object.assign(
    {},
    ...Object.entries(where).map(([key, value]) => toFilter(key, value)),
  );
  // Legacy matched nothing for a missing id; the procedure refuses one.
  if (filters.ids) filters.ids = [...new Set(filters.ids.filter(Boolean))];
  return filters;
};

const isAdminQuery = (filters: UserFilters) =>
  PRIVATE_FILTERS.some((key) => filters[key] !== undefined);

const chunks = <T>(list: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, index) =>
    list.slice(index * size, (index + 1) * size),
  );

// The legacy `GET /user` of `filter` over tRPC, paging past the 500-row cap as legacy's uncapped limit read.
const queryUsers = async (
  filter: UserFilter,
  client: Client = trpc,
): Promise<User[]> => {
  const filters = toFilters(filter.where);
  const procedure = isAdminQuery(filters)
    ? client.user.adminList
    : client.user.list;
  const read = async (input: AdminListInput) =>
    (await procedure.query(input)) as unknown as User[];
  const base = {
    ...filters,
    ...(filter.sort_by !== undefined && { sortBy: filter.sort_by }),
  };
  const { ids } = filters;
  if (ids) {
    // Every id asked for comes back, so a limit only matters below their number.
    const limit =
      filter.limit !== undefined && filter.limit < ids.length
        ? filter.limit
        : undefined;
    if (ids.length <= MAX_LIMIT) {
      return read({
        ...base,
        ids,
        ...(limit !== undefined && { limit, page: filter.page }),
      });
    }
    // Over 500 ids come back in parts, each sorted on its own; no caller also cuts such a list with a limit.
    const parts = await Promise.all(
      chunks(ids, MAX_LIMIT).map((part) => read({ ...base, ids: part })),
    );
    return parts.flat().slice(0, limit);
  }
  const { limit } = filter;
  if (limit === undefined || limit <= MAX_LIMIT) {
    return read({ ...base, limit, page: filter.page });
  }
  if ((filter.page ?? 1) > 1) {
    throw new Error('A page past the first of more than 500 users');
  }
  const rows: User[] = [];
  for (let page = 1; rows.length < limit; page += 1) {
    const batch = await read({ ...base, limit: MAX_LIMIT, page });
    rows.push(...batch);
    if (batch.length < MAX_LIMIT) break;
  }
  return rows.slice(0, limit);
};

const queryUserCount = async (
  where: UserWhere | undefined,
  client: Client = trpc,
) => {
  const filters = toFilters(where);
  return (
    isAdminQuery(filters) ? client.user.adminCount : client.user.count
  ).query(filters);
};
const clientFor = (token: string | undefined) =>
  token ? trpcFor(token) : trpc;

const bearer = (token: string | undefined) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

// Legacy `GET /user` with `where`, `sort_by`, `limit` and `page` as query params; `token` is a server render's cookie token.
export const fetchUsers = async (
  filter: UserFilter,
  options?: { token: string | undefined },
): Promise<User[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/user', {
      params: {
        where: filter.where && formatSearch(filter.where),
        sort_by: filter.sort_by,
        limit: filter.limit,
        page: filter.page,
      },
      ...(options && { headers: bearer(options.token) }),
    });
    return res.data.results;
  }
  return queryUsers(filter, clientFor(options?.token)).catch(throwApiError);
};

// Legacy `GET /user?where=…` with limit 200, as leads, villages and project lists ask it.
export const fetchUsersWhere = async (where: UserWhere): Promise<User[]> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get(`/user?where=${formatSearch(where)}`, {
      params: { limit: 200 },
    });
    const results = data?.results || data;
    return Array.isArray(results) ? results : [];
  }
  return queryUsers({ where, limit: 200 }).catch(throwApiError);
};

// The hosts block's server-side `GET /user`: space-hosts, stewards and team, the API's first page.
export const fetchHosts = async (): Promise<User[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/user', {
      params: { where: { roles: { $in: HOST_ROLES } } },
    });
    return res.data.results;
  }
  return queryUsers({ where: { roles: { $in: HOST_ROLES } } }).catch(
    throwApiError,
  );
};

// Sitemap `GET /user?role=member&limit=500`: legacy ignores `role`, so every user the caller may read.
export const fetchSitemapUsers = async (): Promise<User[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/user?role=member&limit=500');
    return res.data.results;
  }
  return queryUsers({ limit: 500 }).catch(throwApiError);
};

// Token-sale dashboards' buyers by id; admins read their email.
export const fetchBuyers = async (ids: string[]): Promise<User[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(
      `/user?where=${encodeURIComponent(
        JSON.stringify({ _id: { $in: ids } }),
      )}&includePrivate=true`,
    );
    return res.data?.results ?? [];
  }
  return queryUsers({ where: { _id: { $in: ids } } }).catch(throwApiError);
};

// Blog authors by id.
export const fetchAuthors = async (ids: string[]): Promise<User[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(
      `/user?where=${formatSearch({ _id: { $in: ids } })}`,
    );
    return res.data?.results;
  }
  return queryUsers({ where: { _id: { $in: ids } } }).catch(throwApiError);
};

// One article's author; null when the API has none for the id.
export const fetchAuthor = async (
  id: string | undefined,
): Promise<User | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(
      `/user?where=${formatSearch({ _id: { $eq: id } })}`,
    );
    return res?.data?.results[0] || null;
  }
  const [author] = await queryUsers({ where: { _id: { $eq: id } } }).catch(
    throwApiError,
  );
  return author || null;
};

// Legacy `GET /count/user` of `where`.
export const fetchUserCount = async (where: UserWhere): Promise<number> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/count/user', {
      params: { where: formatSearch(where) },
    });
    return res.data.results;
  }
  return queryUserCount(where).catch(throwApiError);
};

// Legacy `GET /user/:search` by id or slug; `token` is a server render's cookie token.
export const fetchUser = async (
  idOrSlug: string,
  options?: { token: string | undefined },
): Promise<User> => {
  if (!isTrpcEnabled()) {
    const path = `/user/${idOrSlug}`;
    const res = options
      ? await api.get(path, { headers: bearer(options.token) })
      : await api.get(path);
    return res.data.results;
  }
  const user = await clientFor(options?.token)
    .user.get.query({ idOrSlug })
    .catch(throwApiErrorWithLegacy404);
  return user as unknown as User;
};

// Legacy `GET /mine/user`: `fresh` skips the GET cache; `token` is a server's bearer token.
export const fetchMe = async (
  options: { fresh?: boolean; token?: string } = {},
): Promise<User> => {
  if (!isTrpcEnabled()) {
    const res = options.token
      ? await api.get('/mine/user', { headers: bearer(options.token) })
      : options.fresh
        ? await api.get('/mine/user', { cache: false } as any)
        : await api.get('/mine/user');
    return res.data.results;
  }
  const user = await clientFor(options.token)
    .user.me.query()
    .catch(throwApiError);
  return user as unknown as User;
};

// Legacy `PATCH /mine/user`.
export const updateMe = async (data: UserUpdate): Promise<User> => {
  if (!isTrpcEnabled()) {
    const res = await api.patch('/mine/user', data);
    return res.data.results;
  }
  const user = await trpc.user.updateMe.mutate(data).catch(throwApiError);
  return user as unknown as User;
};

// Legacy `PATCH /user/:id` on the caller's own id.
export const updateOwnUser = async (
  id: string,
  data: UserUpdate,
): Promise<User> => {
  if (!isTrpcEnabled()) {
    const res = await api.patch(`/user/${id}`, data);
    return res.data.results;
  }
  const user = await trpc.user.updateMe.mutate(data).catch(throwApiError);
  return user as unknown as User;
};

export type NearbyUser = {
  _id: string;
  screenname?: string | null;
  slug?: string | null;
  photo: string | null;
  locationName: string | null;
  distanceKm: number | null;
};

// Legacy `GET /users/nearby`, uncached.
export const fetchNearbyUsers = async (
  limit: number,
): Promise<NearbyUser[]> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get('/users/nearby', {
      params: { limit },
      cache: false,
    } as any);
    return data?.results ?? [];
  }
  return trpc.user.nearby.query({ limit }).catch(throwApiError);
};

// The store's `get(filter)`, its action and its `find(filter)` entry either way.
export const loadUsers = (
  platform: Platform,
  filter: UserFilter,
  opts: { force?: boolean } = {},
) =>
  platform.user.get(
    filter,
    isTrpcEnabled()
      ? {
          ...opts,
          load: () =>
            queryUsers({ sort_by: '-created', ...filter }).catch(throwApiError),
        }
      : opts,
  );

// Bookings' store key: legacy reads everyone under `filter`; tRPC reads only `ids`, under a key of their own.
export const usersByIdsFilter = (
  filter: UserFilter,
  ids: string[],
): UserFilter =>
  isTrpcEnabled() ? { ...filter, where: { _id: { $in: ids } } } : filter;

// The store's `getCount(filter)`, where `findCount(filter)` reads it.
export const loadUserCount = (platform: Platform, filter: UserFilter) =>
  isTrpcEnabled()
    ? platform.user.getCount(filter, {
        load: () => queryUserCount(filter.where).catch(throwApiError),
      })
    : platform.user.getCount(filter);

// The store's `getOne(id)`, where `findOne(id)` reads it.
export const loadUser = (
  platform: Platform,
  id: string,
  opts: { force?: boolean } = {},
) =>
  platform.user.getOne(
    id,
    isTrpcEnabled()
      ? {
          ...opts,
          load: () =>
            trpc.user.get.query({ idOrSlug: id }).catch(throwApiError),
        }
      : opts,
  );

// The store's `patch(id, data)` of the caller's own user; resolves the store's action, never rejects.
export const patchMe = (platform: Platform, id: string, data: UserUpdate) =>
  isTrpcEnabled()
    ? platform.user.patch(id, data, {
        load: () => trpc.user.updateMe.mutate(data).catch(throwApiError),
      })
    : platform.user.patch(id, data);

// The store's `patch(id, data)` of another user, as an admin.
export const patchUser = (platform: Platform, id: string, data: UserUpdate) =>
  isTrpcEnabled()
    ? platform.user.patch(id, data, {
        load: () => trpc.user.update.mutate({ id, data }).catch(throwApiError),
      })
    : platform.user.patch(id, data);
