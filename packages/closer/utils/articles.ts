import type { Article, ArticleWithAuthorInfo } from '../types/blog';
import api, { formatSearch } from './api';
import {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  trpc,
} from './trpc';

type CreateInput = Parameters<typeof trpc.article.create.mutate>[0];
type UpdateInput = Parameters<typeof trpc.article.update.mutate>[0]['data'];
type RelatedInput = Parameters<typeof trpc.article.related.query>[0];

type QueryValue = string | string[] | undefined;

// Legacy `GET /article?limit=N` in the API's default order; `{}` stands for an article the caller cannot read.
export const fetchArticles = async (limit: number): Promise<Article[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/article?limit=${limit}`);
    return res.data.results;
  }
  const results = await trpc.article.list.query({ limit }).catch(throwApiError);
  return results as Article[];
};

// Legacy parsed `page` with parseFloat and fell back to the first page on NaN.
const toPage = (page: QueryValue) => {
  const value = parseFloat(String(page));
  return Number.isInteger(value) && value > 1 ? { page: value } : {};
};

// The blog index's legacy `GET /article`, `page` interpolated raw (`page=undefined` included).
export const fetchBlogArticles = async ({
  limit,
  sortBy,
  excludeCategory,
  page,
}: {
  limit: number;
  sortBy: string;
  excludeCategory: string;
  page: QueryValue;
}): Promise<Article[]> => {
  if (!isTrpcEnabled()) {
    const where = formatSearch({ category: { $ne: excludeCategory } });
    const res = await api.get(
      `/article?limit=${limit}&sort_by=${sortBy}&where=${where}&page=${page}`,
    );
    return res.data.results;
  }
  const results = await trpc.article.list
    .query({ limit, sortBy, excludeCategory, ...toPage(page) })
    .catch(throwApiError);
  return results as Article[];
};

// Legacy `GET /count/article`, unfiltered.
export const fetchArticleCount = async (): Promise<number> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/count/article');
    return res.data.results;
  }
  return trpc.article.count.query().catch(throwApiError);
};

// What legacy routed as `:search`: the path segment before any query string, percent-decoded.
const toLegacyParam = (value: string) => {
  const segment = value.split('?')[0];
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

// Legacy `GET /article/:search`; a missing or unreadable article rejects with legacy's 404.
export const fetchArticle = async (idOrSlug: string): Promise<Article> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/article/${idOrSlug}`);
    return res.data.results;
  }
  const result = await trpc.article.get
    .query({ idOrSlug: toLegacyParam(idOrSlug) })
    .catch(throwApiErrorWithLegacy404);
  return result as Article;
};

export const fetchRelatedArticles = async (input: {
  id: string;
  category?: string | null;
  tags?: (string | null)[];
}): Promise<ArticleWithAuthorInfo[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/articles/related', input);
    return res.data.results;
  }
  const results = await trpc.article.related
    .query(input as RelatedInput)
    .catch(throwApiError);
  return results as ArticleWithAuthorInfo[];
};

// Legacy `GET /article` and `GET /distinct/article/tags` over `{tags: {$elemMatch: {$eq: keyword}}}`.
const keywordWhere = (keyword: string) =>
  formatSearch({ tags: { $elemMatch: { $eq: keyword } } });

export const searchArticles = async (keyword: string): Promise<Article[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(
      `/article?where=${keywordWhere(keyword)}&limit=50`,
    );
    return res.data.results;
  }
  const results = await trpc.article.search
    .query({ keyword })
    .catch(throwApiError);
  return results as Article[];
};

export const fetchArticleTags = async (keyword: string): Promise<string[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(
      `/distinct/article/tags?where=${keywordWhere(keyword)}`,
    );
    return res.data.results;
  }
  return trpc.article.tags.query({ keyword }).catch(throwApiError);
};

// POST without an `_id`, PATCH with one; tRPC ignores the client slug on create, as legacy did.
export const saveArticle = async <T extends { _id?: string }>(
  data: T,
): Promise<T> => {
  if (!isTrpcEnabled()) {
    const res = data._id
      ? await api.patch(`/article/${data._id}`, data)
      : await api.post('/article', data);
    return res.data.results;
  }
  const saved = await (
    data._id
      ? trpc.article.update.mutate({
          id: data._id,
          data: data as unknown as UpdateInput,
        })
      : trpc.article.create.mutate(data as unknown as CreateInput)
  ).catch(throwApiError);
  return saved as unknown as T;
};

export const deleteArticle = async (id: string): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.delete(`/article/${id}`);
    return;
  }
  await trpc.article.remove.mutate({ id }).catch(throwApiError);
};
