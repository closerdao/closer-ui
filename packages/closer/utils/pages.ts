import { useCallback, useState } from 'react';

import api from './api';
import type { PageListItem } from './standardPages';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type PageRecord = Record<string, unknown>;
export type SavedPage = PageRecord & { _id?: string };
type CreateInput = Parameters<typeof trpc.page.create.mutate>[0];
type UpdateInput = Parameters<typeof trpc.page.update.mutate>[0]['data'];

type Platform = Record<string, any>;

const EDITOR_PAGES_FILTER = { limit: 200 };

const toPlain = <T>(value: T): T =>
  value != null && typeof (value as { toJS?: () => T }).toJS === 'function'
    ? (value as unknown as { toJS: () => T }).toJS()
    : value;

// Legacy `GET /page?where={slug}&limit=1`: the first match, null when there is none.
export const fetchPageRecordBySlug = async (
  slug: string,
  options?: { cache: false },
): Promise<PageRecord | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/page', {
      params: { where: { slug }, limit: 1 },
      ...options,
    } as any);
    const list = res?.data?.results;
    return Array.isArray(list) && list[0] ? list[0] : null;
  }
  return trpc.page.bySlug.query({ slug }).catch(throwApiError);
};

export const fetchPageRecordById = async (
  id: string,
): Promise<PageRecord | undefined> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/page/${id}`, { cache: false } as any);
    return res?.data?.results;
  }
  return trpc.page.get.query({ id }).catch(throwApiError);
};

// Legacy `GET /page?limit=N` in the API's default order; `{}` stands for a page the caller cannot read.
export const fetchPages = async (
  limit: number,
  options?: { cache: false },
): Promise<PageRecord[] | undefined> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/page', {
      params: { limit },
      ...options,
    } as any);
    return res?.data?.results;
  }
  return trpc.page.list.query({ limit }).catch(throwApiError);
};

// The store's post/patch resolve undefined on failure; the tRPC path rejects with the API's error text.
export const createPageRecord = async (
  platform: Platform,
  data: PageRecord,
): Promise<SavedPage | undefined> => {
  if (!isTrpcEnabled()) {
    const action = await platform.page.post(data);
    return toPlain(action?.results) as SavedPage | undefined;
  }
  return trpc.page.create.mutate(data as CreateInput).catch(throwApiError);
};

export const updatePageRecord = async (
  platform: Platform,
  id: string,
  data: PageRecord,
): Promise<SavedPage | undefined> => {
  if (!isTrpcEnabled()) {
    const action = await platform.page.patch(id, data);
    return toPlain(action?.results) as SavedPage | undefined;
  }
  return trpc.page.update
    .mutate({ id, data: data as UpdateInput })
    .catch(throwApiError);
};

export const deletePageRecord = async (id: string): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.delete(`/page/${id}`);
    return;
  }
  await trpc.page.remove.mutate({ id }).catch(throwApiError);
};

// Survives client navigation, as the platform store does, so reopening the editor paints the last list first.
let lastEditorPages: PageListItem[] | null = null;

// The editor sidebar's page list, newest first, from the platform store or, with tRPC, local state.
export const useEditorPages = (platform: Platform) => {
  const [trpcPages, setTrpcPages] = useState(lastEditorPages);

  const storePages = (): PageListItem[] | null => {
    const plain = toPlain(platform?.page?.find?.(EDITOR_PAGES_FILTER));
    return Array.isArray(plain) ? plain : null;
  };

  const refresh = useCallback(
    async (opts?: { force: boolean }) => {
      if (!isTrpcEnabled()) {
        await platform.page.get(EDITOR_PAGES_FILTER, opts);
        return;
      }
      // platform.get keeps the previous list when the request fails.
      const results = await trpc.page.list
        .query({ limit: 200, sortBy: '-created' })
        .catch(() => null);
      if (results) {
        lastEditorPages = results as PageListItem[];
        setTrpcPages(lastEditorPages);
      }
    },
    [platform],
  );

  const update = useCallback(
    async (id: string, data: PageRecord) => {
      const updated = await updatePageRecord(platform, id, data);
      // The store swaps a patched page into its cached lists before the refetch lands.
      if (isTrpcEnabled() && updated) {
        lastEditorPages =
          lastEditorPages?.map((item) =>
            item._id === id ? (updated as PageListItem) : item,
          ) ?? null;
        setTrpcPages(lastEditorPages);
      }
      return updated;
    },
    [platform],
  );

  return {
    pages: isTrpcEnabled() ? trpcPages : storePages(),
    refresh,
    update,
  };
};
