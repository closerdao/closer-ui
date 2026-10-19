import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  createApplication,
  fetchApplicationById,
  loadApplicationCount,
  loadApplications,
  patchApplication,
  toApplicationFilterInput,
} from '../applications';
import { parseMessageFromError } from '../common';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    application: {
      list: { query: jest.fn() },
      count: { query: jest.fn() },
      get: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const application = trpc.application as unknown as Record<
  string,
  { query: jest.Mock; mutate: jest.Mock }
>;

const makePlatform = () => ({
  application: {
    get: jest.fn().mockResolvedValue(undefined),
    getCount: jest.fn().mockResolvedValue(undefined),
    patch: jest.fn().mockResolvedValue(undefined),
  },
});

// The `load` the helper handed the store, which the store runs instead of its own request.
const runLoad = (mock: jest.Mock) => {
  const args = mock.mock.calls[0];
  return args[args.length - 1].load();
};

const app = { _id: 'a1', name: 'Ada', status: 'open' };

const notFound = new TRPCClientError('Application not found', {
  result: {
    error: {
      message: 'Application not found',
      code: -32004,
      data: { code: 'NOT_FOUND', httpStatus: 404, zodError: null },
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('toApplicationFilterInput', () => {
  it('maps each store where onto the named filters', () => {
    expect(toApplicationFilterInput(undefined)).toEqual({});
    expect(toApplicationFilterInput({ status: 'open' })).toEqual({
      status: 'open',
    });
    expect(
      toApplicationFilterInput({ status: 'open', managedBy: { $in: ['u1'] } }),
    ).toEqual({ status: 'open', managedBy: 'u1' });
    expect(
      toApplicationFilterInput({ managedBy: { $in: [null, []] } }),
    ).toEqual({ managedBy: null });
    expect(toApplicationFilterInput({ managedBy: 'u1' })).toEqual({
      managedBy: 'u1',
    });
    expect(
      toApplicationFilterInput({
        status: { $in: ['conversation', 'approved'] },
        created: {
          $gte: new Date('2026-01-01T00:00:00Z'),
          $lte: '2026-01-31T00:00:00.000Z',
        },
      }),
    ).toEqual({
      status: ['conversation', 'approved'],
      createdAfter: '2026-01-01T00:00:00.000Z',
      createdBefore: '2026-01-31T00:00:00.000Z',
    });
  });
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('loads the list, count and patch through the store', () => {
    const platform = makePlatform();
    const filter = { where: { status: 'open' }, limit: 20, page: 2 };

    loadApplications(platform, filter, { force: true });
    loadApplicationCount(platform, { where: filter.where });
    patchApplication(platform, 'a1', { status: 'approved' });

    expect(platform.application.get).toHaveBeenCalledWith(filter, {
      force: true,
    });
    expect(platform.application.getCount).toHaveBeenCalledWith({
      where: filter.where,
    });
    expect(platform.application.patch).toHaveBeenCalledWith('a1', {
      status: 'approved',
    });
    expect(application.list.query).not.toHaveBeenCalled();
  });

  it('reads and posts one application', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: app } });
    mockedApi.post.mockResolvedValue({ data: { results: app } });

    await expect(fetchApplicationById('a1')).resolves.toEqual(app);
    await expect(
      createApplication({ name: 'Ada', referredBy: 'r1' }),
    ).resolves.toEqual(app);

    expect(mockedApi.get).toHaveBeenCalledWith('/application/a1');
    expect(mockedApi.post).toHaveBeenCalledWith('/application', {
      name: 'Ada',
      referredBy: 'r1',
    });
    expect(application.create.mutate).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists newest first under the store filter', async () => {
    const platform = makePlatform();
    const filter = {
      where: { managedBy: { $in: [null, []] } },
      limit: 20,
      page: 2,
    };
    application.list.query.mockResolvedValue([app, {}]);

    loadApplications(platform, filter, { force: true });

    expect(platform.application.get.mock.calls[0][0]).toBe(filter);
    expect(platform.application.get.mock.calls[0][1].force).toBe(true);
    await expect(runLoad(platform.application.get)).resolves.toEqual([app, {}]);
    expect(application.list.query).toHaveBeenCalledWith({
      managedBy: null,
      limit: 20,
      page: 2,
      sortBy: '-created',
    });
  });

  it('counts under the store filter', async () => {
    const platform = makePlatform();
    const filter = { where: { status: 'open' }, limit: 10, page: 1 };
    application.count.query.mockResolvedValue(7);

    loadApplicationCount(platform, filter);

    expect(platform.application.getCount.mock.calls[0][0]).toBe(filter);
    await expect(runLoad(platform.application.getCount)).resolves.toBe(7);
    expect(application.count.query).toHaveBeenCalledWith({ status: 'open' });
  });

  it('patches through update', async () => {
    const platform = makePlatform();
    application.update.mutate.mockResolvedValue({ ...app, status: 'approved' });

    patchApplication(platform, 'a1', { status: 'approved' });

    expect(platform.application.patch.mock.calls[0].slice(0, 2)).toEqual([
      'a1',
      { status: 'approved' },
    ]);
    await expect(runLoad(platform.application.patch)).resolves.toEqual({
      ...app,
      status: 'approved',
    });
    expect(application.update.mutate).toHaveBeenCalledWith({
      id: 'a1',
      data: { status: 'approved' },
    });
  });

  it('reads one application, rejecting a missing one with its text', async () => {
    application.get.query.mockResolvedValueOnce(app);
    application.get.query.mockRejectedValueOnce(notFound);

    await expect(fetchApplicationById('a1')).resolves.toEqual(app);
    const error = await fetchApplicationById('a2').catch((e) => e);

    expect(application.get.query).toHaveBeenCalledWith({ id: 'a1' });
    expect(parseMessageFromError(error)).toBe('Application not found');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('creates the application', async () => {
    application.create.mutate.mockResolvedValue(app);

    await expect(createApplication({ name: 'Ada' })).resolves.toEqual(app);

    expect(application.create.mutate).toHaveBeenCalledWith({ name: 'Ada' });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
