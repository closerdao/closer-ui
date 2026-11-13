import api, { formatSearch } from './api';
import {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  trpc,
} from './trpc';

type ListInput = Parameters<typeof trpc.engagementOpportunity.list.query>[0];
type UpdateData = Parameters<
  typeof trpc.engagementOpportunity.update.mutate
>[0]['data'];
type SampleEmailInput = Parameters<
  typeof trpc.engagementOpportunity.sampleEmail.mutate
>[0];
type HistoryInput = Parameters<
  typeof trpc.engagementOpportunity.appendHistory.mutate
>[0];

// The store's `where` presets; tRPC takes the same filter object.
export type EngagementListFilter = {
  where?: Record<string, unknown>;
  limit: number;
  page: number;
};

// The store's `where` presets (`$and` of status `$in`, priority, managedBy `$in`) as the procedure's named filters.
const toListInput = ({ where, limit, page }: EngagementListFilter) => {
  const clauses = (
    (where?.$and as Record<string, any>[]) ?? [where ?? {}]
  ).reduce((all, clause) => ({ ...all, ...clause }), {});
  return {
    ...(clauses.status && { status: clauses.status.$in as string[] }),
    ...(clauses.priority && { priority: clauses.priority as string }),
    ...(clauses.managedBy && { managedBy: clauses.managedBy.$in[0] as string }),
    limit,
    page,
    sortBy: '-score',
  } as ListInput;
};

// Legacy `GET /engagementopportunity`; the page reads `total`/`count`, which legacy lacks, so the store falls back to the page size.
export const fetchEngagementOpportunities = async (
  filter: EngagementListFilter,
): Promise<{ results: unknown[]; total?: number; count?: number }> => {
  if (!isTrpcEnabled('8.4a')) {
    const res = await api.get('/engagementopportunity', {
      params: {
        sort_by: '-score',
        ...filter,
        where: filter.where && formatSearch(filter.where),
      },
      cache: false,
    });
    return res.data;
  }
  const results = await trpc.engagementOpportunity.list
    .query(toListInput(filter))
    .catch(throwApiError);
  return { results };
};

// Legacy `PATCH /EngagementOpportunity/:id`.
export const patchEngagementOpportunity = async (
  id: string,
  data: Record<string, unknown>,
): Promise<{ results: unknown }> => {
  if (!isTrpcEnabled('8.4a')) {
    const res = await api.patch(`/engagementopportunity/${id}`, data);
    return res.data;
  }
  const results = await trpc.engagementOpportunity.update
    .mutate({ idOrSlug: id, data: data as UpdateData })
    .catch(throwApiErrorWithLegacy404);
  return { results };
};

// Legacy `POST /engagementopportunity/:id/dismiss`.
export const dismissEngagementOpportunity = async (
  id: string,
  data: { note?: string } = {},
): Promise<{ results: unknown }> => {
  if (!isTrpcEnabled('8.4a')) {
    const res = await api.post(
      `/engagementopportunity/${encodeURIComponent(id)}/dismiss`,
      data,
    );
    return res.data;
  }
  const results = await trpc.engagementOpportunity.dismiss
    .mutate({ id, ...data })
    .catch(throwApiError);
  return { results };
};

// Legacy `POST /engagement-opportunities/sample-email`.
export const fetchSampleEmail = async (
  data: SampleEmailInput,
): Promise<unknown> => {
  if (!isTrpcEnabled('8.4a')) {
    const res = await api.post('/engagement-opportunities/sample-email', data);
    return res.data;
  }
  return trpc.engagementOpportunity.sampleEmail
    .mutate(data)
    .catch(throwApiError);
};

// Legacy `POST /engagement-opportunities/:id/history`; no UI caller, kept for the store method.
export const appendEngagementHistory = async (
  id: string,
  data: Omit<HistoryInput, 'id'> = {} as Omit<HistoryInput, 'id'>,
): Promise<unknown> => {
  if (!isTrpcEnabled('8.4a')) {
    const res = await api.post(
      `/engagement-opportunities/${encodeURIComponent(id)}/history`,
      data,
    );
    return res.data;
  }
  return trpc.engagementOpportunity.appendHistory
    .mutate({ id, ...data } as HistoryInput)
    .catch(throwApiError);
};
