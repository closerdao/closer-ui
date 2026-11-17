import api from '../api';
import { isTrpcEnabled, trpc } from '../trpc';
import {
  approveVillage,
  createVillage,
  fetchFederationVillages,
  fetchVillageCreatedBy,
  fetchVillages,
  getVillage,
  inviteVillageOwner,
  isVillageSubdomainTaken,
  resetVillageDeploy,
  updateVillage,
} from '../village.utils';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => JSON.stringify(where),
  invalidateGetCache: jest.fn(),
}));
jest.mock('../users', () => ({ fetchUsersWhere: jest.fn() }));
jest.mock('../trpc', () => {
  const proc = () => ({ query: jest.fn(), mutate: jest.fn() });
  return {
    ...jest.requireActual('../trpc'),
    isTrpcEnabled: jest.fn(),
    trpc: {
      village: Object.fromEntries(
        [
          'list',
          'get',
          'create',
          'update',
          'approve',
          'inviteOwner',
          'resetDeploy',
        ].map((name) => [name, proc()]),
      ),
    },
  };
});

const mockedApi = api as unknown as Record<'get' | 'post' | 'patch', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const procs = trpc.village as unknown as Record<
  string,
  { query: jest.Mock; mutate: jest.Mock }
>;
const village = { _id: 'v1', name: 'Alpha' };
beforeEach(() => {
  jest.clearAllMocks();
  mockedEnabled.mockReturnValue(false);
});

describe('flag off: legacy routes', () => {
  it('lists, reads and writes through axios', async () => {
    mockedApi.get.mockImplementation(async (url: string) => ({
      data: { results: url === '/village/alpha' ? village : [village] },
    }));
    mockedApi.post.mockResolvedValue({ data: { results: village } });
    mockedApi.patch.mockResolvedValue({ data: { results: village } });
    expect(await fetchVillages()).toEqual([village]);
    expect(await getVillage('alpha')).toEqual(village);
    expect(await isVillageSubdomainTaken('alpha', 'v2')).toBe(true);
    expect(await fetchVillageCreatedBy('u1')).toEqual(village);
    expect(await fetchFederationVillages(['v1'], [], 5)).toEqual({
      results: [village],
    });
    expect(await approveVillage('v1')).toEqual(village);
    expect(await updateVillage('v1', { name: 'B' })).toEqual(village);
    expect(await resetVillageDeploy('v1')).toEqual(village);
    await inviteVillageOwner('v1', 'a@b.c');
    await createVillage({ name: 'A', coords: [1, 2] } as any);
    expect(mockedApi.post).toHaveBeenCalledWith('/villages/v1/invite-owner', {
      email: 'a@b.c',
    });
    Object.values(procs).forEach((p) => {
      expect(p.query).not.toHaveBeenCalled();
      expect(p.mutate).not.toHaveBeenCalled();
    });
  });
});

describe('flag on: village procedures', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('maps list filters to the procedure input', async () => {
    procs.list.query.mockResolvedValue([village]);
    expect(
      await fetchVillages({ status: 'live' as any, tags: 'a, b', limit: 5 }),
    ).toEqual([village]);
    expect(procs.list.query).toHaveBeenCalledWith({
      visibility: 'public',
      status: 'live',
      country: undefined,
      onboardingStatus: undefined,
      tags: ['a', 'b'],
      limit: 5,
      page: undefined,
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('returns [] when the list fails, null when get fails', async () => {
    procs.list.query.mockRejectedValue(new Error('x'));
    procs.get.query.mockRejectedValue(new Error('x'));
    expect(await fetchVillages()).toEqual([]);
    expect(await getVillage('a')).toBeNull();
  });

  it('reads one village and the lookups', async () => {
    procs.get.query.mockResolvedValue({ results: village });
    procs.list.query.mockResolvedValue([village]);
    expect(await getVillage('alpha')).toEqual(village);
    expect(procs.get.query).toHaveBeenCalledWith({ idOrSlug: 'alpha' });
    expect(await isVillageSubdomainTaken('alpha', 'v2')).toBe(true);
    expect(procs.list.query).toHaveBeenLastCalledWith({
      slug: 'alpha',
      excludeId: 'v2',
      limit: 1,
    });
    expect(await fetchVillageCreatedBy('u1')).toEqual(village);
    expect(procs.list.query).toHaveBeenLastCalledWith({
      createdBy: 'u1',
      limit: 1,
    });
    expect(await fetchFederationVillages(['v1'], ['u1'], 200)).toEqual({
      results: [village],
    });
    expect(procs.list.query).toHaveBeenLastCalledWith({
      anyOf: { ids: ['v1'], createdBy: ['u1'] },
      limit: 200,
    });
  });

  it('federation lookup answers null when the list fails', async () => {
    procs.list.query.mockRejectedValue(new Error('x'));
    expect(await fetchFederationVillages([], ['u1'], 5)).toBeNull();
  });

  it('writes through the procedures', async () => {
    procs.create.mutate.mockResolvedValue({ results: village });
    procs.update.mutate.mockResolvedValue({ results: village });
    procs.approve.mutate.mockResolvedValue({ results: village });
    procs.resetDeploy.mutate.mockResolvedValue({ results: village });
    procs.inviteOwner.mutate.mockResolvedValue({});
    expect(await createVillage({ name: 'A', coords: [1, 2] } as any)).toEqual(
      village,
    );
    expect(await updateVillage('v1', { name: 'B' })).toEqual(village);
    expect(procs.update.mutate).toHaveBeenCalledWith({
      idOrSlug: 'v1',
      data: { name: 'B' },
    });
    expect(await approveVillage('v1')).toEqual(village);
    expect(await resetVillageDeploy('v1')).toEqual(village);
    await inviteVillageOwner('v1', 'a@b.c');
    expect(procs.inviteOwner.mutate).toHaveBeenCalledWith({
      id: 'v1',
      email: 'a@b.c',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rethrows a refusal as the axios-shaped error', async () => {
    const { TRPCClientError } = jest.requireActual('@trpc/client');
    const err = new TRPCClientError('Nope', {
      result: {
        error: { message: 'Nope', code: -1, data: { httpStatus: 403 } },
      },
    } as any);
    (err as any).data = { httpStatus: 403 };
    procs.approve.mutate.mockRejectedValue(err);
    await expect(approveVillage('v1')).rejects.toMatchObject({
      message: 'Nope',
      response: { status: 403, data: { error: 'Nope' } },
    });
  });
});
