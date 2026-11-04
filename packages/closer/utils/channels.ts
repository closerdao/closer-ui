import type { Channel } from '../types/channel';
import api, { formatSearch } from './api';
import {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  trpc,
} from './trpc';

type CreateInput = Parameters<typeof trpc.channel.create.mutate>[0];
type UpdateInput = Parameters<typeof trpc.channel.update.mutate>[0]['data'];

// Legacy `GET /channel`; `{}` stands for a channel the caller cannot read.
export const fetchChannels = async (params: {
  limit: number;
  sort_by: string;
}): Promise<Channel[]> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get('/channel', { params });
    return data.results;
  }
  const results = await trpc.channel.list
    .query({ limit: params.limit, sortBy: params.sort_by })
    .catch(throwApiError);
  return results as Channel[];
};

// Legacy `GET /channel?where={"_id":{"$in":ids}}`, which stopped at the default page of 15.
export const fetchChannelsByIds = async (ids: string[]): Promise<Channel[]> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get('/channel', {
      params: { where: formatSearch({ _id: { $in: ids } }) },
    });
    return data.results;
  }
  const results = await trpc.channel.byIds.query({ ids }).catch(throwApiError);
  return results as Channel[];
};

// Legacy `GET /channel/:idOrSlug`; a missing or unreadable channel rejects with legacy's 404.
export const fetchChannel = async (idOrSlug: string): Promise<Channel> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get(`/channel/${idOrSlug}`);
    return data.results;
  }
  const result = await trpc.channel.get
    .query({ idOrSlug })
    .catch(throwApiErrorWithLegacy404);
  return result as Channel;
};

export const updateChannel = async (
  id: string,
  data: UpdateInput,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.patch(`/channel/${id}`, data);
    return;
  }
  await trpc.channel.update.mutate({ id, data }).catch(throwApiError);
};

// Legacy `POST /channel/:id/subscribe`; callers match on the returned message.
export const subscribeToChannel = async (
  id: string,
): Promise<{ message: string }> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post(`/channel/${id}/subscribe`);
    return data;
  }
  return trpc.channel.subscribe.mutate({ id }).catch(throwApiError);
};

// EditModel load/save/remove over tRPC; `{}` leaves EditModel on its axios calls.
export const channelEditModelBackend = () =>
  isTrpcEnabled()
    ? {
        load: (id: string) =>
          trpc.channel.get.query({ idOrSlug: id }).catch(throwApiError),
        save: (payload: any, id?: string) =>
          (id
            ? trpc.channel.update.mutate({ id, data: payload as UpdateInput })
            : trpc.channel.create.mutate(payload as CreateInput)
          ).catch(throwApiError),
        remove: async (id: string) => {
          await trpc.channel.remove.mutate({ id }).catch(throwApiError);
        },
      }
    : {};
