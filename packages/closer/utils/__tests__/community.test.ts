import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  fetchProject,
  fetchProjects,
  fetchRole,
  fetchRoles,
  fetchVolunteer,
  fetchVolunteers,
  loadLiveInteractions,
  loadResources,
  postMessage,
  projectEditModelBackend,
  registerForWebinar,
  roleEditModelBackend,
  storeVolunteersByIds,
  updateModelPhoto,
  volunteerEditModelBackend,
} from '../community';
import { applyInteractionIsHumanFromResponse } from '../interactionSession';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

jest.mock('../interactionSession', () => ({
  applyInteractionIsHumanFromResponse: jest.fn(),
}));

const mockServerGet = jest.fn();

jest.mock('../trpc', () => {
  const crud = () => ({
    list: { query: jest.fn() },
    get: { query: jest.fn() },
    create: { mutate: jest.fn() },
    update: { mutate: jest.fn() },
    remove: { mutate: jest.fn() },
  });
  return {
    ...jest.requireActual('../trpc'),
    isTrpcEnabled: jest.fn(),
    trpcFor: jest.fn(() => ({
      project: { get: { query: mockServerGet } },
      role: { get: { query: mockServerGet } },
      volunteer: { get: { query: mockServerGet } },
    })),
    trpc: {
      project: crud(),
      role: crud(),
      volunteer: crud(),
      resource: { list: { query: jest.fn() } },
      interaction: { list: { query: jest.fn() } },
      message: { send: { mutate: jest.fn() } },
      webinar: { register: { mutate: jest.fn() } },
    },
  };
});

type Crud = {
  list: { query: jest.Mock };
  get: { query: jest.Mock };
  create: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
};

const mockedApi = api as unknown as Record<'get' | 'post' | 'patch', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedTrpcFor = trpcFor as jest.Mock;
const mockedIsHuman = applyInteractionIsHumanFromResponse as jest.Mock;
const project = trpc.project as unknown as Crud;
const role = trpc.role as unknown as Crud;
const volunteer = trpc.volunteer as unknown as Crud;
const resource = trpc.resource as unknown as { list: { query: jest.Mock } };
const interaction = trpc.interaction as unknown as {
  list: { query: jest.Mock };
};
const message = trpc.message as unknown as { send: { mutate: jest.Mock } };
const webinar = trpc.webinar as unknown as { register: { mutate: jest.Mock } };

const garden = { _id: 'p1', slug: 'garden', name: 'Garden' };
const cook = { _id: 'r1', title: 'Cook' };
const weeding = { _id: 'v1', slug: 'weeding', name: 'Weeding' };

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32004,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

const makePlatform = () => ({
  volunteer: { get: jest.fn(), set: jest.fn() },
  resource: { get: jest.fn() },
  interaction: { get: jest.fn() },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('makes the list calls it replaced', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { results: [garden] } })
      .mockResolvedValueOnce({ data: { results: [cook] } })
      .mockResolvedValueOnce({ data: { results: [weeding] } })
      .mockResolvedValueOnce({ data: { results: [weeding] } });

    await expect(fetchProjects()).resolves.toEqual([garden]);
    await expect(fetchRoles()).resolves.toEqual([cook]);
    await expect(fetchVolunteers()).resolves.toEqual([weeding]);
    await expect(fetchVolunteers(500)).resolves.toEqual([weeding]);

    expect(mockedApi.get.mock.calls).toEqual([
      ['/project'],
      ['/role'],
      ['/volunteer'],
      ['/volunteer?limit=500'],
    ]);
    expect(project.list.query).not.toHaveBeenCalled();
  });

  it('makes the GET /:model/:search calls it replaced, with the SSR bearer token', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: garden } });

    await expect(fetchProject('garden')).resolves.toBe(garden);
    await fetchRole('r1', { token: 'ssr-jwt' });
    await fetchVolunteer('v1', { token: undefined });

    expect(mockedApi.get.mock.calls).toEqual([
      ['/project/garden', undefined],
      ['/role/r1', { headers: { Authorization: 'Bearer ssr-jwt' } }],
      ['/volunteer/v1', undefined],
    ]);
    expect(mockedTrpcFor).not.toHaveBeenCalled();
  });

  it('keeps the store calls it replaced', async () => {
    const platform = makePlatform();

    await storeVolunteersByIds(platform, ['v1']);
    await loadResources(platform, { sort_by: 'created' });
    await loadLiveInteractions(platform, '2026-11-11T10:00:00.000Z');

    expect(platform.volunteer.get.mock.calls).toEqual([
      [{ where: { _id: { $in: ['v1'] } } }],
    ]);
    expect(platform.resource.get.mock.calls).toEqual([
      [{ sort_by: 'created' }],
    ]);
    expect(platform.interaction.get.mock.calls).toEqual([
      [
        {
          where: { lastactive: { $gte: '2026-11-11T10:00:00.000Z' } },
          limit: 100,
          sort_by: '-lastactive',
        },
        { force: true },
      ],
    ]);
  });

  it('posts the message, the webinar signup and the photo patch it replaced', async () => {
    await postMessage('hi', ['u1']);
    await registerForWebinar({
      email: 'a@b.co',
      tags: ['x'],
      turnstileToken: 't',
    });
    await updateModelPhoto('project', 'p1', 'ph1');
    await updateModelPhoto('volunteer', 'v1', null);

    expect(mockedApi.post.mock.calls).toEqual([
      ['/message', { content: 'hi', visibleBy: ['u1'] }],
      ['/webinar', { email: 'a@b.co', tags: ['x'], turnstileToken: 't' }],
    ]);
    expect(mockedApi.patch.mock.calls).toEqual([
      ['/project/p1', { photo: 'ph1' }],
      ['/volunteer/v1', { photo: null }],
    ]);
  });

  it('leaves EditModel on its axios calls', () => {
    expect(projectEditModelBackend()).toEqual({});
    expect(roleEditModelBackend()).toEqual({});
    expect(volunteerEditModelBackend()).toEqual({});
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists with the API defaults, or the sitemap limit', async () => {
    project.list.query.mockResolvedValue([garden]);
    role.list.query.mockResolvedValue([cook]);
    volunteer.list.query.mockResolvedValue([weeding]);

    await expect(fetchProjects()).resolves.toEqual([garden]);
    await expect(fetchRoles()).resolves.toEqual([cook]);
    await expect(fetchVolunteers()).resolves.toEqual([weeding]);
    await fetchVolunteers(500);

    expect(project.list.query.mock.calls).toEqual([[{}]]);
    expect(role.list.query.mock.calls).toEqual([[{}]]);
    expect(volunteer.list.query.mock.calls).toEqual([[{}], [{ limit: 500 }]]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('rejects a failed list as the axios error callers read', async () => {
    project.list.query.mockRejectedValue(
      trpcError('INTERNAL_SERVER_ERROR', 500, 'boom'),
    );

    await expect(fetchProjects()).rejects.toMatchObject({
      message: 'boom',
      response: { status: 500, data: { error: 'boom' } },
    });
  });

  it('gets by id or slug, on the SSR client when given a token', async () => {
    project.get.query.mockResolvedValue(garden);
    mockServerGet.mockResolvedValue(cook);

    await expect(fetchProject('garden')).resolves.toBe(garden);
    await expect(fetchRole('r1', { token: 'ssr-jwt' })).resolves.toBe(cook);
    await fetchVolunteer('v1', { token: 'ssr-jwt' });

    expect(project.get.query.mock.calls).toEqual([[{ idOrSlug: 'garden' }]]);
    expect(mockedTrpcFor.mock.calls).toEqual([['ssr-jwt'], ['ssr-jwt']]);
    expect(mockServerGet.mock.calls).toEqual([
      [{ idOrSlug: 'r1' }],
      [{ idOrSlug: 'v1' }],
    ]);
    expect(role.get.query).not.toHaveBeenCalled();
  });

  it("rejects a missing document with legacy's 404", async () => {
    volunteer.get.query.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'Volunteer not found'),
    );

    await expect(fetchVolunteer('gone')).rejects.toMatchObject({
      message: 'Request failed with status code 404',
      response: { status: 404, data: { results: null } },
    });
  });

  it('puts the listed volunteers in the store, and none when the read fails', async () => {
    const platform = makePlatform();
    volunteer.list.query.mockResolvedValueOnce([weeding, {}]);

    await storeVolunteersByIds(platform, ['v1', 'v2']);

    expect(volunteer.list.query.mock.calls).toEqual([
      [{ ids: ['v1', 'v2'], sortBy: '-created' }],
    ]);
    expect(platform.volunteer.set.mock.calls).toEqual([[weeding]]);
    expect(platform.volunteer.get).not.toHaveBeenCalled();

    volunteer.list.query.mockRejectedValueOnce(new Error('down'));
    await expect(storeVolunteersByIds(platform, ['v1'])).resolves.toBe(
      undefined,
    );
    expect(platform.volunteer.set).toHaveBeenCalledTimes(1);
  });

  it("feeds the store's get() with the procedure", async () => {
    const platform = makePlatform();
    resource.list.query.mockResolvedValue([{ _id: 'x' }]);
    interaction.list.query.mockResolvedValue([{ _id: 'i1' }]);

    loadResources(platform, { sort_by: 'created' });
    loadLiveInteractions(platform, '2026-11-11T10:00:00.000Z');

    const [resourceKey, resourceOpts] = platform.resource.get.mock.calls[0];
    const [liveKey, liveOpts] = platform.interaction.get.mock.calls[0];
    expect(resourceKey).toEqual({ sort_by: 'created' });
    expect(liveKey).toEqual({
      where: { lastactive: { $gte: '2026-11-11T10:00:00.000Z' } },
      limit: 100,
      sort_by: '-lastactive',
    });
    expect(liveOpts.force).toBe(true);
    await expect(resourceOpts.load()).resolves.toEqual([{ _id: 'x' }]);
    await expect(liveOpts.load()).resolves.toEqual([{ _id: 'i1' }]);
    expect(resource.list.query.mock.calls).toEqual([[{ sortBy: 'created' }]]);
    expect(interaction.list.query.mock.calls).toEqual([
      [
        {
          lastactiveSince: '2026-11-11T10:00:00.000Z',
          limit: 100,
          sortBy: '-lastactive',
        },
      ],
    ]);

    interaction.list.query.mockRejectedValue(
      trpcError('FORBIDDEN', 403, 'Forbidden'),
    );
    await expect(liveOpts.load()).rejects.toMatchObject({
      response: { status: 403, data: { error: 'Forbidden' } },
    });
    expect(platform.interaction.get).toHaveBeenCalledTimes(1);
  });

  it('sends the message and registers for the webinar', async () => {
    webinar.register.mutate.mockResolvedValue({ isHuman: true });
    message.send.mutate.mockResolvedValue({});

    await postMessage('hi', ['u1']);
    await registerForWebinar({ email: 'a@b.co', turnstileToken: 't' });

    expect(message.send.mutate.mock.calls).toEqual([
      [{ content: 'hi', visibleBy: ['u1'] }],
    ]);
    expect(webinar.register.mutate.mock.calls).toEqual([
      [{ email: 'a@b.co', turnstileToken: 't' }],
    ]);
    expect(mockedIsHuman).toHaveBeenCalledWith({ isHuman: true });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('throws the axios-shaped error from a failed webinar signup or message', async () => {
    webinar.register.mutate.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'Turnstile verification failed'),
    );
    message.send.mutate.mockRejectedValue(
      trpcError('UNAUTHORIZED', 401, 'Unauthorized'),
    );

    await expect(
      registerForWebinar({ email: 'a@b.co', turnstileToken: 't' }),
    ).rejects.toMatchObject({
      response: { data: { error: 'Turnstile verification failed' } },
    });
    await expect(postMessage('hi', ['u1'])).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(mockedIsHuman).not.toHaveBeenCalled();
  });

  it("reads a webinar 500 as legacy's error text, ignoring the debug detail", async () => {
    webinar.register.mutate.mockRejectedValue(
      new TRPCClientError('Failed to register user for webinar', {
        result: {
          error: {
            message: 'Failed to register user for webinar',
            code: -32603,
            data: {
              code: 'INTERNAL_SERVER_ERROR',
              httpStatus: 500,
              zodError: null,
              debug: { errorMessage: 'x', errorStack: 'y' },
            },
          },
        },
      }),
    );

    await expect(
      registerForWebinar({ email: 'a@b.co', turnstileToken: 't' }),
    ).rejects.toMatchObject({
      message: 'Failed to register user for webinar',
      response: {
        status: 500,
        data: { error: 'Failed to register user for webinar' },
      },
    });
  });

  it('patches the photo on the project or volunteer', async () => {
    project.update.mutate.mockResolvedValueOnce(garden);
    volunteer.update.mutate.mockResolvedValueOnce(weeding);
    await updateModelPhoto('project', 'p1', 'ph1');
    await updateModelPhoto('volunteer', 'v1', null);

    expect(project.update.mutate.mock.calls).toEqual([
      [{ idOrSlug: 'p1', data: { photo: 'ph1' } }],
    ]);
    expect(volunteer.update.mutate.mock.calls).toEqual([
      [{ idOrSlug: 'v1', data: { photo: null } }],
    ]);
    expect(mockedApi.patch).not.toHaveBeenCalled();

    project.update.mutate.mockRejectedValue(
      trpcError('FORBIDDEN', 403, 'Forbidden'),
    );
    await expect(updateModelPhoto('project', 'p1', null)).rejects.toMatchObject(
      { response: { status: 403 } },
    );
  });

  it.each([
    ['project', projectEditModelBackend, project],
    ['role', roleEditModelBackend, role],
  ] as const)('backs EditModel for %s', async (_name, backend, crud) => {
    crud.get.query.mockResolvedValue(garden);
    crud.create.mutate.mockResolvedValue(garden);
    crud.update.mutate.mockResolvedValue(garden);
    crud.remove.mutate.mockResolvedValue({ deleted: true });
    const { load, save, remove } = backend() as Required<
      ReturnType<typeof backend>
    >;

    await expect(load('x1')).resolves.toBe(garden);
    await expect(save({ a: 1 })).resolves.toBe(garden);
    await expect(save({ a: 2 }, 'x1')).resolves.toBe(garden);
    await expect(remove('x1')).resolves.toBe(undefined);

    expect(crud.get.query.mock.calls).toEqual([[{ idOrSlug: 'x1' }]]);
    expect(crud.create.mutate.mock.calls).toEqual([[{ a: 1 }]]);
    expect(crud.update.mutate.mock.calls).toEqual([
      [{ idOrSlug: 'x1', data: { a: 2 } }],
    ]);
    expect(crud.remove.mutate.mock.calls).toEqual([[{ id: 'x1' }]]);

    crud.update.mutate.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'Invalid'),
    );
    await expect(save({ a: 3 }, 'x1')).rejects.toMatchObject({
      response: { status: 400, data: { error: 'Invalid' } },
    });
  });

  it('backs EditModel for a volunteer opportunity', async () => {
    volunteer.get.query.mockResolvedValue(weeding);
    volunteer.update.mutate.mockResolvedValue(weeding);
    volunteer.remove.mutate.mockResolvedValue({ deleted: true });
    const { load, save, remove } = volunteerEditModelBackend() as Required<
      ReturnType<typeof volunteerEditModelBackend>
    >;

    await expect(load('v1')).resolves.toBe(weeding);
    await expect(save({ name: 'x' }, 'v1')).resolves.toBe(weeding);
    await expect(remove('v1')).resolves.toBe(undefined);

    expect(volunteer.update.mutate.mock.calls).toEqual([
      [{ idOrSlug: 'v1', data: { name: 'x' } }],
    ]);
    expect(volunteer.remove.mutate.mock.calls).toEqual([[{ id: 'v1' }]]);
  });
});
