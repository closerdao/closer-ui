import api, { formatSearch } from './api';
import {
  CreateLandProjectInput,
  LandProject,
  LandProjectCriteria,
  LandProjectMapItem,
  LandProjectSearchParams,
  LandProjectSearchResponse,
} from '../types/landProject';
import {
  PEOPLE_COUNT_MAX,
  PEOPLE_COUNT_MIN,
  ROOMS_COUNT_MIN,
  VILLAGE_COLLECTION,
} from '../constants/landProject.constants';

export function toLeafletCoords(
  coords: [number, number] | number[] | undefined,
): [number, number] | null {
  if (!coords || coords.length !== 2) return null;
  const [a, b] = coords;
  if (
    typeof a !== 'number' ||
    typeof b !== 'number' ||
    Number.isNaN(a) ||
    Number.isNaN(b)
  ) {
    return null;
  }
  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
    return [a, b];
  }
  if (Math.abs(b) <= 90 && Math.abs(a) <= 180) {
    return [b, a];
  }
  return [a, b];
}

export function toApiCoords(
  leafletCoords: [number, number],
): [number, number] {
  return leafletCoords;
}

export function landProjectToMapItem(
  project: LandProject | LandProjectMapItem,
): LandProjectMapItem | null {
  const coords = toLeafletCoords(project.coords);
  if (!coords) return null;
  return {
    _id: '_id' in project ? project._id : undefined,
    slug: project.slug,
    name: project.name,
    closer: Boolean(project.closer),
    description: project.description,
    tags: project.tags || [],
    country: project.country,
    website: project.website,
    coords,
    verificationBadge:
      'verificationBadge' in project ? project.verificationBadge : undefined,
    onboardingStatus:
      'onboardingStatus' in project ? project.onboardingStatus : undefined,
  };
}

export function meetsHardCriteria(criteria?: LandProjectCriteria): boolean {
  if (!criteria) return false;
  const peopleOk =
    typeof criteria.peopleCount === 'number' &&
    criteria.peopleCount >= PEOPLE_COUNT_MIN &&
    criteria.peopleCount <= PEOPLE_COUNT_MAX;
  const roomsOk =
    typeof criteria.roomsCount === 'number' &&
    criteria.roomsCount >= ROOMS_COUNT_MIN;
  return Boolean(
    criteria.landBased &&
      criteria.hasLand &&
      criteria.peopleOnLand &&
      criteria.operationalized &&
      criteria.notTechnophobic &&
      peopleOk &&
      roomsOk,
  );
}

function buildVillageWhere(
  params: LandProjectSearchParams = {},
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.country) where.country = params.country;
  if (params.closer !== undefined) where.closer = params.closer;
  if (params.tags) {
    where.tags = { $in: params.tags.split(',').map((tag) => tag.trim()) };
  }
  return where;
}

export async function fetchLandProjects(
  params: LandProjectSearchParams = {},
): Promise<LandProject[]> {
  try {
    const where = buildVillageWhere(params);
    const { data } = await api.get(`/${VILLAGE_COLLECTION}`, {
      params: {
        ...(Object.keys(where).length > 0
          ? { where: formatSearch(where) }
          : {}),
        limit: params.limit || 100,
        page: params.page,
        sort: params.sort,
      },
    });
    if (Array.isArray(data?.results)) return data.results as LandProject[];
    if (Array.isArray(data?.villages)) return data.villages as LandProject[];
    if (Array.isArray(data?.landProjects))
      return data.landProjects as LandProject[];
    if (Array.isArray(data)) return data as LandProject[];
    return [];
  } catch {
    return [];
  }
}

export async function searchLandProjects(
  params: LandProjectSearchParams = {},
): Promise<LandProjectSearchResponse> {
  const results = await fetchLandProjects(params);
  return {
    landProjects: results,
    pagination: {
      page: params.page || 1,
      limit: params.limit || 20,
      total: results.length,
      pages: 1,
    },
  };
}

export async function getLandProject(
  idOrSlug: string,
): Promise<LandProject | null> {
  try {
    const { data } = await api.get(`/${VILLAGE_COLLECTION}/${idOrSlug}`);
    return (data?.results || data) as LandProject;
  } catch {
    return null;
  }
}

export async function createLandProject(
  payload: CreateLandProjectInput,
): Promise<LandProject> {
  const { data } = await api.post(`/${VILLAGE_COLLECTION}`, {
    ...payload,
    coords: toApiCoords(payload.coords),
    closer: false,
    verificationBadge: payload.verificationBadge || 'unverified',
    onboardingStatus: payload.onboardingStatus || 'map_only',
  });
  return (data?.results || data) as LandProject;
}

export async function updateLandProject(
  id: string,
  payload: Partial<LandProject>,
): Promise<LandProject> {
  const body = { ...payload };
  if (body.coords) {
    body.coords = toApiCoords(body.coords as [number, number]);
  }
  const { data } = await api.patch(`/${VILLAGE_COLLECTION}/${id}`, body);
  return (data?.results || data) as LandProject;
}

export async function linkLandProjectToProjectApi(
  landProjectId: string,
  projectApiId: string,
): Promise<LandProject> {
  return updateLandProject(landProjectId, {
    projectApi: projectApiId,
  } as Partial<LandProject>);
}

export async function requestLandProjectDeploy(
  id: string,
  notes?: string,
): Promise<LandProject> {
  return updateLandProject(id, {
    onboardingStatus: 'deploy_requested',
    deployRequest: {
      status: 'requested',
      requestedAt: new Date().toISOString(),
      notes,
    },
  } as Partial<LandProject>);
}

export async function markLandProjectSubscribed(
  id: string,
): Promise<LandProject> {
  return updateLandProject(id, {
    onboardingStatus: 'subscribed',
    platformSubscription: {
      status: 'trialing',
      planPriceEur: 49,
      trialStartedAt: new Date().toISOString(),
    },
  } as Partial<LandProject>);
}

export function canManageLandProject(
  project: LandProject | null | undefined,
  userId?: string,
): boolean {
  if (!project || !userId) return false;
  if (project.createdBy === userId) return true;
  return Boolean(project.managedBy?.includes(userId));
}

export function canRequestDeploy(
  project: LandProject | null | undefined,
  userId?: string,
): boolean {
  if (!canManageLandProject(project, userId) || !project) return false;
  const sub = project.platformSubscription?.status;
  const subscribed = sub === 'trialing' || sub === 'active';
  const status = project.onboardingStatus;
  return (
    subscribed &&
    (status === 'subscribed' ||
      status === 'pre_assessed' ||
      status === 'map_only')
  );
}
