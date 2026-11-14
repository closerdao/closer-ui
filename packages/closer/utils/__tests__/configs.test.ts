import api from '../api';
import {
  createConfig,
  fetchConfig,
  fetchConfigs,
  replaceConfig,
  updateConfig,
} from '../configs';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
  },
  formatSearch: (where: unknown) => JSON.stringify(where),
}));
jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    config: {
      list: { query: jest.fn() },
      get: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      replace: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<
  'get' | 'post' | 'patch' | 'put',
  jest.Mock
>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const cfg = trpc.config as unknown as Record<string, Record<string, jest.Mock>>;

beforeEach(() => jest.clearAllMocks());

describe('with tRPC off', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('uses the legacy routes', async () => {
    const res = { data: { results: 'r' } };
    Object.values(mockedApi).forEach((fn) => fn.mockResolvedValue(res));

    await expect(
      fetchConfigs({ sort_by: '-created', limit: 100 }, true),
    ).resolves.toBe(res);
    expect(mockedApi.get).toHaveBeenCalledWith('/config', {
      params: { sort_by: '-created', limit: 100, where: undefined },
      cache: false,
    });
    await fetchConfig('rbac');
    expect(mockedApi.get).toHaveBeenCalledWith('/config/rbac', {});
    await fetchConfig('payment', true);
    expect(mockedApi.get).toHaveBeenCalledWith('/config/payment', {
      cache: false,
    });
    await createConfig({ slug: 'a' });
    expect(mockedApi.post).toHaveBeenCalledWith('/config', { slug: 'a' });
    await updateConfig('a', { value: 1 });
    expect(mockedApi.patch).toHaveBeenCalledWith('/config/a', { value: 1 });
    await replaceConfig('a', { value: 1 });
    expect(mockedApi.put).toHaveBeenCalledWith('/config/a', { value: 1 });
  });
});

describe('with tRPC on', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('calls each procedure and wraps the result as an axios body', async () => {
    cfg.list.query.mockResolvedValue([{ slug: 'a' }]);
    cfg.get.query.mockResolvedValue({ slug: 'a' });
    cfg.create.mutate.mockResolvedValue({ slug: 'a' });
    cfg.update.mutate.mockResolvedValue({ slug: 'a' });
    cfg.replace.mutate.mockResolvedValue({ slug: 'a' });

    await expect(
      fetchConfigs({ sort_by: '-created', limit: 100 }, false),
    ).resolves.toEqual({
      data: { results: [{ slug: 'a' }] },
    });
    expect(cfg.list.query).toHaveBeenCalledWith({
      limit: 100,
      sortBy: '-created',
    });
    await expect(fetchConfig('a')).resolves.toEqual({
      data: { results: { slug: 'a' } },
    });
    expect(cfg.get.query).toHaveBeenCalledWith({ idOrSlug: 'a' });
    await createConfig({ slug: 'a' });
    expect(cfg.create.mutate).toHaveBeenCalledWith({ slug: 'a' });
    await updateConfig('a', { value: 1 });
    expect(cfg.update.mutate).toHaveBeenCalledWith({
      idOrSlug: 'a',
      data: { value: 1 },
    });
    await replaceConfig('a', { value: 1 });
    expect(cfg.replace.mutate).toHaveBeenCalledWith({
      idOrSlug: 'a',
      data: { value: 1 },
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
