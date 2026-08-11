import api, { formatSearch } from './api';
import {
  CreateVillageInput,
  Village,
  VillageCriteria,
  VillageMapItem,
  VillageSearchParams,
  VillageSearchResponse,
} from '../types/village';
import {
  PEOPLE_COUNT_MAX,
  PEOPLE_COUNT_MIN,
  ROOMS_COUNT_MIN,
  VILLAGE_COLLECTION,
} from '../constants/village.constants';

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

export function villageToMapItem(
  village: Village | VillageMapItem,
): VillageMapItem | null {
  const coords = toLeafletCoords(village.coords);
  if (!coords) return null;
  return {
    _id: '_id' in village ? village._id : undefined,
    slug: village.slug,
    name: village.name,
    closer: Boolean(village.closer),
    description: village.description,
    tags: village.tags || [],
    country: village.country,
    website: village.website,
    coords,
    verificationBadge:
      'verificationBadge' in village ? village.verificationBadge : undefined,
    onboardingStatus:
      'onboardingStatus' in village ? village.onboardingStatus : undefined,
  };
}

export function meetsHardCriteria(criteria?: VillageCriteria): boolean {
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
  params: VillageSearchParams = {},
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

export async function fetchVillages(
  params: VillageSearchParams = {},
): Promise<Village[]> {
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
    if (Array.isArray(data?.results)) return data.results as Village[];
    if (Array.isArray(data?.villages)) return data.villages as Village[];
    if (Array.isArray(data)) return data as Village[];
    return [];
  } catch {
    return [];
  }
}

export async function searchVillages(
  params: VillageSearchParams = {},
): Promise<VillageSearchResponse> {
  const results = await fetchVillages(params);
  return {
    villages: results,
    pagination: {
      page: params.page || 1,
      limit: params.limit || 20,
      total: results.length,
      pages: 1,
    },
  };
}

export async function getVillage(idOrSlug: string): Promise<Village | null> {
  try {
    const { data } = await api.get(`/${VILLAGE_COLLECTION}/${idOrSlug}`);
    return (data?.results || data) as Village;
  } catch {
    return null;
  }
}

export async function createVillage(
  payload: CreateVillageInput,
): Promise<Village> {
  const { data } = await api.post(`/${VILLAGE_COLLECTION}`, {
    ...payload,
    coords: toApiCoords(payload.coords),
    closer: false,
    verificationBadge: payload.verificationBadge || 'unverified',
    onboardingStatus: payload.onboardingStatus || 'map_only',
  });
  return (data?.results || data) as Village;
}

export async function updateVillage(
  id: string,
  payload: Partial<Village>,
): Promise<Village> {
  const body = { ...payload };
  if (body.coords) {
    body.coords = toApiCoords(body.coords as [number, number]);
  }
  const { data } = await api.patch(`/${VILLAGE_COLLECTION}/${id}`, body);
  return (data?.results || data) as Village;
}

export async function requestVillageDeploy(
  id: string,
  notes?: string,
): Promise<Village> {
  return updateVillage(id, {
    onboardingStatus: 'deploy_requested',
    deployRequest: {
      status: 'requested',
      requestedAt: new Date().toISOString(),
      notes,
    },
  } as Partial<Village>);
}

export async function markVillageSubscribed(id: string): Promise<Village> {
  return updateVillage(id, {
    onboardingStatus: 'subscribed',
    platformSubscription: {
      status: 'trialing',
      planPriceEur: 49,
      trialStartedAt: new Date().toISOString(),
    },
  } as Partial<Village>);
}

export function canManageVillage(
  village: Village | null | undefined,
  userId?: string,
): boolean {
  if (!village || !userId) return false;
  if (village.createdBy === userId) return true;
  return Boolean(village.managedBy?.includes(userId));
}

export function canRequestDeploy(
  village: Village | null | undefined,
  userId?: string,
): boolean {
  if (!canManageVillage(village, userId) || !village) return false;
  const sub = village.platformSubscription?.status;
  const subscribed = sub === 'trialing' || sub === 'active';
  const status = village.onboardingStatus;
  return (
    subscribed &&
    (status === 'subscribed' ||
      status === 'pre_assessed' ||
      status === 'map_only')
  );
}
