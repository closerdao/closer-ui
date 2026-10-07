import { renderHook, waitFor } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';
import { fromJS } from 'immutable';

import api from '../api';
import {
  EventFilter,
  eventEditModelBackend,
  fetchEvent,
  fetchEvents,
  fetchEventsByIds,
  fetchEventsByStartEndingAfter,
  fetchEventsEndingAfter,
  loadEvents,
  setEventAttendance,
  storeEvent,
  storeEventsByIds,
  updateEventPhoto,
  useEvents,
} from '../events';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
}));

const mockServerGet = jest.fn();

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpcFor: jest.fn(() => ({ event: { get: { query: mockServerGet } } })),
  trpc: {
    event: {
      list: { query: jest.fn() },
      attendedBy: { query: jest.fn() },
      get: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
      attend: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
};
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedTrpcFor = trpcFor as jest.Mock;
const event = trpc.event as unknown as {
  list: { query: jest.Mock };
  attendedBy: { query: jest.Mock };
  get: { query: jest.Mock };
  create: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
  attend: { mutate: jest.Mock };
};

const NOW = new Date('2026-10-07T12:00:00.000Z');
const ISO = '2026-10-07T12:00:00.000Z';

const fest = { _id: 'e1', slug: 'fest', name: 'Fest', attendees: ['u1'] };
const camp = { _id: 'e2', slug: 'camp', name: 'Camp' };

const upcomingFilter: EventFilter = {
  where: { end: { $gt: NOW } },
  limit: 100,
  sort_by: 'start',
};
const pastFilter: EventFilter = {
  where: { end: { $lt: NOW } },
  limit: 20,
  sort_by: '-start',
};
const profileFilter: EventFilter = {
  where: {
    $or: [{ attendees: 'u1' }, { _id: { $in: ['e2'] } }],
    visibility: 'public',
    end: { $lt: NOW },
  },
  limit: 20,
  page: 1,
  sort_by: '-start',
};

const makePlatform = () => ({
  event: {
    find: jest.fn(),
    get: jest.fn().mockResolvedValue(undefined),
    getOne: jest.fn().mockResolvedValue(undefined),
    set: jest.fn(),
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

  it('makes the plain GET /event calls it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [fest, {}] } });

    await expect(fetchEvents(500)).resolves.toEqual([fest, {}]);
    await fetchEventsByIds(['e1', 'e2'], 100);
    await fetchEventsEndingAfter(NOW, 100);
    await fetchEventsByStartEndingAfter(NOW, 100);

    expect(mockedApi.get.mock.calls).toEqual([
      ['/event?limit=500'],
      [
        '/event',
        {
          params: {
            where: encodeURIComponent('{"_id":{"$in":["e1","e2"]}}'),
            limit: 100,
          },
        },
      ],
      [`/event?where={"end":{"$gt":"${ISO}"}}&limit=100`],
      [
        '/event',
        {
          params: {
            where: encodeURIComponent(`{"end":{"$gt":"${ISO}"}}`),
            limit: 100,
            sort_by: 'start',
          },
        },
      ],
    ]);
    expect(event.list.query).not.toHaveBeenCalled();
  });

  it('makes the GET /event/:idOrSlug calls it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: fest } });

    await expect(fetchEvent('fest')).resolves.toBe(fest);
    await fetchEvent('fest', { token: 'ssr-jwt' });
    await fetchEvent('fest', { token: undefined });

    // The SSR pair is `{ headers: getBearerAuthHeaders(req) }`, with and without the cookie.
    expect(mockedApi.get.mock.calls).toEqual([
      ['/event/fest'],
      ['/event/fest', { headers: { Authorization: 'Bearer ssr-jwt' } }],
      ['/event/fest', { headers: undefined }],
    ]);
    expect(event.get.query).not.toHaveBeenCalled();
    expect(mockedTrpcFor).not.toHaveBeenCalled();
  });

  it('rejects when the read fails, so callers keep their fallbacks', async () => {
    mockedApi.get.mockRejectedValue(new Error('Request failed with 404'));

    await expect(fetchEvent('gone')).rejects.toThrow('Request failed with 404');
  });

  it('posts the RSVP and patches the photo as before', async () => {
    mockedApi.post.mockResolvedValue({ data: { results: fest } });
    mockedApi.patch.mockResolvedValue({ data: { results: fest } });

    await expect(setEventAttendance('e1', true)).resolves.toBe(fest);
    await setEventAttendance('e1', false);
    await updateEventPhoto('e1', 'p1');

    expect(mockedApi.post.mock.calls).toEqual([
      ['/attend/event/e1', { attend: true }],
      ['/attend/event/e1', { attend: false }],
    ]);
    expect(mockedApi.patch.mock.calls).toEqual([
      ['/event/e1', { photo: 'p1' }],
    ]);
    expect(event.attend.mutate).not.toHaveBeenCalled();
    expect(event.update.mutate).not.toHaveBeenCalled();
  });

  it("reads calendars through the store's get() with the caller's filter", async () => {
    const platform = makePlatform();
    platform.event.get.mockResolvedValueOnce({ results: fromJS([fest]) });

    await expect(loadEvents(platform, upcomingFilter)).resolves.toEqual([fest]);
    // The store resolves undefined on a failed read.
    await expect(loadEvents(platform, pastFilter)).resolves.toBeUndefined();

    expect(platform.event.get.mock.calls).toEqual([
      [upcomingFilter],
      [pastFilter],
    ]);
    expect(event.list.query).not.toHaveBeenCalled();
  });

  it('loads and finds through the store under the same filter', () => {
    const platform = makePlatform();
    const stored = fromJS([fest]);
    platform.event.find.mockReturnValue(stored);

    const { result, rerender } = renderHook(
      ({ filter }) => useEvents(platform, filter),
      { initialProps: { filter: profileFilter } },
    );
    rerender({ filter: { ...profileFilter } });

    expect(result.current).toBe(stored);
    expect(platform.event.get).toHaveBeenCalledTimes(1);
    expect(platform.event.get).toHaveBeenCalledWith(profileFilter);
    expect(platform.event.find).toHaveBeenCalledWith(profileFilter);
    expect(event.attendedBy.query).not.toHaveBeenCalled();
  });

  it('waits for the platform before loading', () => {
    const { result } = renderHook(() => useEvents(undefined, pastFilter));

    expect(result.current).toBeUndefined();
  });

  it("fills the store with the bookings tables' `_id $in` and getOne reads", async () => {
    const platform = makePlatform();

    await storeEventsByIds(platform, ['e1', 'e2']);
    await storeEvent(platform, 'e1');

    expect(platform.event.get.mock.calls).toEqual([
      [{ where: { _id: { $in: ['e1', 'e2'] } } }],
    ]);
    expect(platform.event.getOne.mock.calls).toEqual([['e1']]);
    expect(platform.event.set).not.toHaveBeenCalled();
  });

  it('leaves EditModel on axios', () => {
    expect(eventEditModelBackend()).toEqual({});
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('lists with the inputs each legacy read stood for', async () => {
    event.list.query.mockResolvedValue([fest, {}]);

    await expect(fetchEvents(500)).resolves.toEqual([fest, {}]);
    await fetchEventsByIds(['e1', 'e2'], 100);
    await fetchEventsEndingAfter(NOW, 100);
    await fetchEventsByStartEndingAfter(NOW, 100);

    expect(event.list.query.mock.calls).toEqual([
      [{ limit: 500 }],
      [{ ids: ['e1', 'e2'], limit: 100 }],
      [{ endAfter: ISO, limit: 100 }],
      [{ endAfter: ISO, limit: 100, sortBy: 'start' }],
    ]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads one on the browser client, or a server render token on its own', async () => {
    event.get.query.mockResolvedValue(fest);
    mockServerGet.mockResolvedValue(camp);

    await expect(fetchEvent('fest')).resolves.toBe(fest);
    await fetchEvent('fest', { token: undefined });
    await expect(fetchEvent('camp', { token: 'ssr-jwt' })).resolves.toBe(camp);

    expect(event.get.query.mock.calls).toEqual([
      [{ idOrSlug: 'fest' }],
      [{ idOrSlug: 'fest' }],
    ]);
    expect(mockedTrpcFor).toHaveBeenCalledWith('ssr-jwt');
    expect(mockServerGet).toHaveBeenCalledWith({ idOrSlug: 'camp' });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("rejects a missing event with legacy's bare 404", async () => {
    event.get.query.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'Event not found'),
    );

    await expect(fetchEvent('gone')).rejects.toMatchObject({
      message: 'Request failed with status code 404',
      response: { status: 404, data: { results: null } },
    });
  });

  it('attends and patches the photo through mutations', async () => {
    event.attend.mutate.mockResolvedValue(fest);
    event.update.mutate.mockResolvedValue(fest);

    await expect(setEventAttendance('e1', true)).resolves.toBe(fest);
    await updateEventPhoto('e1', 'p1');

    expect(event.attend.mutate).toHaveBeenCalledWith({
      id: 'e1',
      attend: true,
    });
    expect(event.update.mutate).toHaveBeenCalledWith({
      idOrSlug: 'e1',
      data: { photo: 'p1' },
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.patch).not.toHaveBeenCalled();
  });

  it('rejects a failed RSVP with the API message', async () => {
    event.attend.mutate.mockRejectedValue(
      trpcError('UNAUTHORIZED', 401, 'Not signed in'),
    );

    await expect(setEventAttendance('e1', true)).rejects.toMatchObject({
      response: { status: 401, data: { error: 'Not signed in' } },
    });
  });

  it("maps the calendars' filters, the store's -created default included", async () => {
    const platform = makePlatform();
    event.list.query.mockResolvedValue([fest]);

    await expect(loadEvents(platform, upcomingFilter)).resolves.toEqual([fest]);
    await loadEvents(platform, pastFilter);
    await loadEvents(platform, { where: { end: { $gt: NOW } } });

    expect(event.list.query.mock.calls).toEqual([
      [{ endAfter: ISO, limit: 100, sortBy: 'start' }],
      [{ endBefore: ISO, limit: 20, sortBy: '-start' }],
      [{ endAfter: ISO, sortBy: '-created' }],
    ]);
    expect(platform.event.get).not.toHaveBeenCalled();
  });

  it('resolves undefined on a failed read, as the store does', async () => {
    event.list.query.mockRejectedValue(new Error('boom'));

    await expect(
      loadEvents(makePlatform(), pastFilter),
    ).resolves.toBeUndefined();
  });

  it("sends the profile's attended filter to attendedBy", async () => {
    event.attendedBy.query.mockResolvedValue([camp]);
    const platform = makePlatform();

    const { result } = renderHook(() => useEvents(platform, profileFilter));

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current?.count()).toBe(1));
    expect(result.current?.getIn([0, 'slug'])).toBe('camp');
    expect(event.attendedBy.query).toHaveBeenCalledWith({
      userId: 'u1',
      ids: ['e2'],
      endBefore: ISO,
      limit: 20,
      page: 1,
      sortBy: '-start',
    });
    expect(platform.event.get).not.toHaveBeenCalled();
    expect(platform.event.find).not.toHaveBeenCalled();
  });

  it('sends no ids before the attended ids land, and nothing without a member', async () => {
    event.attendedBy.query.mockResolvedValue([]);
    const platform = makePlatform();
    const noIds: EventFilter = {
      ...profileFilter,
      where: {
        $or: [{ attendees: 'u1' }],
        visibility: 'public',
        end: { $lt: NOW },
      },
    };
    const noMember: EventFilter = {
      ...profileFilter,
      where: { $or: [{}], visibility: 'public', end: { $lt: NOW } },
    };

    renderHook(() => useEvents(platform, noIds));
    const { result } = renderHook(() => useEvents(platform, noMember));

    await waitFor(() =>
      expect(event.attendedBy.query).toHaveBeenCalledTimes(1),
    );
    expect(event.attendedBy.query).toHaveBeenCalledWith({
      userId: 'u1',
      endBefore: ISO,
      limit: 20,
      page: 1,
      sortBy: '-start',
    });
    expect(result.current).toBeUndefined();
  });

  it("shows nothing for a new filter until its own read lands, as the store's find", async () => {
    event.list.query.mockResolvedValueOnce([fest]);
    event.list.query.mockRejectedValueOnce(new Error('boom'));
    const platform = makePlatform();

    const { result, rerender } = renderHook(
      ({ filter }) => useEvents(platform, filter),
      { initialProps: { filter: { ...pastFilter, page: 1 } } },
    );
    await waitFor(() => expect(result.current?.count()).toBe(1));
    rerender({ filter: { ...pastFilter, page: 2 } });
    await waitFor(() => expect(event.list.query).toHaveBeenCalledTimes(2));

    expect(event.list.query).toHaveBeenLastCalledWith({
      endBefore: ISO,
      limit: 20,
      page: 2,
      sortBy: '-start',
    });
    expect(result.current).toBeUndefined();
  });

  it('puts readable events in the store for findOne, skipping `{}` and failures', async () => {
    const platform = makePlatform();
    event.list.query.mockResolvedValueOnce([fest, {}]);
    event.get.query.mockResolvedValueOnce(camp);

    await storeEventsByIds(platform, ['e1', 'e3']);
    await storeEvent(platform, 'e2');

    expect(event.list.query).toHaveBeenCalledWith({
      ids: ['e1', 'e3'],
      sortBy: '-created',
    });
    expect(event.get.query).toHaveBeenCalledWith({ idOrSlug: 'e2' });
    expect(platform.event.set.mock.calls).toEqual([[fest], [camp]]);

    event.list.query.mockRejectedValueOnce(new Error('boom'));
    event.get.query.mockRejectedValueOnce(
      trpcError('NOT_FOUND', 404, 'Event not found'),
    );
    await expect(storeEventsByIds(platform, ['e1'])).resolves.toBeUndefined();
    await expect(storeEvent(platform, 'gone')).resolves.toBeUndefined();
    expect(platform.event.set).toHaveBeenCalledTimes(2);
    expect(platform.event.get).not.toHaveBeenCalled();
    expect(platform.event.getOne).not.toHaveBeenCalled();
  });

  describe('eventEditModelBackend', () => {
    it('loads by id or slug', async () => {
      event.get.query.mockResolvedValue(fest);

      await expect(eventEditModelBackend().load!('e1')).resolves.toBe(fest);
      expect(event.get.query).toHaveBeenCalledWith({ idOrSlug: 'e1' });
    });

    it('creates without an id and updates with one', async () => {
      event.create.mutate.mockResolvedValue(fest);
      event.update.mutate.mockResolvedValue(fest);
      const { save } = eventEditModelBackend();

      await save!({ name: 'Fest' });
      await save!({ name: 'Fest' }, 'e1');

      expect(event.create.mutate).toHaveBeenCalledWith({ name: 'Fest' });
      expect(event.update.mutate).toHaveBeenCalledWith({
        idOrSlug: 'e1',
        data: { name: 'Fest' },
      });
    });

    it('removes by id', async () => {
      event.remove.mutate.mockResolvedValue({ deleted: true });

      await expect(eventEditModelBackend().remove!('e1')).resolves.toBe(
        undefined,
      );
      expect(event.remove.mutate).toHaveBeenCalledWith({ id: 'e1' });
    });

    it('rejects with the error EditModel already knows how to show', async () => {
      event.update.mutate.mockRejectedValue(
        trpcError('NOT_FOUND', 404, 'Event not found'),
      );

      await expect(
        eventEditModelBackend().save!({}, 'gone'),
      ).rejects.toMatchObject({ message: 'Event not found' });
    });
  });
});
