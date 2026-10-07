import { useEffect, useState } from 'react';

import { TRPCClientError } from '@trpc/client';
import { List, fromJS } from 'immutable';

import type { Lesson } from '../types/lesson';
import api from './api';
import { parseMessageFromError } from './common';
import { isTrpcEnabled, throwApiError, trpc, trpcFor } from './trpc';

type Platform = Record<string, any>;

type CreateInput = Parameters<typeof trpc.lesson.create.mutate>[0];
type UpdateInput = Parameters<typeof trpc.lesson.update.mutate>[0]['data'];

// The store filter the learn category page sends; tRPC filters on `category` only.
export type LessonFilter = {
  where: { category?: string | string[] };
  limit: number;
  sort_by: string;
  page: number;
};

const toCategoryInput = ({ category }: LessonFilter['where']) =>
  category === undefined ? {} : { category: String(category) };

const toListInput = (filter: LessonFilter) => ({
  ...toCategoryInput(filter.where),
  limit: filter.limit,
  page: filter.page,
  sortBy: filter.sort_by,
});

// Legacy `GET /lesson?limit=N` in the API's default order; `{}` stands for a lesson the caller cannot read.
export const fetchLessons = async (limit: number): Promise<Lesson[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/lesson?limit=${limit}`);
    return res.data.results;
  }
  const results = await trpc.lesson.list.query({ limit }).catch(throwApiError);
  return results as Lesson[];
};

// The store's unfiltered `get()`: newest first, the API's default page size.
export const fetchRecentLessons = async (
  platform: Platform,
): Promise<Lesson[] | undefined> => {
  if (!isTrpcEnabled()) {
    const res = await platform.lesson.get();
    return res?.results?.toJS();
  }
  const results = await trpc.lesson.list
    .query({ sortBy: '-created' })
    .catch(throwApiError);
  return results as Lesson[];
};

const isNotFound = (error: unknown) =>
  error instanceof TRPCClientError &&
  (error.data as { code?: string } | undefined)?.code === 'NOT_FOUND';

// Legacy's 404 body is `{ results: null }` with no error text, as axios rejected it.
const legacyNotFound = () =>
  Object.assign(new Error('Request failed with status code 404'), {
    response: { status: 404, data: { results: null } },
  });

// Legacy `GET /lesson/:search`; `token` is a server render's cookie token, which the browser's own client cannot see.
export const fetchLesson = async (
  idOrSlug: string,
  options?: { token: string | undefined },
): Promise<Lesson> => {
  if (!isTrpcEnabled()) {
    const path = `/lesson/${idOrSlug}`;
    const res = options
      ? await api.get(path, {
          headers: options.token
            ? { Authorization: `Bearer ${options.token}` }
            : undefined,
        })
      : await api.get(path);
    return res.data.results;
  }
  const result = await (
    options?.token ? trpcFor(options.token) : trpc
  ).lesson.get
    .query({ idOrSlug })
    .catch((error) => {
      if (isNotFound(error)) throw legacyNotFound();
      return throwApiError(error);
    });
  return result as unknown as Lesson;
};

type LessonsState = {
  lessons?: List<any>;
  allLessons?: List<any>;
  totalLessons?: number;
};

// The category page's three store reads or, with tRPC, the same reads in local state; Immutable either way.
export const useLessons = (platform: Platform, filter: LessonFilter) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [trpcState, setTrpcState] = useState<LessonsState>({});
  const filterKey = JSON.stringify(filter);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isTrpcEnabled()) {
        await Promise.all([
          platform.lesson.get(),
          platform.lesson.get(filter),
          platform.lesson.getCount(filter),
        ]);
        return;
      }
      const [allLessons, lessons, totalLessons] = await Promise.all([
        trpc.lesson.list.query({ sortBy: '-created' }),
        trpc.lesson.list.query(toListInput(filter)),
        trpc.lesson.count.query(toCategoryInput(filter.where)),
      ]).catch(throwApiError);
      if (cancelled) return;
      setTrpcState({
        allLessons: fromJS(allLessons) as List<any>,
        lessons: fromJS(lessons) as List<any>,
        totalLessons,
      });
    };
    setIsLoading(true);
    load()
      .catch((err) => setError(parseMessageFromError(err)))
      .finally(() => setIsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey stands for filter
  }, [filterKey]);

  const state: LessonsState = isTrpcEnabled()
    ? trpcState
    : {
        lessons: platform.lesson.find(filter),
        allLessons: platform.lesson.find(),
        totalLessons: platform.lesson.findCount(filter),
      };
  return { ...state, isLoading, error };
};

// EditModel load/save/remove over tRPC; `{}` leaves EditModel on its axios calls.
export const lessonEditModelBackend = () =>
  isTrpcEnabled()
    ? {
        load: (id: string) =>
          trpc.lesson.get.query({ idOrSlug: id }).catch(throwApiError),
        save: (payload: any, id?: string) =>
          (id
            ? trpc.lesson.update.mutate({
                id,
                data: payload as UpdateInput,
              })
            : trpc.lesson.create.mutate(payload as CreateInput)
          ).catch(throwApiError),
        remove: async (id: string) => {
          await trpc.lesson.remove.mutate({ id }).catch(throwApiError);
        },
      }
    : {};
