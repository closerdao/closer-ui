import { useEffect, useState } from 'react';

import { List, fromJS } from 'immutable';

import type { Event } from '../types/event';
import type { EventReport } from '../types/eventReport';
import api, { formatSearch } from './api';
import {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  trpc,
  trpcFor,
} from './trpc';

type Platform = Record<string, any>;

// The `where` the store's event reads send: an end-date window or `_id $in`, or the member profile's attended events.
export type EventWhere =
  | { end?: { $gt?: Date; $lt?: Date }; _id?: { $in: string[] } }
  | {
      $or:
        | [{ attendees?: string }]
        | [{ attendees?: string }, { _id: { $in: string[] } }];
      visibility: 'public';
      end: { $lt: Date };
    };

export type EventFilter = {
  where?: EventWhere;
  limit?: number;
  page?: number;
  sort_by?: string;
};

const iso = (date: Date | string) => new Date(date).toISOString();

// The store's `get(filter)` over tRPC; null where legacy's `{attendees: undefined}` clause matched every public event.
const queryEvents = (filter: EventFilter) => {
  const { where = {}, limit, page } = filter;
  const paging = {
    ...(limit !== undefined && { limit }),
    ...(page !== undefined && { page }),
    sortBy: filter.sort_by ?? '-created',
  };
  if ('$or' in where) {
    const [{ attendees: userId }, byIds] = where.$or;
    if (!userId) return Promise.resolve(null);
    return trpc.event.attendedBy.query({
      userId,
      ...(byIds && { ids: byIds._id.$in }),
      endBefore: iso(where.end.$lt),
      ...paging,
    });
  }
  return trpc.event.list.query({
    ...(where.end?.$gt && { endAfter: iso(where.end.$gt) }),
    ...(where.end?.$lt && { endBefore: iso(where.end.$lt) }),
    ...(where._id && { ids: where._id.$in }),
    ...paging,
  });
};

// Sitemap `GET /event?limit=N` in the API's default order; `{}` stands for an event the caller cannot read.
export const fetchEvents = async (limit: number): Promise<Event[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/event?limit=${limit}`);
    return res.data.results;
  }
  const results = await trpc.event.list.query({ limit }).catch(throwApiError);
  return results as unknown as Event[];
};

// The `/tickets` page's `GET /event` for its tickets' events, in the API's default order.
export const fetchEventsByIds = async (
  ids: string[],
  limit: number,
): Promise<Event[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/event', {
      params: { where: formatSearch({ _id: { $in: ids } }), limit },
    });
    return res.data.results;
  }
  const results = await trpc.event.list
    .query({ ids, limit })
    .catch(throwApiError);
  return results as unknown as Event[];
};

// The stay search's `GET /event?where={end:{$gt}}&limit=N`, in the API's default order.
export const fetchEventsEndingAfter = async (
  after: Date,
  limit: number,
): Promise<Event[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(
      `/event?where=${JSON.stringify({ end: { $gt: after } })}&limit=${limit}`,
    );
    return res.data.results;
  }
  const results = await trpc.event.list
    .query({ endAfter: iso(after), limit })
    .catch(throwApiError);
  return results as unknown as Event[];
};

// The quest editor's `GET /event` of events ending after `after`, soonest start first.
export const fetchEventsByStartEndingAfter = async (
  after: Date,
  limit: number,
): Promise<Event[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/event', {
      params: {
        where: formatSearch({ end: { $gt: after } }),
        limit,
        sort_by: 'start',
      },
    });
    return res.data.results;
  }
  const results = await trpc.event.list
    .query({ endAfter: iso(after), limit, sortBy: 'start' })
    .catch(throwApiError);
  return results as unknown as Event[];
};

// Legacy `GET /event/:idOrSlug`; `token` is a server render's cookie token, which the browser's own client cannot see.
export const fetchEvent = async (
  idOrSlug: string,
  options?: { token: string | undefined },
): Promise<Event> => {
  if (!isTrpcEnabled()) {
    const path = `/event/${idOrSlug}`;
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
  ).event.get
    .query({ idOrSlug })
    .catch(throwApiErrorWithLegacy404);
  return result as unknown as Event;
};

// The store's `get(filter)` results as plain objects; undefined when the read failed, as the store resolves then.
export const loadEvents = async (
  platform: Platform,
  filter: EventFilter,
): Promise<Event[] | undefined> => {
  if (!isTrpcEnabled()) {
    const res = await platform.event.get(filter);
    return res?.results?.toJS();
  }
  const results = await queryEvents(filter).catch(() => null);
  return (results ?? undefined) as Event[] | undefined;
};

// The store's list for `filter` or, with tRPC, the same read in local state; Immutable either way.
export const useEvents = (
  platform: Platform | undefined,
  filter: EventFilter,
): List<any> | undefined => {
  const [loaded, setLoaded] = useState<{ key: string; events: List<any> }>();
  const filterKey = JSON.stringify(filter);

  useEffect(() => {
    if (!isTrpcEnabled()) {
      if (platform?.event) void platform.event.get(filter);
      return;
    }
    let cancelled = false;
    queryEvents(filter)
      .then((results) => {
        if (!cancelled && results) {
          setLoaded({ key: filterKey, events: fromJS(results) as List<any> });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey stands for filter
  }, [filterKey]);

  if (!isTrpcEnabled()) return platform?.event?.find?.(filter);
  // Another filter's list is not this one's, as the store's find keys by filter.
  return loaded?.key === filterKey ? loaded.events : undefined;
};

// Puts the events with `ids` in the store, where the bookings tables read them with `findOne`.
export const storeEventsByIds = async (
  platform: Platform,
  ids: string[],
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await platform.event.get({ where: { _id: { $in: ids } } });
    return;
  }
  const results = await trpc.event.list
    .query({ ids, sortBy: '-created' })
    .catch(() => []);
  results.forEach((event) => {
    if ('_id' in event) platform.event.set(event);
  });
};

// Puts one event in the store, as the store's `getOne(id)` did; a failed read leaves it out.
export const storeEvent = async (
  platform: Platform,
  id: string,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await platform.event.getOne(id);
    return;
  }
  const event = await trpc.event.get.query({ idOrSlug: id }).catch(() => null);
  if (event) platform.event.set(event);
};

// Legacy `POST /attend/event/:id`: the event after the RSVP; `{}` when the caller may not read it.
export const setEventAttendance = async (
  id: string,
  attend: boolean,
): Promise<Event> => {
  if (!isTrpcEnabled()) {
    const res = await api.post(`/attend/event/${id}`, { attend });
    return res.data.results;
  }
  const result = await trpc.event.attend
    .mutate({ id, attend })
    .catch(throwApiError);
  return result as unknown as Event;
};

// The event page's `PATCH /event/:id {photo}` after an upload.
export const updateEventPhoto = async (
  id: string,
  photo: string,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.patch(`/event/${id}`, { photo });
    return;
  }
  await trpc.event.update
    .mutate({ idOrSlug: id, data: { photo } })
    .catch(throwApiError);
};

// Legacy `POST /events/:id/notifications`: mails `userId` the event's calendar invite.
export const sendEventInvite = async (
  id: string,
  userId: string | undefined,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.post(`/events/${id}/notifications`, { userId });
    return;
  }
  if (!userId) {
    throw Object.assign(new Error('User ID is required'), {
      response: { status: 400, data: { error: 'User ID is required' } },
    });
  }
  await trpc.event.sendInvite.mutate({ id, userId }).catch(throwApiError);
};

type AttendeeEmail = {
  subject: string;
  body: string;
  linkText: string;
  linkUrl: string;
};

// Legacy `POST /events/:id/email-attendees`: how many attendees were mailed.
export const emailEventAttendees = async (
  id: string,
  email: AttendeeEmail,
): Promise<number> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post(`/events/${id}/email-attendees`, email);
    return data?.sent ?? 0;
  }
  const { sent } = await trpc.event.emailAttendees
    .mutate({ id, ...email })
    .catch(throwApiError);
  return sent;
};

// Legacy `GET /events/:id/report`; `token` is a server render's cookie token, as in fetchEvent.
export const fetchEventReport = async (
  id: string,
  token: string | undefined,
): Promise<EventReport | null> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/events/${id}/report`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res?.data?.results || null;
  }
  const report = await (token ? trpcFor(token) : trpc).event.report
    .query({ id })
    .catch(throwApiError);
  return report as unknown as EventReport;
};

// EditModel load/save/remove over tRPC; `{}` leaves EditModel on its axios calls.
export const eventEditModelBackend = () =>
  isTrpcEnabled()
    ? {
        load: (id: string) =>
          trpc.event.get.query({ idOrSlug: id }).catch(throwApiError),
        save: (payload: any, id?: string) =>
          (id
            ? trpc.event.update.mutate({ idOrSlug: id, data: payload })
            : trpc.event.create.mutate(payload)
          ).catch(throwApiError),
        remove: async (id: string) => {
          await trpc.event.remove.mutate({ id }).catch(throwApiError);
        },
      }
    : {};
