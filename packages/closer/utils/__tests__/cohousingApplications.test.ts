import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  adminCreateCohousingApplication,
  createCohousingApplication,
  fetchMyCohousingApplications,
  loadCohousingApplication,
  loadCohousingApplications,
  patchCohousingApplication,
} from '../cohousingApplications';
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
    cohousingApplication: {
      list: { query: jest.fn() },
      mine: { query: jest.fn() },
      get: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      adminCreate: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const cohousing = trpc.cohousingApplication as unknown as Record<
  string,
  { query: jest.Mock; mutate: jest.Mock }
>;

const makePlatform = () => ({
  cohousingapplication: {
    get: jest.fn().mockResolvedValue(undefined),
    getOne: jest.fn().mockResolvedValue(undefined),
    patch: jest.fn().mockResolvedValue(undefined),
  },
});

// The `load` the helper handed the store, which the store runs instead of its own request.
const runLoad = (mock: jest.Mock) => {
  const args = mock.mock.calls[0];
  return args[args.length - 1].load();
};

const app = { _id: 'c1', status: 'waitlist', intake: { fullName: 'Ada' } };

const unauthorized = new TRPCClientError('Unauthorized', {
  result: {
    error: {
      message: 'Unauthorized',
      code: -32001,
      data: { code: 'UNAUTHORIZED', httpStatus: 401, zodError: null },
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('loads the list, one application and patch through the store', () => {
    const platform = makePlatform();
    const filter = {
      where: { createdBy: 'u1' },
      limit: 50,
      sort_by: '-created',
    };

    loadCohousingApplications(platform, filter, { force: true });
    loadCohousingApplication(platform, 'c1');
    patchCohousingApplication(platform, 'c1', { currentStep: 2 });

    expect(platform.cohousingapplication.get).toHaveBeenCalledWith(filter, {
      force: true,
    });
    expect(platform.cohousingapplication.getOne).toHaveBeenCalledWith('c1', {});
    expect(platform.cohousingapplication.patch).toHaveBeenCalledWith('c1', {
      currentStep: 2,
    });
    expect(cohousing.list.query).not.toHaveBeenCalled();
  });

  it('reads mine and posts both creates', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [app] } });
    mockedApi.post.mockResolvedValue({ data: { results: app } });

    await expect(fetchMyCohousingApplications()).resolves.toEqual([app]);
    await expect(
      createCohousingApplication({ isDraft: true }),
    ).resolves.toEqual(app);
    await expect(
      adminCreateCohousingApplication({ createdBy: 'u2' }),
    ).resolves.toEqual(app);

    expect(mockedApi.get).toHaveBeenCalledWith('/my/CohousingApplication');
    expect(mockedApi.post).toHaveBeenCalledWith('/CohousingApplication', {
      isDraft: true,
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/admin/cohousingapplication', {
      createdBy: 'u2',
    });
    expect(cohousing.create.mutate).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists under the applicant or co-signer filter', async () => {
    const platform = makePlatform();
    const filter = {
      where: { 'cosigner.userId': 'u1' },
      limit: 10,
      sort_by: '-created',
    };
    cohousing.list.query.mockResolvedValue([app, {}]);

    loadCohousingApplications(platform, filter, { force: true });

    expect(platform.cohousingapplication.get.mock.calls[0][0]).toBe(filter);
    expect(platform.cohousingapplication.get.mock.calls[0][1].force).toBe(true);
    await expect(runLoad(platform.cohousingapplication.get)).resolves.toEqual([
      app,
      {},
    ]);
    expect(cohousing.list.query).toHaveBeenCalledWith({
      cosignerUserId: 'u1',
      limit: 10,
      sortBy: '-created',
    });
  });

  it('lists every application in the dashboard order, newest first by default', async () => {
    const platform = makePlatform();
    cohousing.list.query.mockResolvedValue([]);

    loadCohousingApplications(platform, { sort_by: 'queuedAt', limit: 200 });
    await runLoad(platform.cohousingapplication.get);
    loadCohousingApplications(platform, { where: { createdBy: 'u1' } });
    await platform.cohousingapplication.get.mock.calls[1][1].load();

    expect(cohousing.list.query).toHaveBeenNthCalledWith(1, {
      limit: 200,
      sortBy: 'queuedAt',
    });
    expect(cohousing.list.query).toHaveBeenNthCalledWith(2, {
      createdBy: 'u1',
      sortBy: '-created',
    });
  });

  it('reads one application and patches through update', async () => {
    const platform = makePlatform();
    cohousing.get.query.mockResolvedValue(app);
    cohousing.update.mutate.mockResolvedValue({ ...app, currentStep: 2 });

    loadCohousingApplication(platform, 'c1', { force: true });
    patchCohousingApplication(platform, 'c1', { currentStep: 2 });

    expect(platform.cohousingapplication.getOne.mock.calls[0][0]).toBe('c1');
    await expect(
      runLoad(platform.cohousingapplication.getOne),
    ).resolves.toEqual(app);
    await expect(runLoad(platform.cohousingapplication.patch)).resolves.toEqual(
      { ...app, currentStep: 2 },
    );
    expect(cohousing.get.query).toHaveBeenCalledWith({ id: 'c1' });
    expect(cohousing.update.mutate).toHaveBeenCalledWith({
      id: 'c1',
      data: { currentStep: 2 },
    });
  });

  it('reads mine and creates', async () => {
    cohousing.mine.query.mockResolvedValue([]);
    cohousing.create.mutate.mockResolvedValue(app);
    cohousing.adminCreate.mutate.mockResolvedValue(app);

    await expect(fetchMyCohousingApplications()).resolves.toEqual([]);
    await expect(
      createCohousingApplication({ isDraft: true }),
    ).resolves.toEqual(app);
    await expect(
      adminCreateCohousingApplication({ createdBy: 'u2', source: 'admin' }),
    ).resolves.toEqual(app);

    expect(cohousing.create.mutate).toHaveBeenCalledWith({ isDraft: true });
    expect(cohousing.adminCreate.mutate).toHaveBeenCalledWith({
      createdBy: 'u2',
      source: 'admin',
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a refused admin create with its text', async () => {
    cohousing.adminCreate.mutate.mockRejectedValue(unauthorized);

    const error = await adminCreateCohousingApplication({}).catch((e) => e);

    expect(parseMessageFromError(error)).toBe('Unauthorized');
  });
});
