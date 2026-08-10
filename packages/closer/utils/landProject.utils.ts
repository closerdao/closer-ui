import api from './api';
import {
  CreateLandProjectInput,
  LandProject,
  LandProjectCriteria,
  LandProjectMapItem,
  LandProjectSearchParams,
  LandProjectSearchResponse,
} from '../types/landProject';
import {
  LAND_PROJECT_COLLECTION,
  PEOPLE_COUNT_MAX,
  PEOPLE_COUNT_MIN,
  ROOMS_COUNT_MIN,
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

export async function fetchLandProjects(
  params: LandProjectSearchParams = {},
): Promise<LandProject[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  try {
    const { data } = await api.get(
      qs
        ? `/${LAND_PROJECT_COLLECTION}/search?${qs}`
        : `/${LAND_PROJECT_COLLECTION}`,
    );
    if (Array.isArray(data?.results)) return data.results as LandProject[];
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
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  const { data } = await api.get(
    `/${LAND_PROJECT_COLLECTION}/search${qs ? `?${qs}` : ''}`,
  );
  return {
    landProjects: (data?.landProjects || data?.results || []) as LandProject[],
    pagination: data?.pagination || {
      page: params.page || 1,
      limit: params.limit || 20,
      total: (data?.landProjects || data?.results || []).length,
      pages: 1,
    },
  };
}

export async function getLandProject(
  idOrSlug: string,
): Promise<LandProject | null> {
  try {
    const { data } = await api.get(`/${LAND_PROJECT_COLLECTION}/${idOrSlug}`);
    return (data?.results || data) as LandProject;
  } catch {
    return null;
  }
}

export async function createLandProject(
  payload: CreateLandProjectInput,
): Promise<LandProject> {
  const { data } = await api.post(`/${LAND_PROJECT_COLLECTION}`, {
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
  const { data } = await api.patch(`/${LAND_PROJECT_COLLECTION}/${id}`, body);
  return (data?.results || data) as LandProject;
}

export async function linkLandProjectToProjectApi(
  landProjectId: string,
  projectApiId: string,
): Promise<LandProject> {
  const { data } = await api.patch(
    `/${LAND_PROJECT_COLLECTION}/${landProjectId}/link-project-api`,
    { projectApiId },
  );
  return (data?.landProject || data?.results || data) as LandProject;
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
