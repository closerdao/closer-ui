import type { Project, Role, VolunteerOpportunity } from '../types';
import api from './api';
import { applyInteractionIsHumanFromResponse } from './interactionSession';
import {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  trpc,
  trpcFor,
} from './trpc';

type Platform = Record<string, any>;
type FetchOptions = { token: string | undefined };

type ProjectCreate = Parameters<typeof trpc.project.create.mutate>[0];
type ProjectUpdate = Parameters<typeof trpc.project.update.mutate>[0]['data'];
type RoleCreate = Parameters<typeof trpc.role.create.mutate>[0];
type RoleUpdate = Parameters<typeof trpc.role.update.mutate>[0]['data'];
type VolunteerUpdate = Parameters<
  typeof trpc.volunteer.update.mutate
>[0]['data'];
type WebinarInput = Parameters<typeof trpc.webinar.register.mutate>[0];

// A server render's cookie token goes in a bearer header; the browser's own client already has it.
const clientFor = (options?: FetchOptions) =>
  options?.token ? trpcFor(options.token) : trpc;
const bearer = (options?: FetchOptions) =>
  options?.token
    ? { headers: { Authorization: `Bearer ${options.token}` } }
    : undefined;

// Legacy `GET /project` in the API's default order.
export const fetchProjects = async (): Promise<Project[]> => {
  if (!isTrpcEnabled('8.3a')) {
    const res = await api.get('/project');
    return res.data.results;
  }
  const results = await trpc.project.list.query({}).catch(throwApiError);
  return results as unknown as Project[];
};

// Legacy `GET /project/:search`; a missing project rejects with legacy's 404.
export const fetchProject = async (
  idOrSlug: string,
  options?: FetchOptions,
): Promise<Project> => {
  if (!isTrpcEnabled('8.3a')) {
    const res = await api.get(`/project/${idOrSlug}`, bearer(options));
    return res.data.results;
  }
  const result = await clientFor(options)
    .project.get.query({ idOrSlug })
    .catch(throwApiErrorWithLegacy404);
  return result as unknown as Project;
};

// Legacy `GET /role` in the API's default order.
export const fetchRoles = async (): Promise<Role[]> => {
  if (!isTrpcEnabled('8.3a')) {
    const res = await api.get('/role');
    return res.data.results;
  }
  const results = await trpc.role.list.query({}).catch(throwApiError);
  return results as unknown as Role[];
};

// Legacy `GET /role/:search`; a missing role rejects with legacy's 404.
export const fetchRole = async (
  idOrSlug: string,
  options?: FetchOptions,
): Promise<Role> => {
  if (!isTrpcEnabled('8.3a')) {
    const res = await api.get(`/role/${idOrSlug}`, bearer(options));
    return res.data.results;
  }
  const result = await clientFor(options)
    .role.get.query({ idOrSlug })
    .catch(throwApiErrorWithLegacy404);
  return result as unknown as Role;
};

// Legacy `GET /volunteer`, or `?limit=N` for the sitemaps, in the API's default order.
export const fetchVolunteers = async (
  limit?: number,
): Promise<VolunteerOpportunity[]> => {
  if (!isTrpcEnabled('8.3a')) {
    const res = await api.get(
      limit === undefined ? '/volunteer' : `/volunteer?limit=${limit}`,
    );
    return res.data.results;
  }
  const results = await trpc.volunteer.list
    .query(limit === undefined ? {} : { limit })
    .catch(throwApiError);
  return results as unknown as VolunteerOpportunity[];
};

// Legacy `GET /volunteer/:search`; a missing opportunity rejects with legacy's 404.
export const fetchVolunteer = async (
  idOrSlug: string,
  options?: FetchOptions,
): Promise<VolunteerOpportunity> => {
  if (!isTrpcEnabled('8.3a')) {
    const res = await api.get(`/volunteer/${idOrSlug}`, bearer(options));
    return res.data.results;
  }
  const result = await clientFor(options)
    .volunteer.get.query({ idOrSlug })
    .catch(throwApiErrorWithLegacy404);
  return result as unknown as VolunteerOpportunity;
};

// Puts the opportunities with `ids` in the store, where the bookings tables read them with `findOne`.
export const storeVolunteersByIds = async (
  platform: Platform,
  ids: string[],
): Promise<void> => {
  if (!isTrpcEnabled('8.3a')) {
    await platform.volunteer.get({ where: { _id: { $in: ids } } });
    return;
  }
  const results = await trpc.volunteer.list
    .query({ ids, sortBy: '-created' })
    .catch(() => []);
  results.forEach((volunteer) => {
    if ('_id' in volunteer) platform.volunteer.set(volunteer);
  });
};

// The resources block's `get(filter)`; where `find(filter)` reads them.
export const loadResources = (
  platform: Platform,
  filter: { sort_by: string },
) =>
  isTrpcEnabled('8.3a')
    ? platform.resource.get(filter, {
        load: () =>
          trpc.resource.list
            .query({ sortBy: filter.sort_by })
            .catch(throwApiError),
      })
    : platform.resource.get(filter);

// The dashboard's live visitors: interactions active since `since`, latest first, never from the store's cache.
export const loadLiveInteractions = (platform: Platform, since: string) => {
  const filter = {
    where: { lastactive: { $gte: since } },
    limit: 100,
    sort_by: '-lastactive',
  };
  return isTrpcEnabled('8.3a')
    ? platform.interaction.get(filter, {
        force: true,
        load: () =>
          trpc.interaction.list
            .query({
              lastactiveSince: since,
              limit: filter.limit,
              sortBy: filter.sort_by,
            })
            .catch(throwApiError),
      })
    : platform.interaction.get(filter, { force: true });
};

// Legacy `POST /message`: the member intro from a profile page.
export const postMessage = async (
  content: string,
  visibleBy: string[],
): Promise<void> => {
  if (!isTrpcEnabled('8.3a')) {
    await api.post('/message', { content, visibleBy });
    return;
  }
  await trpc.message.send.mutate({ content, visibleBy }).catch(throwApiError);
};

// Legacy `POST /webinar`.
export const registerForWebinar = async (
  input: WebinarInput,
): Promise<void> => {
  if (!isTrpcEnabled('8.3a')) {
    await api.post('/webinar', input);
    return;
  }
  const result = await trpc.webinar.register.mutate(input).catch(throwApiError);
  // The axios response interceptor does this for legacy `/webinar`.
  applyInteractionIsHumanFromResponse(result);
};

// `PATCH /project/:id` or `/volunteer/:id {photo}` after an upload (`null` clears it); UploadPhoto's callers pass user (elsewhere), project or volunteer.
export const updateModelPhoto = async (
  model: string,
  id: string,
  photo: string | string[] | null,
): Promise<void> => {
  if (!isTrpcEnabled('8.3a')) {
    await api.patch(`/${model}/${id}`, { photo });
    return;
  }
  const request =
    model === 'project'
      ? trpc.project.update.mutate({
          idOrSlug: id,
          data: { photo } as ProjectUpdate,
        })
      : trpc.volunteer.update.mutate({
          idOrSlug: id,
          data: { photo } as VolunteerUpdate,
        });
  await request.catch(throwApiError);
};

// EditModel load/save/remove over tRPC; `{}` leaves EditModel on its axios calls.
export const projectEditModelBackend = () =>
  isTrpcEnabled('8.3a')
    ? {
        load: (id: string) =>
          trpc.project.get.query({ idOrSlug: id }).catch(throwApiError),
        save: (payload: any, id?: string) =>
          (id
            ? trpc.project.update.mutate({
                idOrSlug: id,
                data: payload as ProjectUpdate,
              })
            : trpc.project.create.mutate(payload as ProjectCreate)
          ).catch(throwApiError),
        remove: async (id: string) => {
          await trpc.project.remove.mutate({ id }).catch(throwApiError);
        },
      }
    : {};

export const roleEditModelBackend = () =>
  isTrpcEnabled('8.3a')
    ? {
        load: (id: string) =>
          trpc.role.get.query({ idOrSlug: id }).catch(throwApiError),
        save: (payload: any, id?: string) =>
          (id
            ? trpc.role.update.mutate({
                idOrSlug: id,
                data: payload as RoleUpdate,
              })
            : trpc.role.create.mutate(payload as RoleCreate)
          ).catch(throwApiError),
        remove: async (id: string) => {
          await trpc.role.remove.mutate({ id }).catch(throwApiError);
        },
      }
    : {};

// Volunteer opportunities are only edited here; legacy has no create the UI calls.
export const volunteerEditModelBackend = () =>
  isTrpcEnabled('8.3a')
    ? {
        load: (id: string) =>
          trpc.volunteer.get.query({ idOrSlug: id }).catch(throwApiError),
        save: (payload: any, id?: string) =>
          trpc.volunteer.update
            .mutate({
              idOrSlug: id as string,
              data: payload as VolunteerUpdate,
            })
            .catch(throwApiError),
        remove: async (id: string) => {
          await trpc.volunteer.remove.mutate({ id }).catch(throwApiError);
        },
      }
    : {};
