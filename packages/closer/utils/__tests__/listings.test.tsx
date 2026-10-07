import { renderHook, waitFor } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';
import { fromJS } from 'immutable';

import api from '../api';
import {
  ListingFilter,
  fetchListing,
  fetchListings,
  listingEditModelBackend,
  useListings,
} from '../listings';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockServerGet = jest.fn();

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpcFor: jest.fn(() => ({ listing: { get: { query: mockServerGet } } })),
  trpc: {
    listing: {
      list: { query: jest.fn() },
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
const listing = trpc.listing as unknown as {
  list: { query: jest.Mock };
  get: { query: jest.Mock };
  create: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
};

const dorm = { _id: 'l1', slug: 'dorm', name: 'Dorm' };
const cabin = { _id: 'l2', slug: 'cabin', name: 'Cabin' };

const adminFilter: ListingFilter = { where: {}, limit: 100 };
const previewFilter: ListingFilter = {
  where: { availableFor: { $in: ['guests', 'team'] } },
  limit: 6,
};
const liosFilter: ListingFilter = {
  where: { availableFor: { $in: ['guests'] } },
  sort_by: 'created',
  limit: 6,
};

const makePlatform = () => ({
  listing: {
    find: jest.fn(),
    get: jest.fn().mockResolvedValue(undefined),
  },
});

const notFound = () =>
  new TRPCClientError('Listing not found', {
    result: {
      error: {
        message: 'Listing not found',
        code: -32004,
        data: { code: 'NOT_FOUND', httpStatus: 404, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('makes the GET /listing calls it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [dorm, {}] } });

    await expect(fetchListings({ limit: 30 })).resolves.toEqual([dorm, {}]);
    await fetchListings();

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/listing', {
      params: { limit: 30 },
    });
    expect(mockedApi.get.mock.calls[1]).toEqual(['/listing']);
    expect(listing.list.query).not.toHaveBeenCalled();
  });

  it('makes the GET /listing/:idOrSlug calls it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: dorm } });

    await expect(fetchListing('dorm')).resolves.toEqual(dorm);
    await fetchListing('dorm', { cache: false });
    await fetchListing('l1', { token: 'ssr-jwt' });
    await fetchListing('l1', { token: undefined });

    // The SSR pair is `{ headers: getBearerAuthHeaders(req) }`, with and without the cookie.
    expect(mockedApi.get.mock.calls).toEqual([
      ['/listing/dorm'],
      ['/listing/dorm', { cache: false }],
      ['/listing/l1', { headers: { Authorization: 'Bearer ssr-jwt' } }],
      ['/listing/l1', { headers: undefined }],
    ]);
    expect(listing.get.query).not.toHaveBeenCalled();
    expect(mockedTrpcFor).not.toHaveBeenCalled();
  });

  it('rejects when the request fails, so callers keep their fallbacks', async () => {
    mockedApi.get.mockRejectedValue(new Error('Request failed with 404'));

    await expect(fetchListing('gone')).rejects.toThrow(
      'Request failed with 404',
    );
    await expect(fetchListings()).rejects.toThrow('Request failed with 404');
  });

  it('loads the list into the store and reads it from there', () => {
    const platform = makePlatform();
    const stored = fromJS([dorm]);
    platform.listing.find.mockReturnValue(stored);

    const { result, rerender } = renderHook(
      ({ filter }) => useListings(platform, filter),
      { initialProps: { filter: adminFilter } },
    );
    rerender({ filter: { ...adminFilter } });

    expect(result.current).toBe(stored);
    expect(platform.listing.get).toHaveBeenCalledTimes(1);
    expect(platform.listing.get).toHaveBeenCalledWith(adminFilter);
    expect(platform.listing.find).toHaveBeenCalledWith(adminFilter);

    rerender({ filter: liosFilter });

    expect(platform.listing.get).toHaveBeenLastCalledWith(liosFilter);
    expect(listing.list.query).not.toHaveBeenCalled();
  });

  it('waits for the platform before loading', () => {
    const { result } = renderHook(() => useListings(undefined, adminFilter));

    expect(result.current).toBeUndefined();
  });

  it('leaves EditModel on axios', () => {
    expect(listingEditModelBackend()).toEqual({});
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists with only the caller limit, in the default order', async () => {
    listing.list.query.mockResolvedValue([dorm, {}]);

    await expect(fetchListings({ limit: 30 })).resolves.toEqual([dorm, {}]);
    await fetchListings();

    expect(listing.list.query.mock.calls).toEqual([
      [{ limit: 30 }],
      [undefined],
    ]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads one by id or slug on the browser client', async () => {
    listing.get.query.mockResolvedValue({});

    await expect(fetchListing('dorm')).resolves.toEqual({});
    await fetchListing('dorm', { cache: false });
    await fetchListing('dorm', { token: undefined });

    expect(listing.get.query).toHaveBeenCalledTimes(3);
    expect(listing.get.query).toHaveBeenCalledWith({ idOrSlug: 'dorm' });
    expect(mockedTrpcFor).not.toHaveBeenCalled();
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads with a server render token on a client of its own', async () => {
    mockServerGet.mockResolvedValue(dorm);

    await expect(fetchListing('l1', { token: 'ssr-jwt' })).resolves.toBe(dorm);

    expect(mockedTrpcFor).toHaveBeenCalledWith('ssr-jwt');
    expect(mockServerGet).toHaveBeenCalledWith({ idOrSlug: 'l1' });
    expect(listing.get.query).not.toHaveBeenCalled();
  });

  it('rejects a server read the way it rejects a browser one', async () => {
    mockServerGet.mockRejectedValue(notFound());

    await expect(
      fetchListing('gone', { token: 'ssr-jwt' }),
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('rejects a missing listing with the 404 axios gave', async () => {
    listing.get.query.mockRejectedValue(notFound());

    await expect(fetchListing('gone')).rejects.toMatchObject({
      message: 'Listing not found',
      response: { status: 404, data: { error: 'Listing not found' } },
    });
  });

  it('holds the store query in local state as an Immutable list', async () => {
    const platform = makePlatform();
    listing.list.query.mockResolvedValue([dorm, cabin]);

    const { result } = renderHook(() => useListings(platform, adminFilter));

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current?.count()).toBe(2));
    expect(result.current?.getIn([1, 'name'])).toBe('Cabin');
    expect(listing.list.query).toHaveBeenCalledWith({
      limit: 100,
      sortBy: '-created',
    });
    expect(platform.listing.get).not.toHaveBeenCalled();
    expect(platform.listing.find).not.toHaveBeenCalled();
  });

  it('sends availableFor and a caller sort_by', async () => {
    listing.list.query.mockResolvedValue([]);

    const platform = makePlatform();

    renderHook(() => useListings(platform, previewFilter));
    renderHook(() => useListings(platform, liosFilter));

    await waitFor(() => expect(listing.list.query).toHaveBeenCalledTimes(2));
    expect(listing.list.query.mock.calls).toEqual([
      [{ limit: 6, sortBy: '-created', availableFor: ['guests', 'team'] }],
      [{ limit: 6, sortBy: 'created', availableFor: ['guests'] }],
    ]);
  });

  it('keeps the previous list when a reload fails', async () => {
    listing.list.query.mockResolvedValueOnce([dorm]);
    listing.list.query.mockRejectedValueOnce(new Error('boom'));
    const platform = makePlatform();

    const { result, rerender } = renderHook(
      ({ filter }) => useListings(platform, filter),
      { initialProps: { filter: adminFilter } },
    );
    await waitFor(() => expect(result.current?.count()).toBe(1));
    rerender({ filter: previewFilter });
    await waitFor(() => expect(listing.list.query).toHaveBeenCalledTimes(2));

    expect(result.current?.getIn([0, '_id'])).toBe('l1');
  });

  describe('listingEditModelBackend', () => {
    it('loads by id or slug', async () => {
      listing.get.query.mockResolvedValue(dorm);

      await expect(listingEditModelBackend().load!('l1')).resolves.toBe(dorm);
      expect(listing.get.query).toHaveBeenCalledWith({ idOrSlug: 'l1' });
    });

    it('creates without an id and updates with one', async () => {
      listing.create.mutate.mockResolvedValue(dorm);
      listing.update.mutate.mockResolvedValue(dorm);
      const { save } = listingEditModelBackend();

      await save!({ name: 'Dorm' });
      await save!({ name: 'Dorm' }, 'l1');

      expect(listing.create.mutate).toHaveBeenCalledWith({ name: 'Dorm' });
      expect(listing.update.mutate).toHaveBeenCalledWith({
        idOrSlug: 'l1',
        data: { name: 'Dorm' },
      });
    });

    it('removes by id', async () => {
      listing.remove.mutate.mockResolvedValue({ deleted: true });

      await expect(listingEditModelBackend().remove!('l1')).resolves.toBe(
        undefined,
      );
      expect(listing.remove.mutate).toHaveBeenCalledWith({ id: 'l1' });
    });

    it('rejects with the error EditModel already knows how to show', async () => {
      listing.update.mutate.mockRejectedValue(notFound());

      await expect(
        listingEditModelBackend().save!({}, 'gone'),
      ).rejects.toMatchObject({ message: 'Listing not found' });
    });
  });
});
