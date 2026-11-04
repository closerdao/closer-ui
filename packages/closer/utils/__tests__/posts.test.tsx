import { act, renderHook, waitFor } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';
import { fromJS } from 'immutable';

import api from '../api';
import {
  PostFilter,
  countPosts,
  createPost,
  deletePost,
  fetchPosts,
  usePosts,
} from '../posts';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  formatSearch: jest.requireActual('../api').formatSearch,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    post: {
      list: { query: jest.fn() },
      count: { query: jest.fn() },
      create: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<
  'get' | 'post' | 'delete',
  jest.Mock
>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const post = trpc.post as unknown as {
  list: { query: jest.Mock };
  count: { query: jest.Mock };
  create: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
};

const hello = { _id: 'p1', content: 'Hello', parentType: 'channel' };
const comment = {
  _id: 'p2',
  content: 'Agree',
  parentType: 'proposal',
  parentId: 'prop1',
};
const reply = {
  _id: 'p3',
  content: 'Me too',
  parentType: 'post',
  parentId: 'p2',
};

const commentFilter: PostFilter = {
  where: { parentType: 'proposal', parentId: 'prop1' },
  limit: 1000,
};
const repliesFilter: PostFilter = {
  where: { parentType: 'post', parentId: { $in: ['p2', 'p4'] } },
  limit: 1000,
};

const makePlatform = () => ({
  post: {
    find: jest.fn(),
    areLoading: jest.fn(),
    get: jest.fn().mockResolvedValue(undefined),
    post: jest.fn().mockResolvedValue(undefined),
  },
});

const badRequest = (message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
      },
    },
  });

const where = (value: unknown) => encodeURIComponent(JSON.stringify(value));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('makes the GET /post calls it replaced, `where` keys in caller order', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [hello, {}] } });

    await expect(
      fetchPosts(
        { parentType: 'channel', parentId: undefined, channel: 'c1' },
        50,
      ),
    ).resolves.toEqual([hello, {}]);
    await fetchPosts(
      { channel: null, parentType: 'post', parentId: 'p1' },
      100,
    );

    expect(mockedApi.get.mock.calls).toEqual([
      [
        '/post',
        {
          params: {
            where: where({ parentType: 'channel', channel: 'c1' }),
            sort_by: '-created',
            limit: 50,
          },
        },
      ],
      [
        '/post',
        {
          params: {
            where: where({ channel: null, parentType: 'post', parentId: 'p1' }),
            sort_by: '-created',
            limit: 100,
          },
        },
      ],
    ]);
    expect(post.list.query).not.toHaveBeenCalled();
  });

  it('makes the GET /count/post calls it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: 3 } });

    await expect(countPosts('c1', '2026-10-01T00:00:00.000Z')).resolves.toBe(3);
    await countPosts('c1', null);

    expect(mockedApi.get.mock.calls).toEqual([
      [
        '/count/post',
        {
          params: {
            where: where({
              channel: 'c1',
              created: { $gt: '2026-10-01T00:00:00.000Z' },
            }),
          },
        },
      ],
      ['/count/post', { params: { where: where({ channel: 'c1' }) } }],
    ]);
    expect(post.count.query).not.toHaveBeenCalled();
  });

  it('makes the POST and DELETE /post calls it replaced', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: hello } });
    mockedApi.delete.mockResolvedValue({ data: {} });

    await expect(createPost({ content: 'Hello', channel: 'c1' })).resolves.toBe(
      hello,
    );
    await expect(deletePost('p1')).resolves.toBeUndefined();

    expect(mockedApi.post.mock.calls).toEqual([
      ['/post', { content: 'Hello', channel: 'c1' }],
    ]);
    expect(mockedApi.delete.mock.calls).toEqual([['/post/p1']]);
    expect(post.create.mutate).not.toHaveBeenCalled();
    expect(post.remove.mutate).not.toHaveBeenCalled();
  });

  it('rejects when the request fails, so callers show their error', async () => {
    mockedApi.post.mockRejectedValue(new Error('Request failed with 400'));

    await expect(createPost({ content: '' })).rejects.toThrow(
      'Request failed with 400',
    );
  });

  it('loads the filter into the store and reads list and loading from there', () => {
    const platform = makePlatform();
    const stored = fromJS([comment]);
    platform.post.find.mockReturnValue(stored);
    platform.post.areLoading.mockReturnValue(true);

    const { result, rerender } = renderHook(
      ({ filter }) => usePosts(platform, filter),
      { initialProps: { filter: commentFilter } },
    );
    rerender({ filter: { ...commentFilter } });

    expect(result.current.posts).toBe(stored);
    expect(result.current.isLoading).toBe(true);
    expect(platform.post.get.mock.calls).toEqual([[commentFilter]]);
    expect(platform.post.find).toHaveBeenCalledWith(commentFilter);
    expect(platform.post.areLoading).toHaveBeenCalledWith(commentFilter);
    expect(post.list.query).not.toHaveBeenCalled();
  });

  it('waits for a filter before loading', () => {
    const platform = makePlatform();

    const { result } = renderHook(() => usePosts(platform, null));

    expect(result.current.posts).toBeUndefined();
    expect(platform.post.get).not.toHaveBeenCalled();
    expect(platform.post.find).not.toHaveBeenCalled();
  });

  it('posts and force reloads through the store', async () => {
    const platform = makePlatform();
    const { result } = renderHook(() => usePosts(platform, repliesFilter));
    const data = { content: 'Me too', parentType: 'post', parentId: 'p2' };

    await act(() => result.current.create(data));
    await act(() => result.current.reload());

    expect(platform.post.post).toHaveBeenCalledWith(data);
    expect(platform.post.get.mock.calls).toEqual([
      [repliesFilter],
      [repliesFilter, { force: true }],
    ]);
    expect(post.create.mutate).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists by parent and channel, newest first', async () => {
    post.list.query.mockResolvedValue([hello, {}]);

    await expect(
      fetchPosts(
        { parentType: 'channel', parentId: undefined, channel: null },
        50,
      ),
    ).resolves.toEqual([hello, {}]);
    await fetchPosts(
      { channel: 'c1', parentType: 'post', parentId: 'p1' },
      100,
    );

    expect(post.list.query.mock.calls).toEqual([
      [{ parentType: 'channel', channel: null, limit: 50, sortBy: '-created' }],
      [
        {
          channel: 'c1',
          parentType: 'post',
          parentId: 'p1',
          limit: 100,
          sortBy: '-created',
        },
      ],
    ]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('counts with createdAfter only when there is one', async () => {
    post.count.query.mockResolvedValue(2);

    await expect(countPosts('c1', '2026-10-01T00:00:00.000Z')).resolves.toBe(2);
    await countPosts('c1', null);

    expect(post.count.query.mock.calls).toEqual([
      [{ channel: 'c1', createdAfter: '2026-10-01T00:00:00.000Z' }],
      [{ channel: 'c1' }],
    ]);
  });

  it('creates and removes', async () => {
    post.create.mutate.mockResolvedValue(hello);
    post.remove.mutate.mockResolvedValue({ deleted: false });

    await expect(createPost({ content: 'Hello', channel: 'c1' })).resolves.toBe(
      hello,
    );
    await expect(deletePost('p1')).resolves.toBeUndefined();

    expect(post.create.mutate).toHaveBeenCalledWith({
      content: 'Hello',
      channel: 'c1',
    });
    expect(post.remove.mutate).toHaveBeenCalledWith({ id: 'p1' });
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });

  it('rejects a refused create with the API message for CreatePost to show', async () => {
    post.create.mutate.mockRejectedValue(badRequest('Duplicate entry.'));

    await expect(createPost({ content: 'Hello' })).rejects.toMatchObject({
      message: 'Duplicate entry.',
      response: { status: 400, data: { error: 'Duplicate entry.' } },
    });
  });

  it('holds the store query in local state as an Immutable list', async () => {
    const platform = makePlatform();
    post.list.query.mockResolvedValue([comment]);

    const { result } = renderHook(() => usePosts(platform, commentFilter));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.posts?.getIn([0, 'content'])).toBe('Agree');
    expect(post.list.query).toHaveBeenCalledWith({
      parentType: 'proposal',
      parentId: 'prop1',
      limit: 1000,
      sortBy: '-created',
    });
    expect(platform.post.get).not.toHaveBeenCalled();
    expect(platform.post.find).not.toHaveBeenCalled();
  });

  it('sends an $in filter as parentIds', async () => {
    post.list.query.mockResolvedValue([reply]);

    const platform = makePlatform();
    renderHook(() => usePosts(platform, repliesFilter));

    await waitFor(() =>
      expect(post.list.query).toHaveBeenCalledWith({
        parentType: 'post',
        parentIds: ['p2', 'p4'],
        limit: 1000,
        sortBy: '-created',
      }),
    );
  });

  it('puts a new post that matches the filter first, as the store did', async () => {
    post.list.query.mockResolvedValue([comment]);
    const created = { ...comment, _id: 'p9', content: 'New' };
    post.create.mutate.mockResolvedValue(created);

    const platform = makePlatform();

    const { result } = renderHook(() => usePosts(platform, commentFilter));
    await waitFor(() => expect(result.current.posts?.size).toBe(1));
    await act(() =>
      result.current.create({
        content: 'New',
        parentType: 'proposal',
        parentId: 'prop1',
      }),
    );

    expect(result.current.posts?.map((p: any) => p.get('_id')).toJS()).toEqual([
      'p9',
      'p2',
    ]);
    expect(post.list.query).toHaveBeenCalledTimes(1);
  });

  it('leaves an $in list to the reload, as the store did', async () => {
    post.list.query.mockResolvedValueOnce([reply]);
    post.list.query.mockResolvedValueOnce([reply, { ...reply, _id: 'p8' }]);
    post.create.mutate.mockResolvedValue({ ...reply, _id: 'p8' });

    const platform = makePlatform();

    const { result } = renderHook(() => usePosts(platform, repliesFilter));
    await waitFor(() => expect(result.current.posts?.size).toBe(1));
    await act(() =>
      result.current.create({
        content: 'x',
        parentType: 'post',
        parentId: 'p2',
      }),
    );
    expect(result.current.posts?.size).toBe(1);

    await act(() => result.current.reload());
    expect(result.current.posts?.size).toBe(2);
  });

  it('clears the list when the filter changes or goes away, as find(newFilter) did', async () => {
    let resolveSecond: (posts: unknown[]) => void = () => {};
    post.list.query.mockResolvedValueOnce([comment]);
    post.list.query.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSecond = resolve;
      }),
    );
    const platform = makePlatform();
    const otherProposal: PostFilter = {
      where: { parentType: 'proposal', parentId: 'prop2' },
      limit: 1000,
    };

    const { result, rerender } = renderHook(
      ({ filter }: { filter: PostFilter | null }) => usePosts(platform, filter),
      { initialProps: { filter: commentFilter as PostFilter | null } },
    );
    await waitFor(() => expect(result.current.posts?.size).toBe(1));

    rerender({ filter: otherProposal });
    expect(result.current.posts).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    await act(async () => resolveSecond([]));
    expect(result.current.posts?.size).toBe(0);

    rerender({ filter: null });
    expect(result.current.posts).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(post.list.query).toHaveBeenCalledTimes(2);
  });

  it('shows nothing when the read for a new filter fails', async () => {
    post.list.query.mockResolvedValueOnce([comment]);
    post.list.query.mockRejectedValueOnce(new Error('boom'));
    const platform = makePlatform();

    const { result, rerender } = renderHook(
      ({ filter }) => usePosts(platform, filter),
      { initialProps: { filter: commentFilter } },
    );
    await waitFor(() => expect(result.current.posts?.size).toBe(1));
    rerender({ filter: repliesFilter });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.posts).toBeUndefined();
  });

  it('keeps the list when a reload fails, and rejects a failed create', async () => {
    post.list.query.mockResolvedValueOnce([comment]);
    post.list.query.mockRejectedValueOnce(new Error('boom'));
    post.create.mutate.mockRejectedValue(badRequest('Invalid value'));

    const platform = makePlatform();

    const { result } = renderHook(() => usePosts(platform, commentFilter));
    await waitFor(() => expect(result.current.posts?.size).toBe(1));

    await act(() => result.current.reload());
    expect(result.current.posts?.size).toBe(1);
    await expect(result.current.create({ content: '' })).rejects.toMatchObject({
      message: 'Invalid value',
    });
  });
});
