import { useEffect, useState } from 'react';

import { List, fromJS } from 'immutable';

import type { Listing } from '../types';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc, trpcFor } from './trpc';

type Platform = Record<string, any>;

// The platform store filters the listings pages send; tRPC filters on `availableFor` only.
export type ListingFilter = {
  where: { availableFor?: { $in: string[] } };
  limit: number;
  sort_by?: string;
};

// `token` is a server render's cookie token, which the browser's own client cannot see.
type ListingReadOptions = { cache: false } | { token: string | undefined };

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

const legacyReadConfig = (options: ListingReadOptions) =>
  'token' in options
    ? {
        headers: options.token
          ? { Authorization: `Bearer ${options.token}` }
          : undefined,
      }
    : options;

// Legacy `GET /listing/:idOrSlug`: a 404 rejection if missing; a channel-only grant is `{}` on legacy, NOT_FOUND on tRPC.
export const fetchListing = async (
  idOrSlug: string,
  options?: ListingReadOptions,
): Promise<Listing> => {
  if (!isTrpcEnabled()) {
    const path = `/listing/${idOrSlug}`;
    const res = options
      ? await api.get(path, legacyReadConfig(options) as any)
      : await api.get(path);
    return res.data.results;
  }
  const token = options && 'token' in options ? options.token : undefined;
  const result = await (token ? trpcFor(token) : trpc).listing.get
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
    // A failed reload keeps the last list even under a new filter, where the store's find would show none.
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

// Puts the listings with `ids` in the store, where the bookings tables read them with `findOne`.
export const storeListingsByIds = async (
  platform: Platform,
  ids: string[],
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await platform.listing.get({ where: { _id: { $in: ids } } });
    return;
  }
  // listing.list has no id filter; the batch link sends these reads as one request.
  const listings = await Promise.all(
    ids.map((idOrSlug) =>
      trpc.listing.get.query({ idOrSlug }).catch(() => null),
    ),
  );
  listings.forEach((listing) => {
    if (listing && '_id' in listing) platform.listing.set(listing);
  });
};

// Puts one listing in the store, as the store's `getOne(id)` did; a failed read leaves it out.
export const storeListing = async (
  platform: Platform,
  id: string,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await platform.listing.getOne(id);
    return;
  }
  const listing = await trpc.listing.get
    .query({ idOrSlug: id })
    .catch(() => null);
  if (listing && '_id' in listing) platform.listing.set(listing);
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
