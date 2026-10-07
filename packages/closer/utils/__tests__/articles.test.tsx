import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  deleteArticle,
  fetchArticle,
  fetchArticleCount,
  fetchArticleTags,
  fetchArticles,
  fetchBlogArticles,
  fetchRelatedArticles,
  saveArticle,
  searchArticles,
} from '../articles';
import { parseMessageFromError } from '../common';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  formatSearch: jest.requireActual('../api').formatSearch,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    article: {
      list: { query: jest.fn() },
      count: { query: jest.fn() },
      get: { query: jest.fn() },
      related: { query: jest.fn() },
      search: { query: jest.fn() },
      tags: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<
  'get' | 'post' | 'patch' | 'delete',
  jest.Mock
>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const article = trpc.article as unknown as {
  list: { query: jest.Mock };
  count: { query: jest.Mock };
  get: { query: jest.Mock };
  related: { query: jest.Mock };
  search: { query: jest.Mock };
  tags: { query: jest.Mock };
  create: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
};

const post = { _id: 'a1', slug: 'hello', title: 'Hello', tags: ['soil'] };
const draft = {
  title: 'Hello',
  slug: 'hello',
  summary: '',
  html: '<p>Hi</p>',
  photo: null,
  category: 'news',
  tags: ['soil'],
  _id: undefined,
  createdBy: undefined,
};

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

const homeWhere = encodeURIComponent('{"category":{"$ne":"home page"}}');
const soilWhere = encodeURIComponent('{"tags":{"$elemMatch":{"$eq":"soil"}}}');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('makes the list and count requests it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [post, {}] } });

    await expect(fetchArticles(500)).resolves.toEqual([post, {}]);
    await fetchBlogArticles({
      limit: 10,
      sortBy: '-created',
      excludeCategory: 'home page',
      page: undefined,
    });
    await fetchBlogArticles({
      limit: 9,
      sortBy: '-created',
      excludeCategory: 'home page',
      page: '2',
    });
    mockedApi.get.mockResolvedValue({ data: { results: 12 } });
    await expect(fetchArticleCount()).resolves.toBe(12);

    expect(mockedApi.get.mock.calls).toEqual([
      ['/article?limit=500'],
      [`/article?limit=10&sort_by=-created&where=${homeWhere}&page=undefined`],
      [`/article?limit=9&sort_by=-created&where=${homeWhere}&page=2`],
      ['/count/article'],
    ]);
    expect(article.list.query).not.toHaveBeenCalled();
    expect(article.count.query).not.toHaveBeenCalled();
  });

  it('makes the read requests it replaced', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { results: post } });
    mockedApi.get.mockResolvedValueOnce({ data: { results: [post] } });
    mockedApi.get.mockResolvedValueOnce({ data: { results: ['soil'] } });
    mockedApi.post.mockResolvedValue({ data: { results: [post] } });

    await expect(fetchArticle('hello?utm_source=x')).resolves.toBe(post);
    await expect(searchArticles('soil')).resolves.toEqual([post]);
    await expect(fetchArticleTags('soil')).resolves.toEqual(['soil']);
    await expect(
      fetchRelatedArticles({ id: 'a1', category: undefined, tags: ['soil'] }),
    ).resolves.toEqual([post]);

    expect(mockedApi.get.mock.calls).toEqual([
      ['/article/hello?utm_source=x'],
      [`/article?where=${soilWhere}&limit=50`],
      [`/distinct/article/tags?where=${soilWhere}`],
    ]);
    expect(mockedApi.post.mock.calls).toEqual([
      ['/articles/related', { id: 'a1', category: undefined, tags: ['soil'] }],
    ]);
    expect(article.get.query).not.toHaveBeenCalled();
    expect(article.related.query).not.toHaveBeenCalled();
  });

  it('posts a new article, patches a saved one, deletes by id', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: post } });
    mockedApi.patch.mockResolvedValue({ data: { results: post } });
    mockedApi.delete.mockResolvedValue({ data: {} });
    const saved = { ...draft, _id: 'a1', createdBy: 'u1' };

    await expect(saveArticle(draft)).resolves.toBe(post);
    await expect(saveArticle(saved)).resolves.toBe(post);
    await expect(deleteArticle('a1')).resolves.toBeUndefined();

    expect(mockedApi.post.mock.calls).toEqual([['/article', draft]]);
    expect(mockedApi.patch.mock.calls).toEqual([['/article/a1', saved]]);
    expect(mockedApi.delete.mock.calls).toEqual([['/article/a1']]);
    expect(article.create.mutate).not.toHaveBeenCalled();
    expect(article.update.mutate).not.toHaveBeenCalled();
    expect(article.remove.mutate).not.toHaveBeenCalled();
  });

  it('rejects when the request fails, so callers keep their fallbacks', async () => {
    mockedApi.get.mockRejectedValue(new Error('Request failed with 404'));

    await expect(fetchArticle('gone')).rejects.toThrow(
      'Request failed with 404',
    );
    await expect(fetchArticleCount()).rejects.toThrow(
      'Request failed with 404',
    );
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists in the default order with only the sitemap limit', async () => {
    article.list.query.mockResolvedValue([post, {}]);

    await expect(fetchArticles(500)).resolves.toEqual([post, {}]);

    expect(article.list.query).toHaveBeenCalledWith({ limit: 500 });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('pages the blog index the way legacy parsed `page`', async () => {
    article.list.query.mockResolvedValue([]);
    const blog = {
      limit: 9,
      sortBy: '-created',
      excludeCategory: 'home page',
    };

    for (const page of [undefined, '1', '2', ['3'], 'abc']) {
      await fetchBlogArticles({ ...blog, page });
    }

    expect(article.list.query.mock.calls).toEqual([
      [blog],
      [blog],
      [{ ...blog, page: 2 }],
      [{ ...blog, page: 3 }],
      [blog],
    ]);
  });

  it('counts with no filter, as legacy did', async () => {
    article.count.query.mockResolvedValue(12);

    await expect(fetchArticleCount()).resolves.toBe(12);
    expect(article.count.query).toHaveBeenCalledWith();
  });

  it('reads the slug legacy routed, without the query string', async () => {
    article.get.query.mockResolvedValue(post);

    await expect(fetchArticle('hello?utm_source=x')).resolves.toBe(post);
    await fetchArticle('caf%C3%A9');
    await fetchArticle('a1');

    expect(article.get.query.mock.calls).toEqual([
      [{ idOrSlug: 'hello' }],
      [{ idOrSlug: 'café' }],
      [{ idOrSlug: 'a1' }],
    ]);
  });

  it("rejects a missing article with legacy's 404 text", async () => {
    article.get.query.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'Article not found'),
    );

    const error = await fetchArticle('gone').catch((e) => e);

    expect(error).toMatchObject({ response: { status: 404 } });
    expect(parseMessageFromError(error)).toBe('Page not found');
  });

  it('passes other read errors through as the API text', async () => {
    article.get.query.mockRejectedValue(
      trpcError('INTERNAL_SERVER_ERROR', 500, 'Internal server error'),
    );

    await expect(fetchArticle('hello')).rejects.toMatchObject({
      message: 'Internal server error',
      response: { status: 500 },
    });
  });

  it('searches and lists tags by keyword', async () => {
    article.search.query.mockResolvedValue([post, {}]);
    article.tags.query.mockResolvedValue(['soil']);

    await expect(searchArticles('soil')).resolves.toEqual([post, {}]);
    await expect(fetchArticleTags('soil')).resolves.toEqual(['soil']);

    expect(article.search.query).toHaveBeenCalledWith({ keyword: 'soil' });
    expect(article.tags.query).toHaveBeenCalledWith({ keyword: 'soil' });
  });

  it('returns related articles with their authorInfo', async () => {
    const related = {
      ...post,
      authorInfo: { screenname: 'Ana', photo: 'p1', _id: 'u1' },
    };
    article.related.query.mockResolvedValue([related]);

    await expect(
      fetchRelatedArticles({ id: 'a1', category: undefined, tags: ['soil'] }),
    ).resolves.toEqual([related]);
    expect(article.related.query).toHaveBeenCalledWith({
      id: 'a1',
      category: undefined,
      tags: ['soil'],
    });
  });

  it('creates without an id, updates with one, removes by id', async () => {
    article.create.mutate.mockResolvedValue(post);
    article.update.mutate.mockResolvedValue(post);
    article.remove.mutate.mockResolvedValue({ deleted: true });
    const saved = { ...draft, _id: 'a1', createdBy: 'u1' };

    await expect(saveArticle(draft)).resolves.toBe(post);
    await expect(saveArticle(saved)).resolves.toBe(post);
    await expect(deleteArticle('a1')).resolves.toBeUndefined();

    expect(article.create.mutate).toHaveBeenCalledWith(draft);
    expect(article.update.mutate).toHaveBeenCalledWith({
      id: 'a1',
      data: saved,
    });
    expect(article.remove.mutate).toHaveBeenCalledWith({ id: 'a1' });
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.patch).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });

  it('rejects a failed save with the text the editor shows', async () => {
    article.update.mutate.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'Validation failed for field: summary'),
    );

    const error = await saveArticle({ ...draft, _id: 'a1' }).catch((e) => e);

    expect(parseMessageFromError(error)).toBe(
      'Validation failed for field: summary',
    );
  });
});
