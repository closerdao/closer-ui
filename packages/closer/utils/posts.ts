import { useEffect, useState } from 'react';

import { List, fromJS } from 'immutable';

import api, { formatSearch } from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type Platform = Record<string, any>;

type ListInput = Parameters<typeof trpc.post.list.query>[0];
type CreateInput = Parameters<typeof trpc.post.create.mutate>[0];
type ParentType = ListInput['parentType'];

type Post = Record<string, any>;

// The `where` Post.tsx and PostList send; key order is the legacy query string's.
export type PostWhere = {
  parentType: string;
  parentId?: string;
  channel?: string | null;
};

// Legacy `GET /post` newest first; `{}` stands for a post the caller cannot read.
export const fetchPosts = async <T = Post>(
  where: PostWhere,
  limit: number,
): Promise<T[]> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get('/post', {
      params: { where: formatSearch(where), sort_by: '-created', limit },
    });
    return data.results;
  }
  const results = await trpc.post.list
    .query({
      ...where,
      parentType: where.parentType as ParentType,
      limit,
      sortBy: '-created',
    })
    .catch(throwApiError);
  return results as T[];
};

// Legacy `GET /count/post` over `{channel, created: {$gt: createdAfter}}`.
export const countPosts = async (
  channel: string,
  createdAfter?: string | null,
): Promise<number> => {
  if (!isTrpcEnabled()) {
    const where: Record<string, unknown> = { channel };
    if (createdAfter) where.created = { $gt: createdAfter };
    const { data } = await api.get('/count/post', {
      params: { where: formatSearch(where) },
    });
    return data.results;
  }
  return trpc.post.count
    .query(createdAfter ? { channel, createdAfter } : { channel })
    .catch(throwApiError);
};

export const createPost = async (
  data: Record<string, unknown>,
): Promise<Post> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/post', data);
    return res.data.results;
  }
  return trpc.post.create.mutate(data as CreateInput).catch(throwApiError);
};

// Legacy resolved whether or not the caller owned the post; tRPC's `{deleted: false}` is ignored alike.
export const deletePost = async (id: string): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.delete(`/post/${id}`);
    return;
  }
  await trpc.post.remove.mutate({ id }).catch(throwApiError);
};

// The store filters ProposalComments sends: one parent's posts, or every post under a set of parents.
export type PostFilter = {
  where: { parentType: string; parentId: string | { $in: string[] } };
  limit: number;
};

// The store's `get` sends `sort_by: '-created'` unless the filter overrides it.
const toListInput = ({ where, limit }: PostFilter): ListInput => ({
  parentType: where.parentType as ParentType,
  ...(typeof where.parentId === 'string'
    ? { parentId: where.parentId }
    : { parentIds: where.parentId.$in }),
  limit,
  sortBy: '-created',
});

// The store's POST_SUCCESS match: every `where` value strictly equal, so an `$in` filter never takes a new post.
const matchesWhere = (where: PostFilter['where'], post: Post) =>
  Object.entries(where).every(([key, value]) => post[key] === value);

// The store's list, loading flag, force reload and post for `filter` or, with tRPC, the same in local state.
export const usePosts = (platform: Platform, filter: PostFilter | null) => {
  const [trpcPosts, setTrpcPosts] = useState<List<any>>();
  const [trpcLoading, setTrpcLoading] = useState(false);
  const filterKey = JSON.stringify(filter);

  const query = async (current: PostFilter) =>
    fromJS(await trpc.post.list.query(toListInput(current))) as List<any>;

  useEffect(() => {
    if (!filter) return;
    if (!isTrpcEnabled()) {
      if (platform?.post) void platform.post.get(filter);
      return;
    }
    let cancelled = false;
    setTrpcLoading(true);
    // The store's get resolves on failure and keeps what it had, so a failed read does too.
    query(filter)
      .then((posts) => {
        if (!cancelled) setTrpcPosts(posts);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTrpcLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey stands for filter
  }, [platform?.post, filterKey]);

  const reload = async () => {
    if (!filter) return;
    if (!isTrpcEnabled()) {
      await platform.post.get(filter, { force: true });
      return;
    }
    await query(filter).then(setTrpcPosts, () => {});
  };

  // Legacy resolves even when the post fails; tRPC rejects with the API error.
  const create = async (data: Record<string, unknown>) => {
    if (!isTrpcEnabled()) {
      await platform.post.post(data);
      return;
    }
    const post = await trpc.post.create
      .mutate(data as CreateInput)
      .catch(throwApiError);
    if (filter && matchesWhere(filter.where, post)) {
      setTrpcPosts((posts) => posts?.unshift(fromJS(post)));
    }
  };

  if (isTrpcEnabled()) {
    return { posts: trpcPosts, isLoading: trpcLoading, reload, create };
  }
  return {
    posts: filter ? platform.post.find(filter) : undefined,
    isLoading: filter ? platform.post.areLoading(filter) : undefined,
    reload,
    create,
  };
};
