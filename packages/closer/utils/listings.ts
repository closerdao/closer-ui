import { useEffect, useState } from 'react';

import { List, fromJS } from 'immutable';

import type { Listing } from '../types';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type Platform = Record<string, any>;

// The platform store filters the listings pages send; tRPC filters on `availableFor` only.
export type ListingFilter = {
  where: { availableFor?: { $in: string[] } };
  limit: number;
  sort_by?: string;
};

type ListingRequestOptions = {
  cache?: false;
  headers?: Record<string, string>;
};

// Legacy `GET /listing` in the API's default order; `{}` stands for a listing the caller cannot read.
export const fetchListings = async (params?: {
  limit: number;
}): Promise<Listing[]> => {
  if (!isTrpcEnabled()) {
    const res = params
      ? await api.get('/listing', { params })
      : await api.get('/listing');
    return res.data.results;
  }
  const results = await trpc.listing.list.query(params).catch(throwApiError);
  return results as Listing[];
};

// Legacy `GET /listing/:idOrSlug`: `{}` if unreadable, a 404 rejection if missing; tRPC drops an SSR caller's bearer.
export const fetchListing = async (
  idOrSlug: string,
  options?: ListingRequestOptions,
): Promise<Listing> => {
  if (!isTrpcEnabled()) {
    const path = `/listing/${idOrSlug}`;
    const res = options
      ? await api.get(path, options as any)
      : await api.get(path);
    return res.data.results;
  }
  const result = await trpc.listing.get
    .query({ idOrSlug })
    .catch(throwApiError);
  return result as Listing;
};

const toListInput = ({ where, limit, sort_by }: ListingFilter) => ({
  limit,
  sortBy: sort_by ?? '-created',
  ...(where.availableFor ? { availableFor: where.availableFor.$in } : {}),
});

// The store's list for `filter` or, with tRPC, the same read in local state; Immutable either way.
export const useListings = (
  platform: Platform | undefined,
  filter: ListingFilter,
): List<any> | undefined => {
  const [trpcListings, setTrpcListings] = useState<List<any>>();
  const filterKey = JSON.stringify(filter);

  useEffect(() => {
    if (!isTrpcEnabled()) {
      if (platform?.listing) void platform.listing.get(filter);
      return;
    }
    let cancelled = false;
    // A failed store read leaves the list as it was, so this does too.
    trpc.listing.list
      .query(toListInput(filter))
      .then((results) => {
        if (!cancelled) setTrpcListings(fromJS(results) as List<any>);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey stands for filter
  }, [platform, filterKey]);

  return isTrpcEnabled() ? trpcListings : platform?.listing?.find?.(filter);
};

// EditModel load/save/remove over tRPC; `{}` leaves EditModel on its axios calls.
export const listingEditModelBackend = () =>
  isTrpcEnabled()
    ? {
        load: (id: string) =>
          trpc.listing.get.query({ idOrSlug: id }).catch(throwApiError),
        save: (payload: any, id?: string) =>
          (id
            ? trpc.listing.update.mutate({ idOrSlug: id, data: payload })
            : trpc.listing.create.mutate(payload)
          ).catch(throwApiError),
        remove: async (id: string) => {
          await trpc.listing.remove.mutate({ id }).catch(throwApiError);
        },
      }
    : {};
