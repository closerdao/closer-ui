import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';
import {
  HOST_ROLES,
  fetchAuthor,
  fetchAuthors,
  fetchBuyers,
  fetchHosts,
  fetchMe,
  fetchNearbyUsers,
  fetchSitemapUsers,
  fetchUser,
  fetchUserCount,
  fetchUsers,
  fetchUsersWhere,
  loadUser,
  loadUserCount,
  loadUsers,
  patchMe,
  patchUser,
  updateMe,
  updateOwnUser,
  usersByIdsFilter,
} from '../users';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
}));

const mockServer = {
  user: {
    list: { query: jest.fn() },
    get: { query: jest.fn() },
    me: { query: jest.fn() },
  },
};

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpcFor: jest.fn(() => mockServer),
  trpc: {
    user: {
      list: { query: jest.fn() },
      count: { query: jest.fn() },
      adminList: { query: jest.fn() },
      adminCount: { query: jest.fn() },
      get: { query: jest.fn() },
      me: { query: jest.fn() },
      updateMe: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      nearby: { query: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; patch: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedTrpcFor = trpcFor as jest.Mock;
const user = trpc.user as unknown as Record<
  'list' | 'count' | 'adminList' | 'adminCount' | 'get' | 'me' | 'nearby',
  { query: jest.Mock }
> &
  Record<'updateMe' | 'update', { mutate: jest.Mock }>;

const ada = { _id: 'u1', slug: 'ada', screenname: 'Ada' };
const bo = { _id: 'u2', slug: 'bo', screenname: 'Bo' };

const encoded = (where: unknown) => encodeURIComponent(JSON.stringify(where));

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

const makePlatform = () => ({
  user: {
    get: jest.fn().mockResolvedValue({ results: 'action' }),
    getCount: jest.fn().mockResolvedValue({ results: 3 }),
    getOne: jest.fn().mockResolvedValue({ results: 'one' }),
    patch: jest.fn().mockResolvedValue({ results: 'patched' }),
  },
});

// The `load` the helper handed to the store, run.
const runLoad = (mock: jest.Mock, call = 0) =>
  mock.mock.calls[call][mock.mock.calls[call].length - 1].load();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchUsers', () => {
  const filter = {
    where: { _id: { $in: ['u1', 'u2'] } },
    sort_by: '-created',
    limit: 200,
  };

  it('sends legacy GET /user with where, sort_by and limit with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [ada, bo] } });

    await expect(fetchUsers(filter)).resolves.toEqual([ada, bo]);
    expect(mockedApi.get).toHaveBeenCalledWith('/user', {
      params: {
        where: encoded(filter.where),
        sort_by: '-created',
        limit: 200,
        page: undefined,
      },
    });
    expect(user.list.query).not.toHaveBeenCalled();
  });

  it('forwards a server token as the bearer with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [ada] } });

    await fetchUsers(
      { where: { _id: { $in: ['u1'] } }, limit: 1 },
      { token: 't1' },
    );
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/user',
      expect.objectContaining({ headers: { Authorization: 'Bearer t1' } }),
    );
  });

  it('calls user.list with ids and every id back, the limit at their number', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([ada, bo]);

    await expect(fetchUsers(filter)).resolves.toEqual([ada, bo]);
    expect(user.list.query).toHaveBeenCalledWith({
      ids: ['u1', 'u2'],
      sortBy: '-created',
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('keeps a limit below the number of ids', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([ada]);

    await fetchUsers({ where: { _id: { $in: ['u1', 'u2'] } }, limit: 1 });
    expect(user.list.query).toHaveBeenCalledWith({
      ids: ['u1', 'u2'],
      limit: 1,
      page: undefined,
    });
  });

  it('uses the server client for a token', async () => {
    mockedEnabled.mockReturnValue(true);
    mockServer.user.list.query.mockResolvedValue([ada]);

    await fetchUsers({ where: { _id: { $in: ['u1'] } } }, { token: 't1' });
    expect(mockedTrpcFor).toHaveBeenCalledWith('t1');
    expect(mockServer.user.list.query).toHaveBeenCalledWith({ ids: ['u1'] });
    expect(user.list.query).not.toHaveBeenCalled();
  });

  it('maps a search to user.list', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([ada]);

    await fetchUsers({
      where: { _search: 'ad' },
      sort_by: '-created',
      limit: 10,
    });
    expect(user.list.query).toHaveBeenCalledWith({
      search: 'ad',
      sortBy: '-created',
      limit: 10,
      page: undefined,
    });
  });

  it('drops missing and repeated ids', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([ada]);

    await fetchUsers({ where: { _id: { $in: ['u1', undefined, 'u1'] } } });
    expect(user.list.query).toHaveBeenCalledWith({ ids: ['u1'] });
  });

  it('reshapes a tRPC failure into the axios error', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'Invalid input'),
    );

    await expect(fetchUsers(filter)).rejects.toMatchObject({
      response: { status: 400, data: { error: 'Invalid input' } },
    });
  });
});

describe('fetchUsersWhere', () => {
  it('sends legacy GET /user?where= with limit 200 with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [ada] } });
    const where = { roles: { $in: ['ambassador'] } };

    await expect(fetchUsersWhere(where)).resolves.toEqual([ada]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      `/user?where=${encoded(where)}`,
      {
        params: { limit: 200 },
      },
    );
  });

  it('calls user.list with roles and limit 200 with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([ada]);

    await fetchUsersWhere({ roles: { $in: ['ambassador'] } });
    expect(user.list.query).toHaveBeenCalledWith({
      roles: ['ambassador'],
      limit: 200,
      page: undefined,
    });
  });
});

describe('fetchHosts', () => {
  it('sends legacy GET /user with the hosts where with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [ada] } });

    await expect(fetchHosts()).resolves.toEqual([ada]);
    expect(mockedApi.get).toHaveBeenCalledWith('/user', {
      params: { where: { roles: { $in: HOST_ROLES } } },
    });
  });

  it('calls user.list with the host roles with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([ada]);

    await fetchHosts();
    expect(user.list.query).toHaveBeenCalledWith({
      roles: HOST_ROLES,
      limit: undefined,
      page: undefined,
    });
  });
});

describe('fetchSitemapUsers', () => {
  it('sends legacy GET /user?role=member&limit=500 with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [ada] } });

    await expect(fetchSitemapUsers()).resolves.toEqual([ada]);
    expect(mockedApi.get).toHaveBeenCalledWith('/user?role=member&limit=500');
  });

  it('calls user.list for 500 users with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([ada]);

    await fetchSitemapUsers();
    expect(user.list.query).toHaveBeenCalledWith({
      limit: 500,
      page: undefined,
    });
  });
});

describe('fetchBuyers', () => {
  it('sends the legacy includePrivate GET with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [ada] } });

    await expect(fetchBuyers(['u1'])).resolves.toEqual([ada]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      `/user?where=${encoded({ _id: { $in: ['u1'] } })}&includePrivate=true`,
    );
  });

  it('calls user.list with the ids with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([ada]);

    await expect(fetchBuyers(['u1'])).resolves.toEqual([ada]);
    expect(user.list.query).toHaveBeenCalledWith({ ids: ['u1'] });
  });
});

describe('fetchAuthors', () => {
  it('sends legacy GET /user?where= of the ids with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [ada, bo] } });

    await expect(fetchAuthors(['u1', 'u2'])).resolves.toEqual([ada, bo]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      `/user?where=${encoded({ _id: { $in: ['u1', 'u2'] } })}`,
    );
  });

  it('calls user.list with the ids with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([ada, bo]);

    await expect(fetchAuthors(['u1', 'u2', 'u1'])).resolves.toEqual([ada, bo]);
    expect(user.list.query).toHaveBeenCalledWith({ ids: ['u1', 'u2'] });
  });
});

describe('fetchAuthor', () => {
  it('sends legacy GET /user?where={_id:{$eq}} and takes the first with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [ada] } });

    await expect(fetchAuthor('u1')).resolves.toBe(ada);
    expect(mockedApi.get).toHaveBeenCalledWith(
      `/user?where=${encoded({ _id: { $eq: 'u1' } })}`,
    );
  });

  it('calls user.list with the id and answers null for none with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.list.query.mockResolvedValue([]);

    await expect(fetchAuthor('u1')).resolves.toBeNull();
    expect(user.list.query).toHaveBeenCalledWith({ ids: ['u1'] });
  });
});

describe('fetchUserCount', () => {
  const where = { roles: { $in: ['member', 'citizen'] } };

  it('sends legacy GET /count/user with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: 7 } });

    await expect(fetchUserCount(where)).resolves.toBe(7);
    expect(mockedApi.get).toHaveBeenCalledWith('/count/user', {
      params: { where: encoded(where) },
    });
  });

  it('calls user.count with public filters with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.count.query.mockResolvedValue(7);

    await expect(
      fetchUserCount({ referredBy: 'u1', roles: 'member' }),
    ).resolves.toBe(7);
    expect(user.count.query).toHaveBeenCalledWith({
      referredBy: 'u1',
      roles: ['member'],
    });
    expect(user.adminCount.query).not.toHaveBeenCalled();
  });

  it('calls user.adminCount for a private filter with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.adminCount.query.mockResolvedValue(2);

    await expect(
      fetchUserCount({ 'actions.wallet-connected': { $exists: true } }),
    ).resolves.toBe(2);
    expect(user.adminCount.query).toHaveBeenCalledWith({
      walletConnected: true,
    });
  });
});

describe('fetchUser', () => {
  it('sends legacy GET /user/:search with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: ada } });

    await expect(fetchUser('ada')).resolves.toBe(ada);
    expect(mockedApi.get).toHaveBeenCalledWith('/user/ada');
  });

  it('forwards a server token with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: ada } });

    await fetchUser('ada', { token: 't1' });
    expect(mockedApi.get).toHaveBeenCalledWith('/user/ada', {
      headers: { Authorization: 'Bearer t1' },
    });
  });

  it('calls user.get with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.get.query.mockResolvedValue(ada);

    await expect(fetchUser('ada')).resolves.toBe(ada);
    expect(user.get.query).toHaveBeenCalledWith({ idOrSlug: 'ada' });
  });

  it('calls the server client for a token with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    mockServer.user.get.query.mockResolvedValue(ada);

    await expect(fetchUser('ada', { token: 't1' })).resolves.toBe(ada);
    expect(mockedTrpcFor).toHaveBeenCalledWith('t1');
  });

  it('answers NOT_FOUND as legacy 404', async () => {
    mockedEnabled.mockReturnValue(true);
    user.get.query.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'User not found.'),
    );

    await expect(fetchUser('nobody')).rejects.toMatchObject({
      response: { status: 404, data: { results: null } },
    });
  });
});

describe('fetchMe', () => {
  it('sends legacy GET /mine/user with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: ada } });

    await expect(fetchMe()).resolves.toBe(ada);
    expect(mockedApi.get).toHaveBeenCalledWith('/mine/user');
  });

  it('skips the GET cache when fresh with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: ada } });

    await fetchMe({ fresh: true });
    expect(mockedApi.get).toHaveBeenCalledWith('/mine/user', { cache: false });
  });

  it('forwards a bearer token with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: ada } });

    await fetchMe({ token: 't1' });
    expect(mockedApi.get).toHaveBeenCalledWith('/mine/user', {
      headers: { Authorization: 'Bearer t1' },
    });
  });

  it('calls user.me with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.me.query.mockResolvedValue(ada);

    await expect(fetchMe({ fresh: true })).resolves.toBe(ada);
    expect(user.me.query).toHaveBeenCalled();
  });

  it('calls the server client for a token with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    mockServer.user.me.query.mockResolvedValue(ada);

    await expect(fetchMe({ token: 't1' })).resolves.toBe(ada);
    expect(mockedTrpcFor).toHaveBeenCalledWith('t1');
    expect(user.me.query).not.toHaveBeenCalled();
  });
});

describe('updateMe', () => {
  const data = { settings: { newsletter_weekly: true } };

  it('sends legacy PATCH /mine/user with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.patch.mockResolvedValue({ data: { results: ada } });

    await expect(updateMe(data)).resolves.toBe(ada);
    expect(mockedApi.patch).toHaveBeenCalledWith('/mine/user', data);
  });

  it('calls user.updateMe with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.updateMe.mutate.mockResolvedValue(ada);

    await expect(updateMe(data)).resolves.toBe(ada);
    expect(user.updateMe.mutate).toHaveBeenCalledWith(data);
  });
});

describe('updateOwnUser', () => {
  it('sends legacy PATCH /user/:id with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.patch.mockResolvedValue({ data: { results: ada } });

    await expect(updateOwnUser('u1', { photo: 'p1' })).resolves.toBe(ada);
    expect(mockedApi.patch).toHaveBeenCalledWith('/user/u1', { photo: 'p1' });
  });

  it('calls user.updateMe with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.updateMe.mutate.mockResolvedValue(ada);

    await updateOwnUser('u1', { photo: null });
    expect(user.updateMe.mutate).toHaveBeenCalledWith({ photo: null });
  });
});

describe('fetchNearbyUsers', () => {
  const near = {
    _id: 'u2',
    photo: null,
    locationName: 'Lisbon',
    distanceKm: 3,
  };

  it('sends legacy GET /users/nearby uncached with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [near] } });

    await expect(fetchNearbyUsers(8)).resolves.toEqual([near]);
    expect(mockedApi.get).toHaveBeenCalledWith('/users/nearby', {
      params: { limit: 8 },
      cache: false,
    });
  });

  it('calls user.nearby with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.nearby.query.mockResolvedValue([near]);

    await expect(fetchNearbyUsers(8)).resolves.toEqual([near]);
    expect(user.nearby.query).toHaveBeenCalledWith({ limit: 8 });
  });
});

describe('loadUsers', () => {
  const directory = {
    where: { roles: 'member', screenname: { $regex: 'a\\.b', $options: 'i' } },
    sort_by: '-lastactive',
    limit: 100,
  };

  it('calls the store get as before with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    await expect(
      loadUsers(platform, directory, { force: true }),
    ).resolves.toEqual({ results: 'action' });
    expect(platform.user.get).toHaveBeenCalledWith(directory, { force: true });
  });

  it('hands the store a user.list load with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.list.query.mockResolvedValue([ada]);

    await loadUsers(platform, directory);
    expect(platform.user.get).toHaveBeenCalledWith(directory, {
      load: expect.any(Function),
    });
    await expect(runLoad(platform.user.get)).resolves.toEqual([ada]);
    expect(user.list.query).toHaveBeenCalledWith({
      roles: ['member'],
      name: 'a.b',
      sortBy: '-lastactive',
      limit: 100,
      page: undefined,
    });
  });

  it("defaults to the store's newest-first sort", async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.list.query.mockResolvedValue([]);

    await loadUsers(platform, {
      where: { roles: { $ne: 'member' } },
      limit: 30,
    });
    await runLoad(platform.user.get);
    expect(user.list.query).toHaveBeenCalledWith({
      excludeRoles: ['member'],
      sortBy: '-created',
      limit: 30,
      page: undefined,
    });
  });

  it('maps the manage-users filter to user.adminList', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.adminList.query.mockResolvedValue([ada]);

    await loadUsers(platform, {
      where: {
        roles: 'admin',
        'subscription.plan': { $exists: false },
        created: { $gte: '2026-01-01T00:00:00.000Z' },
        email: { $regex: 'ada', $options: 'i' },
        kycPassed: true,
      },
      limit: 50,
      sort_by: 'email',
      page: 2,
    });
    await runLoad(platform.user.get);
    expect(user.adminList.query).toHaveBeenCalledWith({
      roles: ['admin'],
      hasPlan: false,
      createdAfter: '2026-01-01T00:00:00.000Z',
      email: 'ada',
      kycPassed: true,
      sortBy: 'email',
      limit: 50,
      page: 2,
    });
    expect(user.list.query).not.toHaveBeenCalled();
  });

  it('maps the citizen funnel filters to user.adminList', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.adminList.query.mockResolvedValue([]);

    await loadUsers(platform, {
      where: {
        $and: [
          { roles: { $nin: ['member', 'citizen'] } },
          {
            $or: [
              { 'citizenship.appliedAt': { $exists: true } },
              { 'citizenship.why': { $exists: true, $ne: '' } },
              { 'citizenship.status': { $exists: true } },
            ],
          },
        ],
      },
      limit: 50,
    });
    await runLoad(platform.user.get);
    expect(user.adminList.query).toHaveBeenCalledWith({
      excludeRoles: ['member', 'citizen'],
      citizenshipApplied: true,
      sortBy: '-created',
      limit: 50,
      page: undefined,
    });

    await loadUsers(platform, {
      where: {
        roles: { $nin: ['member', 'citizen'] },
        'stats.all_time.presence': { $gte: 14 },
        'affiliateApplication.status': 'pending',
      },
      limit: 50,
    });
    await runLoad(platform.user.get, 1);
    expect(user.adminList.query).toHaveBeenLastCalledWith({
      excludeRoles: ['member', 'citizen'],
      minPresence: 14,
      affiliateApplicationStatus: 'pending',
      sortBy: '-created',
      limit: 50,
      page: undefined,
    });
  });

  it('leaves out the debug-email exclusion, which has no filter', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.list.query.mockResolvedValue([]);

    await loadUsers(platform, {
      where: {
        roles: { $in: HOST_ROLES },
        email: { $ne: 'debug@example.com' },
      },
    });
    await runLoad(platform.user.get);
    expect(user.list.query).toHaveBeenCalledWith({
      roles: HOST_ROLES,
      sortBy: '-created',
      limit: undefined,
      page: undefined,
    });
  });

  it('pages 500 at a time past the cap until a short page', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    const page = (size: number, from: number) =>
      Array.from({ length: size }, (_, i) => ({ _id: `u${from + i}` }));
    user.list.query
      .mockResolvedValueOnce(page(500, 0))
      .mockResolvedValueOnce(page(500, 500))
      .mockResolvedValueOnce(page(20, 1000));

    await loadUsers(platform, { limit: 3000 });
    const rows = await runLoad(platform.user.get);
    expect(rows).toHaveLength(1020);
    expect(user.list.query.mock.calls.map(([input]) => input)).toEqual([
      { sortBy: '-created', limit: 500, page: 1 },
      { sortBy: '-created', limit: 500, page: 2 },
      { sortBy: '-created', limit: 500, page: 3 },
    ]);
  });

  it('stops paging at the legacy limit', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    const full = Array.from({ length: 500 }, (_, i) => ({ _id: `u${i}` }));
    user.list.query.mockResolvedValue(full);

    await loadUsers(platform, { limit: 1000 });
    await expect(runLoad(platform.user.get)).resolves.toHaveLength(1000);
    expect(user.list.query).toHaveBeenCalledTimes(2);
  });

  it('refuses a later page of more than 500', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();

    await loadUsers(platform, { limit: 1000, page: 2 });
    await expect(runLoad(platform.user.get)).rejects.toThrow(
      'A page past the first of more than 500 users',
    );
    expect(user.list.query).not.toHaveBeenCalled();
  });

  it('asks for more than 500 ids in parts', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    const ids = Array.from({ length: 501 }, (_, i) => `id${i}`);
    user.list.query.mockResolvedValue([ada]);

    await loadUsers(platform, { where: { _id: { $in: ids } }, limit: 2000 });
    await expect(runLoad(platform.user.get)).resolves.toEqual([ada, ada]);
    expect(
      user.list.query.mock.calls.map(([input]) => input.ids.length),
    ).toEqual([500, 1]);
  });

  it('reshapes a failed load into the axios error the store keeps', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.adminList.query.mockRejectedValue(
      trpcError(
        'BAD_REQUEST',
        400,
        "Invalid search param in 'where': kycPassed",
      ),
    );

    await loadUsers(platform, { where: { kycPassed: true } });
    await expect(runLoad(platform.user.get)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it('refuses a where it has no filter for', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();

    await loadUsers(platform, { where: { location: { $near: [0, 0] } } });
    await expect(runLoad(platform.user.get)).rejects.toThrow(
      'No user filter for where.location',
    );
  });
});

describe('usersByIdsFilter', () => {
  const filter = { limit: 4000 };

  it('keeps the legacy everyone filter with the flag off', () => {
    mockedEnabled.mockReturnValue(false);

    expect(usersByIdsFilter(filter, ['u1'])).toBe(filter);
  });

  it('keys the ids read apart from an everyone list with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.list.query.mockResolvedValue([ada]);

    const byIds = usersByIdsFilter(filter, ['u1', 'u2']);
    expect(byIds).toEqual({
      limit: 4000,
      where: { _id: { $in: ['u1', 'u2'] } },
    });
    expect(JSON.stringify(byIds)).not.toBe(JSON.stringify(filter));

    await loadUsers(platform, byIds);
    expect(platform.user.get).toHaveBeenCalledWith(byIds, {
      load: expect.any(Function),
    });
    await expect(runLoad(platform.user.get)).resolves.toEqual([ada]);
    expect(user.list.query).toHaveBeenCalledWith({
      ids: ['u1', 'u2'],
      sortBy: '-created',
    });
  });
});

describe('loadUserCount', () => {
  it('calls the store getCount with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();
    const filter = { where: { affiliate: { $ne: null, $exists: true } } };

    await expect(loadUserCount(platform, filter)).resolves.toEqual({
      results: 3,
    });
    expect(platform.user.getCount).toHaveBeenCalledWith(filter);
  });

  it('hands the store a count load with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.count.query.mockResolvedValue(4);

    await loadUserCount(platform, {
      where: {
        $and: [
          { created: { $lte: '2026-02-01T00:00:00.000Z' } },
          { created: { $gte: '2026-01-01T00:00:00.000Z' } },
          { 'subscription.plan': { $in: ['wanderer'] } },
        ],
      },
    });
    await expect(runLoad(platform.user.getCount)).resolves.toBe(4);
    expect(user.count.query).toHaveBeenCalledWith({
      createdBefore: '2026-02-01T00:00:00.000Z',
      createdAfter: '2026-01-01T00:00:00.000Z',
      plans: ['wanderer'],
    });
  });

  it('rejects, not throws, a where it has no filter for', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();

    expect(() =>
      loadUserCount(platform, { where: { location: { $near: [0, 0] } } }),
    ).not.toThrow();
    await expect(runLoad(platform.user.getCount)).rejects.toThrow(
      'No user filter for where.location',
    );
  });

  it('counts private filters with user.adminCount', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.adminCount.query.mockResolvedValue(1);

    await loadUserCount(platform, {
      where: {
        'citizenship.status': 'completed',
        'citizenship.createdAt': { $gte: '2026-01-01', $lte: '2026-02-01' },
        'subscription.subscribeDate': { $exists: true, $lte: '2026-03-01' },
      },
    });
    await runLoad(platform.user.getCount);
    expect(user.adminCount.query).toHaveBeenCalledWith({
      citizenshipStatus: 'completed',
      citizenshipCreatedAfter: '2026-01-01T00:00:00.000Z',
      citizenshipCreatedBefore: '2026-02-01T00:00:00.000Z',
      subscribedBefore: '2026-03-01T00:00:00.000Z',
    });
  });
});

describe('loadUser', () => {
  it('calls the store getOne with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    await loadUser(platform, 'u1', { force: true });
    expect(platform.user.getOne).toHaveBeenCalledWith('u1', { force: true });
  });

  it('hands the store a user.get load with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.get.query.mockResolvedValue(ada);

    await loadUser(platform, 'u1');
    await expect(runLoad(platform.user.getOne)).resolves.toBe(ada);
    expect(user.get.query).toHaveBeenCalledWith({ idOrSlug: 'u1' });
  });
});

describe('patchMe', () => {
  const data = { about: 'Gardener' };

  it('calls the store patch with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    await expect(patchMe(platform, 'u1', data)).resolves.toEqual({
      results: 'patched',
    });
    expect(platform.user.patch).toHaveBeenCalledWith('u1', data);
  });

  it('hands the store a user.updateMe load with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.updateMe.mutate.mockResolvedValue(ada);

    await patchMe(platform, 'u1', data);
    await expect(runLoad(platform.user.patch)).resolves.toBe(ada);
    expect(user.updateMe.mutate).toHaveBeenCalledWith(data);
    expect(user.update.mutate).not.toHaveBeenCalled();
  });
});

describe('patchUser', () => {
  const data = { roles: ['member', 'ambassador'] };

  it('calls the store patch with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    const platform = makePlatform();

    await patchUser(platform, 'u2', data);
    expect(platform.user.patch).toHaveBeenCalledWith('u2', data);
  });

  it('hands the store a user.update load with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    const platform = makePlatform();
    user.update.mutate.mockResolvedValue(bo);

    await patchUser(platform, 'u2', data);
    await expect(runLoad(platform.user.patch)).resolves.toBe(bo);
    expect(user.update.mutate).toHaveBeenCalledWith({ id: 'u2', data });
  });
});
