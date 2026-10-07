import { renderHook, waitFor } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';
import { fromJS } from 'immutable';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
  LessonFilter,
  fetchLesson,
  fetchLessons,
  fetchRecentLessons,
  lessonEditModelBackend,
  useLessons,
} from '../lessons';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockServerGet = jest.fn();

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpcFor: jest.fn(() => ({ lesson: { get: { query: mockServerGet } } })),
  trpc: {
    lesson: {
      list: { query: jest.fn() },
      count: { query: jest.fn() },
      get: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedTrpcFor = trpcFor as jest.Mock;
const lesson = trpc.lesson as unknown as {
  list: { query: jest.Mock };
  count: { query: jest.Mock };
  get: { query: jest.Mock };
  create: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
};

const soil = { _id: 'l1', slug: 'soil', title: 'Soil', category: 'farming' };
const draft = { _id: 'l2', slug: 'bees', title: 'Bees', isDraft: true };

const allFilter: LessonFilter = {
  where: {},
  limit: 10,
  sort_by: '-created',
  page: 1,
};
const farmingFilter: LessonFilter = {
  where: { category: 'farming' },
  limit: 10,
  sort_by: '-created',
  page: 2,
};

const makePlatform = () => ({
  lesson: {
    find: jest.fn(),
    findCount: jest.fn(),
    get: jest.fn().mockResolvedValue(undefined),
    getCount: jest.fn().mockResolvedValue(undefined),
  },
});

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('makes the sitemap GET /lesson?limit=N it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [soil, {}] } });

    await expect(fetchLessons(500)).resolves.toEqual([soil, {}]);

    expect(mockedApi.get.mock.calls).toEqual([['/lesson?limit=500']]);
    expect(lesson.list.query).not.toHaveBeenCalled();
  });

  it('makes the GET /lesson/:search calls it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: soil } });

    await expect(fetchLesson('soil')).resolves.toBe(soil);
    await fetchLesson('soil', { token: 'ssr-jwt' });
    await fetchLesson('soil', { token: undefined });

    // The SSR pair is `{ headers: getBearerAuthHeaders(req) }`, with and without the cookie.
    expect(mockedApi.get.mock.calls).toEqual([
      ['/lesson/soil'],
      ['/lesson/soil', { headers: { Authorization: 'Bearer ssr-jwt' } }],
      ['/lesson/soil', { headers: undefined }],
    ]);
    expect(lesson.get.query).not.toHaveBeenCalled();
    expect(mockedTrpcFor).not.toHaveBeenCalled();
  });

  it('rejects when the request fails, so callers keep their fallbacks', async () => {
    mockedApi.get.mockRejectedValue(new Error('Request failed with 404'));

    await expect(fetchLesson('gone')).rejects.toThrow(
      'Request failed with 404',
    );
  });

  it("reads the admin dashboard's courses through the store's get()", async () => {
    const platform = makePlatform();
    platform.lesson.get.mockResolvedValue({ results: fromJS([soil]) });

    await expect(fetchRecentLessons(platform)).resolves.toEqual([soil]);
    expect(platform.lesson.get.mock.calls).toEqual([[]]);

    platform.lesson.get.mockResolvedValue(undefined);
    await expect(fetchRecentLessons(platform)).resolves.toBeUndefined();
    expect(lesson.list.query).not.toHaveBeenCalled();
  });

  it('loads the three store reads and reads them from the store', async () => {
    const platform = makePlatform();
    const all = fromJS([soil, draft]);
    const page = fromJS([soil]);
    platform.lesson.find.mockImplementation((filter) => (filter ? page : all));
    platform.lesson.findCount.mockReturnValue(11);

    const { result, rerender } = renderHook(
      ({ filter }) => useLessons(platform, filter),
      { initialProps: { filter: allFilter } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(platform.lesson.get.mock.calls).toEqual([[], [allFilter]]);
    expect(platform.lesson.getCount.mock.calls).toEqual([[allFilter]]);
    expect(result.current).toEqual({
      lessons: page,
      allLessons: all,
      totalLessons: 11,
      isLoading: false,
    });
    expect(platform.lesson.find).toHaveBeenCalledWith(allFilter);
    expect(platform.lesson.findCount).toHaveBeenCalledWith(allFilter);

    rerender({ filter: { ...allFilter } });
    rerender({ filter: farmingFilter });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(platform.lesson.get.mock.calls).toEqual([
      [],
      [allFilter],
      [],
      [farmingFilter],
    ]);
    expect(platform.lesson.getCount).toHaveBeenLastCalledWith(farmingFilter);
    expect(lesson.list.query).not.toHaveBeenCalled();
    expect(lesson.count.query).not.toHaveBeenCalled();
  });

  it('leaves EditModel on axios', () => {
    expect(lessonEditModelBackend()).toEqual({});
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists the sitemap in the default order with only its limit', async () => {
    lesson.list.query.mockResolvedValue([soil, {}]);

    await expect(fetchLessons(500)).resolves.toEqual([soil, {}]);

    expect(lesson.list.query).toHaveBeenCalledWith({ limit: 500 });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("lists the admin dashboard's courses newest first", async () => {
    const platform = makePlatform();
    lesson.list.query.mockResolvedValue([soil]);

    await expect(fetchRecentLessons(platform)).resolves.toEqual([soil]);

    expect(lesson.list.query).toHaveBeenCalledWith({ sortBy: '-created' });
    expect(platform.lesson.get).not.toHaveBeenCalled();
  });

  it('reads one by id or slug on the browser client', async () => {
    lesson.get.query.mockResolvedValue(soil);

    await expect(fetchLesson('soil')).resolves.toBe(soil);
    await fetchLesson('l1', { token: undefined });

    expect(lesson.get.query.mock.calls).toEqual([
      [{ idOrSlug: 'soil' }],
      [{ idOrSlug: 'l1' }],
    ]);
    expect(mockedTrpcFor).not.toHaveBeenCalled();
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads with a server render token on a client of its own', async () => {
    mockServerGet.mockResolvedValue(soil);

    await expect(fetchLesson('soil', { token: 'ssr-jwt' })).resolves.toBe(soil);

    expect(mockedTrpcFor).toHaveBeenCalledWith('ssr-jwt');
    expect(mockServerGet).toHaveBeenCalledWith({ idOrSlug: 'soil' });
    expect(lesson.get.query).not.toHaveBeenCalled();
  });

  it("rejects a missing lesson with legacy's textless 404", async () => {
    lesson.get.query.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'Lesson not found'),
    );
    mockServerGet.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'Lesson not found'),
    );

    const error = await fetchLesson('gone').catch((e) => e);
    const serverError = await fetchLesson('gone', { token: 'ssr-jwt' }).catch(
      (e) => e,
    );

    for (const e of [error, serverError]) {
      expect(e.response).toEqual({ status: 404, data: { results: null } });
      expect(parseMessageFromError(e)).toBe('Something went wrong');
    }
  });

  it('passes other read errors through as the API text', async () => {
    lesson.get.query.mockRejectedValue(
      trpcError('INTERNAL_SERVER_ERROR', 500, 'Internal server error'),
    );

    await expect(fetchLesson('soil')).rejects.toMatchObject({
      message: 'Internal server error',
      response: { status: 500 },
    });
  });

  it('holds the three reads in local state as Immutable', async () => {
    const platform = makePlatform();
    lesson.list.query.mockImplementation(async (input) =>
      input.limit ? [soil, {}] : [soil, draft],
    );
    lesson.count.query.mockResolvedValue(11);

    const { result } = renderHook(() => useLessons(platform, allFilter));
    await waitFor(() => expect(result.current.totalLessons).toBe(11));

    expect(result.current.lessons?.toJS()).toEqual([soil, {}]);
    expect(result.current.allLessons?.getIn([1, 'isDraft'])).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(lesson.list.query.mock.calls).toEqual([
      [{ sortBy: '-created' }],
      [{ limit: 10, page: 1, sortBy: '-created' }],
    ]);
    expect(lesson.count.query.mock.calls).toEqual([[{}]]);
    expect(platform.lesson.get).not.toHaveBeenCalled();
    expect(platform.lesson.find).not.toHaveBeenCalled();
  });

  it('sends the category and page of a filtered read', async () => {
    const platform = makePlatform();
    lesson.list.query.mockResolvedValue([]);
    lesson.count.query.mockResolvedValue(0);

    const { result } = renderHook(() => useLessons(platform, farmingFilter));
    await waitFor(() => expect(result.current.totalLessons).toBe(0));

    expect(lesson.list.query).toHaveBeenLastCalledWith({
      category: 'farming',
      limit: 10,
      page: 2,
      sortBy: '-created',
    });
    expect(lesson.count.query).toHaveBeenCalledWith({ category: 'farming' });
  });

  it('swallows a failed read as the store did, keeping the previous lessons', async () => {
    const platform = makePlatform();
    lesson.list.query.mockResolvedValue([soil]);
    lesson.count.query.mockResolvedValueOnce(1);
    lesson.count.query.mockRejectedValueOnce(
      trpcError('INTERNAL_SERVER_ERROR', 500, 'Internal server error'),
    );

    const { result, rerender } = renderHook(
      ({ filter }) => useLessons(platform, filter),
      { initialProps: { filter: allFilter } },
    );
    await waitFor(() => expect(result.current.totalLessons).toBe(1));
    rerender({ filter: farmingFilter });
    await waitFor(() => expect(lesson.count.query).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).not.toHaveProperty('error');
    expect(result.current.lessons?.toJS()).toEqual([soil]);
    expect(result.current.totalLessons).toBe(1);
  });

  describe('lessonEditModelBackend', () => {
    it('loads by id or slug', async () => {
      lesson.get.query.mockResolvedValue(soil);

      await expect(lessonEditModelBackend().load!('l1')).resolves.toBe(soil);
      expect(lesson.get.query).toHaveBeenCalledWith({ idOrSlug: 'l1' });
    });

    it('creates without an id and updates with one', async () => {
      lesson.create.mutate.mockResolvedValue(soil);
      lesson.update.mutate.mockResolvedValue(soil);
      const { save } = lessonEditModelBackend();

      await save!({ title: 'Soil' });
      await save!({ title: 'Soil' }, 'l1');

      expect(lesson.create.mutate).toHaveBeenCalledWith({ title: 'Soil' });
      expect(lesson.update.mutate).toHaveBeenCalledWith({
        id: 'l1',
        data: { title: 'Soil' },
      });
    });

    it('removes by id', async () => {
      lesson.remove.mutate.mockResolvedValue({ deleted: true });

      await expect(lessonEditModelBackend().remove!('l1')).resolves.toBe(
        undefined,
      );
      expect(lesson.remove.mutate).toHaveBeenCalledWith({ id: 'l1' });
    });

    it('rejects with the text EditModel shows', async () => {
      lesson.update.mutate.mockRejectedValue(
        trpcError('BAD_REQUEST', 400, 'Validation failed for field: summary'),
      );

      const error = await lessonEditModelBackend().save!({}, 'l1').catch(
        (e: unknown) => e,
      );

      expect(parseMessageFromError(error)).toBe(
        'Validation failed for field: summary',
      );
    });
  });
});
