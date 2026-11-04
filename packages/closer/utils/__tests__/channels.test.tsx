import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  channelEditModelBackend,
  fetchChannel,
  fetchChannels,
  fetchChannelsByIds,
  subscribeToChannel,
  updateChannel,
} from '../channels';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  formatSearch: jest.requireActual('../api').formatSearch,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    channel: {
      list: { query: jest.fn() },
      byIds: { query: jest.fn() },
      get: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
      subscribe: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<'get' | 'post' | 'patch', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const channel = trpc.channel as unknown as {
  list: { query: jest.Mock };
  byIds: { query: jest.Mock };
  get: { query: jest.Mock };
  create: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
  subscribe: { mutate: jest.Mock };
};

const general = { _id: 'c1', slug: 'general', name: 'General' };
const garden = { _id: 'c2', slug: 'garden', name: 'Garden' };

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32000,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('makes the GET /channel calls it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [general, {}] } });

    await expect(
      fetchChannels({ limit: 200, sort_by: 'name' }),
    ).resolves.toEqual([general, {}]);
    await fetchChannelsByIds(['c1', 'c2']);

    expect(mockedApi.get.mock.calls).toEqual([
      ['/channel', { params: { limit: 200, sort_by: 'name' } }],
      [
        '/channel',
        {
          params: {
            where: encodeURIComponent('{"_id":{"$in":["c1","c2"]}}'),
          },
        },
      ],
    ]);
    expect(channel.list.query).not.toHaveBeenCalled();
    expect(channel.byIds.query).not.toHaveBeenCalled();
  });

  it('makes the GET /channel/:slug call it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: general } });

    await expect(fetchChannel('general')).resolves.toBe(general);

    expect(mockedApi.get.mock.calls).toEqual([['/channel/general']]);
    expect(channel.get.query).not.toHaveBeenCalled();
  });

  it('makes the PATCH /channel/:id call it replaced', async () => {
    mockedApi.patch.mockResolvedValue({ data: { results: general } });

    await expect(
      updateChannel('c1', { pendingUserIds: [], visibleBy: ['u1'] }),
    ).resolves.toBeUndefined();

    expect(mockedApi.patch.mock.calls).toEqual([
      ['/channel/c1', { pendingUserIds: [], visibleBy: ['u1'] }],
    ]);
    expect(channel.update.mutate).not.toHaveBeenCalled();
  });

  it('makes the POST /channel/:id/subscribe call it replaced', async () => {
    mockedApi.post.mockResolvedValue({
      data: { message: 'Successfully subscribed to channel.' },
    });

    await expect(subscribeToChannel('c1')).resolves.toEqual({
      message: 'Successfully subscribed to channel.',
    });

    expect(mockedApi.post.mock.calls).toEqual([['/channel/c1/subscribe']]);
    expect(channel.subscribe.mutate).not.toHaveBeenCalled();
  });

  it('rejects when the request fails, so callers keep their fallbacks', async () => {
    mockedApi.get.mockRejectedValue(new Error('Request failed with 404'));

    await expect(fetchChannel('gone')).rejects.toThrow(
      'Request failed with 404',
    );
  });

  it('leaves EditModel on axios', () => {
    expect(channelEditModelBackend()).toEqual({});
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists with the caller limit and sort', async () => {
    channel.list.query.mockResolvedValue([general, {}]);

    await expect(
      fetchChannels({ limit: 200, sort_by: 'name' }),
    ).resolves.toEqual([general, {}]);

    expect(channel.list.query.mock.calls).toEqual([
      [{ limit: 200, sortBy: 'name' }],
    ]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads channels by id', async () => {
    channel.byIds.query.mockResolvedValue([general, garden]);

    await expect(fetchChannelsByIds(['c1', 'c2'])).resolves.toEqual([
      general,
      garden,
    ]);

    expect(channel.byIds.query).toHaveBeenCalledWith({ ids: ['c1', 'c2'] });
  });

  it('reads one by id or slug, rejecting a missing one with legacy 404', async () => {
    channel.get.query.mockResolvedValueOnce(general);
    channel.get.query.mockRejectedValueOnce(
      trpcError('NOT_FOUND', 404, 'Channel not found.'),
    );

    await expect(fetchChannel('general')).resolves.toBe(general);
    await expect(fetchChannel('gone')).rejects.toMatchObject({
      response: { status: 404, data: { results: null } },
    });

    expect(channel.get.query.mock.calls).toEqual([
      [{ idOrSlug: 'general' }],
      [{ idOrSlug: 'gone' }],
    ]);
  });

  it('updates by id', async () => {
    channel.update.mutate.mockResolvedValue(general);

    await expect(
      updateChannel('c1', { pendingUserIds: ['u2'] }),
    ).resolves.toBeUndefined();

    expect(channel.update.mutate).toHaveBeenCalledWith({
      id: 'c1',
      data: { pendingUserIds: ['u2'] },
    });
    expect(mockedApi.patch).not.toHaveBeenCalled();
  });

  it('subscribes and hands back the message callers match on', async () => {
    channel.subscribe.mutate.mockResolvedValue({
      message: 'Your request has been sent to an admin for approval.',
    });

    await expect(subscribeToChannel('c1')).resolves.toEqual({
      message: 'Your request has been sent to an admin for approval.',
    });

    expect(channel.subscribe.mutate).toHaveBeenCalledWith({ id: 'c1' });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a refused subscribe with the API message as err.message', async () => {
    channel.subscribe.mutate.mockRejectedValue(
      trpcError(
        'BAD_REQUEST',
        400,
        'Ground channels are automatically managed.',
      ),
    );

    await expect(subscribeToChannel('c1')).rejects.toMatchObject({
      message: 'Ground channels are automatically managed.',
      response: {
        status: 400,
        data: { error: 'Ground channels are automatically managed.' },
      },
    });
  });

  describe('channelEditModelBackend', () => {
    it('loads by id', async () => {
      channel.get.query.mockResolvedValue(general);

      await expect(channelEditModelBackend().load!('c1')).resolves.toBe(
        general,
      );
      expect(channel.get.query).toHaveBeenCalledWith({ idOrSlug: 'c1' });
    });

    it('creates without an id and updates with one', async () => {
      channel.create.mutate.mockResolvedValue(general);
      channel.update.mutate.mockResolvedValue(general);
      const { save } = channelEditModelBackend();

      await save!({ name: 'General' });
      await save!({ name: 'General' }, 'c1');

      expect(channel.create.mutate).toHaveBeenCalledWith({ name: 'General' });
      expect(channel.update.mutate).toHaveBeenCalledWith({
        id: 'c1',
        data: { name: 'General' },
      });
    });

    it('removes by id', async () => {
      channel.remove.mutate.mockResolvedValue({ deleted: true });

      await expect(channelEditModelBackend().remove!('c1')).resolves.toBe(
        undefined,
      );
      expect(channel.remove.mutate).toHaveBeenCalledWith({ id: 'c1' });
    });

    it('rejects with the error EditModel already knows how to show', async () => {
      channel.update.mutate.mockRejectedValue(
        trpcError('NOT_FOUND', 404, 'Channel not found.'),
      );

      await expect(
        channelEditModelBackend().save!({}, 'gone'),
      ).rejects.toMatchObject({ message: 'Channel not found.' });
    });
  });
});
