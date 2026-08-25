import axios from 'axios';

import {
  AMBASSADOR_ROLE,
  PEOPLE_COUNT_MAX,
  PEOPLE_COUNT_MIN,
  ROOMS_COUNT_MIN,
  VILLAGE_ADMIN_SETTABLE_STATUSES,
  VILLAGE_COLLECTION,
  VILLAGE_DEPLOYER_ROLES,
  VILLAGE_MANAGED_ONLY_STATUSES,
  VILLAGE_ONBOARDING_STATUSES,
  VILLAGE_REVIEWER_ROLES,
  VILLAGE_SLUG_FROZEN_FROM,
} from '../constants/village.constants';
import { User } from '../contexts/auth/types';
import {
  CreateVillageInput,
  LatLng,
  LngLat,
  Village,
  VillageCriteria,
  VillageEvent,
  VillageMapItem,
  VillageOnboardingStatus,
  VillageSearchParams,
  VillageSearchResponse,
  VillageSocialNetwork,
} from '../types/village';
import api, { formatSearch, invalidateGetCache } from './api';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isValidLatLng = (lat: number, lng: number) =>
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * API (GeoJSON `[lng, lat]`) -> Leaflet (`[lat, lng]`).
 *
 * This used to guess the order by magnitude, which is undecidable whenever both
 * values are <= 90 — i.e. all of Europe, Africa, the Middle East and India. Per
 * Auset (lng 32.9, lat 24.0) read back as lat 32.9 / lng 24.0 and landed in the
 * Mediterranean. The order is now fixed by convention rather than inferred.
 *
 * The one remaining inference is a rescue for legacy rows written lat-first by
 * older versions of the village form: if swapping would produce an out-of-range
 * latitude, the row cannot have been `[lng, lat]` to begin with.
 */
export function toLeafletCoords(
  coords: LngLat | number[] | undefined | null,
): LatLng | null {
  if (!coords || coords.length !== 2) return null;
  const [lng, lat] = coords;
  if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return null;

  if (isValidLatLng(lat, lng)) return [lat, lng];
  // Legacy lat-first row: `lat` here is really a longitude beyond +/-90.
  if (isValidLatLng(lng, lat)) return [lng, lat];
  return null;
}

/** Leaflet (`[lat, lng]`) -> API (GeoJSON `[lng, lat]`). */
export function toApiCoords(leafletCoords: LatLng): LngLat {
  const [lat, lng] = leafletCoords;
  return [lng, lat];
}

/**
 * Takes an API village (GeoJSON coords) and returns a map-ready item (Leaflet
 * coords). Data that is already map-shaped must not be passed through here —
 * it would get swapped a second time.
 */
export function villageToMapItem(village: Village): VillageMapItem | null {
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

/**
 * Client GETs are cached for five minutes, so every write below has to drop
 * the village reads it invalidates — otherwise an edit only shows up after a
 * hard reload. The prefix also covers the plural `/villages/...` routes.
 */
const invalidateVillageReads = () => invalidateGetCache(`/${VILLAGE_COLLECTION}`);

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
  invalidateVillageReads();
  return (data?.results || data) as Village;
}

/**
 * `coords` is taken in Leaflet order here, like `createVillage`, so callers can
 * hand over form state unchanged. Everything else matches `Village`.
 */
export type UpdateVillageInput = Partial<Omit<Village, 'coords'>> & {
  coords?: LatLng;
};

export async function updateVillage(
  id: string,
  payload: UpdateVillageInput,
): Promise<Village> {
  const { coords, ...rest } = payload;
  const body: Record<string, unknown> = { ...rest };
  if (coords) {
    body.coords = toApiCoords(coords);
  }
  const { data } = await api.patch(`/${VILLAGE_COLLECTION}/${id}`, body);
  invalidateVillageReads();
  return (data?.results || data) as Village;
}

/**
 * Thrown by `deployVillage` so the caller can tell the route's own refusals
 * (403/409/422/503) from procurement's, which arrive as a 4xx carrying
 * `{error, code}` verbatim. The message is always the text to show.
 */
export class DeployVillageError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'DeployVillageError';
    this.status = status;
    this.code = code;
  }
}

/** Deployed instances live at `<subdomain>.closer.earth`. */
export const CLOSER_DEPLOY_DOMAIN = 'closer.earth';

/**
 * Subdomains our infrastructure already answers on, or that would read as an
 * official Closer property rather than a village.
 */
const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'app',
  'admin',
  'mail',
  'staging',
  'closer',
];

const SUBDOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/**
 * Turns whatever the user typed — or a village name — into something that can
 * be a subdomain: lowercase, hyphens for spaces, nothing a hostname rejects.
 * The result still has to pass `isValidVillageSubdomain`; a name made entirely
 * of stripped characters normalizes to an (invalid) empty string.
 */
export function normalizeVillageSubdomain(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 30)
    .replace(/^-+|-+$/g, '');
}

/**
 * Lighter than `normalizeVillageSubdomain`, for sanitizing as the user types:
 * edge hyphens survive so one can be typed mid-word — the strict pattern check
 * at submit still rejects them if they are left dangling.
 */
export function sanitizeVillageSubdomainInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 30);
}

export function isValidVillageSubdomain(value: string): boolean {
  return SUBDOMAIN_PATTERN.test(value) && !RESERVED_SUBDOMAINS.includes(value);
}

/** What the deploy modal opens on: the village's own slug, else its name. */
export function suggestVillageSubdomain(village: Village): string {
  return normalizeVillageSubdomain(village.slug || village.name || '');
}

/**
 * Whether another village already answers to this slug. Errs on "free" when
 * the directory cannot be reached — the backend stays the authority and will
 * reject a duplicate on write.
 */
export async function isVillageSubdomainTaken(
  subdomain: string,
  excludeVillageId?: string,
): Promise<boolean> {
  try {
    const where = formatSearch({
      slug: subdomain,
      ...(excludeVillageId ? { _id: { $ne: excludeVillageId } } : {}),
    });
    const { data } = await api.get(`/${VILLAGE_COLLECTION}?where=${where}`, {
      params: { limit: 1 },
    });
    const results = data?.results || data;
    return Array.isArray(results) && results.length > 0;
  } catch {
    return false;
  }
}

/**
 * A 202 means the request was recorded. `warning` is set when procurement did
 * not answer (5xx / timeout): the village is `deploy_requested` and will be
 * picked up, but nothing has confirmed it — a different thing to tell the user
 * than a clean hand-off.
 */
export type DeployVillageResult = {
  /**
   * Absent when the response carried no village — the warning path can answer
   * without one. Callers must fall back to refetching rather than adopting
   * whatever shape came back.
   */
  village?: Village;
  warning?: string;
};

/**
 * `POST /village/:id/deploy` — note the singular collection: the neighbouring
 * invite-owner route is `/villages/:id/invite-owner`, and the two are not the
 * same prefix. The API writes `deployRequest` + `deploy_requested`, freezes the
 * slug and calls procurement; the same route retries after a `failed` deploy.
 */
export async function deployVillage(
  id: string,
  notes?: string,
): Promise<DeployVillageResult> {
  try {
    const { data } = await api.post(
      `/${VILLAGE_COLLECTION}/${id}/deploy`,
      notes ? { notes } : {},
    );
    invalidateVillageReads();
    const body = data?.results || data || {};
    // Only adopt something that actually looks like a Village. The old
    // `body.village || body.results || body` chain ended in the raw response
    // body, so a 202 that carried only a `warning` handed the page an object
    // with no name or slug to render.
    const candidate = body.village || body.results || body;
    const village =
      candidate && typeof candidate === 'object' && '_id' in candidate
        ? (candidate as Village)
        : undefined;
    return {
      village,
      warning: typeof data?.warning === 'string' ? data.warning : undefined,
    };
  } catch (err) {
    throw toDeployVillageError(err);
  }
}

/** Keeps the API's own error text — swallowing it hides procurement's reason. */
function toDeployVillageError(err: unknown): DeployVillageError {
  const response = (
    err as { response?: { status?: number; data?: Record<string, any> } }
  ).response;
  const body = response?.data;
  const message =
    (typeof body?.error === 'string' && body.error) ||
    (typeof body?.error?.message === 'string' && body.error.message) ||
    (typeof body?.message === 'string' && body.message) ||
    (err instanceof Error ? err.message : 'Deploy request failed');
  const code =
    (typeof body?.code === 'string' && body.code) ||
    (typeof body?.error?.code === 'string' && body.error.code) ||
    undefined;
  return new DeployVillageError(message, response?.status ?? 0, code);
}

/**
 * Who may press Deploy: admin, the `team` role, or a member of the village's
 * `managedBy` (its assigned ambassador). Founders (`createdBy`) are not
 * authorized yet — the API refuses them with a 403 until the subscription gate
 * lands, so they get the card read-only.
 */
export function canDeployVillage(
  village: Village | null | undefined,
  user?: Pick<User, '_id' | 'roles'> | null,
): boolean {
  if (!village || !user) return false;
  if (user.roles?.some((role) => VILLAGE_DEPLOYER_ROLES.includes(role))) {
    return true;
  }
  return Boolean(user._id && village.managedBy?.includes(user._id));
}

/** The founder email the deploy route resolves, in its precedence order. */
export function resolveFounderEmail(
  village: Village | null | undefined,
): string | null {
  if (!village) return null;
  return (
    village.projectManager?.email?.trim() ||
    village.contact?.email?.trim() ||
    null
  );
}

export type DeployReadiness = {
  ready: boolean;
  missingEmail: boolean;
  missingSlug: boolean;
};

/**
 * What can be checked before the route 422s. The creator's email is the route's
 * last fallback and the client rarely holds it, so `missingEmail` is a warning
 * rather than a block — the button stays pressable.
 */
export function getDeployReadiness(
  village: Village | null | undefined,
): DeployReadiness {
  const missingEmail = !resolveFounderEmail(village);
  const missingSlug = !village?.slug?.trim();
  return { ready: !missingSlug, missingEmail, missingSlug };
}

/**
 * The slug is procurement's join key with the deployed village, so it stops
 * being editable the moment a deploy is asked for — or the moment procurement
 * takes the village over, whatever its status. Mirrors `isSlugFrozen` in the
 * API model, which rejects the PATCH regardless of what this returns.
 */
export function isVillageSlugFrozen(
  village: Pick<Village, 'onboardingStatus' | 'managed'> | null | undefined,
): boolean {
  if (!village) return false;
  if (village.managed === true) return true;
  const statuses = VILLAGE_ONBOARDING_STATUSES as readonly string[];
  const rank = statuses.indexOf(village.onboardingStatus || '');
  return rank >= 0 && rank >= statuses.indexOf(VILLAGE_SLUG_FROZEN_FROM);
}

/**
 * The onboarding stages an admin may pick by hand for this village.
 *
 * Procurement provisions a *managed* village and its reconciler owns the
 * deployment outcome, so `failed` / `live` / `suspended` are not on offer
 * there — a manual edit would be overwritten within a minute. An unmanaged
 * village is one already running Closer that procurement never touched, and
 * hand-setting it to `live` is exactly how that is recorded, so the full set
 * stays available. `deploy_requested` / `deploying` are off the list for
 * everyone; the API rejects a PATCH that tries.
 */
export function villageAdminSettableStatuses(
  village: Pick<Village, 'managed'> | null | undefined,
): VillageOnboardingStatus[] {
  if (village?.managed !== true) return [...VILLAGE_ADMIN_SETTABLE_STATUSES];
  return VILLAGE_ADMIN_SETTABLE_STATUSES.filter(
    (status) =>
      !(VILLAGE_MANAGED_ONLY_STATUSES as readonly string[]).includes(status),
  );
}

/**
 * Files the deploy request under the chosen address. The subdomain becomes the
 * village's slug — the one identity it keeps across the map, the directory and
 * its own instance — and `appUrl` records where the instance will answer once
 * the team has built it. The address is PATCHed first so
 * `POST /village/:id/deploy` can freeze the slug and call procurement;
 * `deploy_requested` is not settable by PATCH.
 */
export async function deployVillageToCloser(
  id: string,
  subdomain: string,
): Promise<Village> {
  const host = `${subdomain}.${CLOSER_DEPLOY_DOMAIN}`;
  const notes = `Requested address: ${host}`;
  const patched = await updateVillage(id, {
    slug: subdomain,
    appUrl: `https://${host}`,
  });
  const { village } = await deployVillage(id, notes);
  return village ?? patched;
}

/**
 * The one village this user has launched, if any. `/village/launch` allows a
 * single village per member, and `createdBy` (set by the API from the token)
 * is what marks it as theirs.
 */
export async function fetchVillageCreatedBy(
  userId?: string,
): Promise<Village | null> {
  if (!userId) return null;
  try {
    const where = formatSearch({ createdBy: userId });
    const { data } = await api.get(`/${VILLAGE_COLLECTION}?where=${where}`, {
      params: { limit: 1 },
    });
    const results = data?.results || data;
    if (Array.isArray(results)) return (results[0] as Village) || null;
    return null;
  } catch {
    return null;
  }
}

/**
 * Sends the owner their invitation. Deliberately separate from the follow-up
 * `updateVillage` that records the address as the project manager contact: the
 * invite is the side effect, the PATCH is the bookkeeping, and a failed invite
 * must not leave a contact behind for an email nobody received.
 */
export async function inviteVillageOwner(
  id: string,
  email: string,
): Promise<void> {
  await api.post(`/villages/${id}/invite-owner`, { email });
  invalidateVillageReads();
}

/**
 * A village that is live runs its own Closer instance, so its events live on
 * *its* API rather than ours.
 *
 * Deliberately not routed through `api`: that client is pinned to our own
 * base URL and attaches the signed-in user's access token to every request,
 * which must never travel to a host a village operator controls.
 */
export async function fetchVillageEvents(
  apiUrl?: string,
  limit = 3,
): Promise<VillageEvent[]> {
  const base = (apiUrl || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(base)) return [];

  const where = formatSearch({ end: { $gt: new Date().toISOString() } });
  // Built by hand rather than through axios `params`: `formatSearch` already
  // percent-encodes, and the serializer would encode it a second time.
  const query = `?where=${where}&sort_by=start&limit=${limit}`;

  // The collection route is `/event` on every instance we know of; `/events` is
  // only a fallback in case a village fronts its API with the plural.
  for (const path of ['/event', '/events']) {
    try {
      const { data } = await axios.get(`${base}${path}${query}`, {
        timeout: 8000,
      });
      const results = data?.results || data;
      if (Array.isArray(results)) return results as VillageEvent[];
    } catch {
      // Try the next spelling; an unreachable village just shows no events.
    }
  }
  return [];
}

/**
 * The ways a person can be tied to a village, in the order they should be
 * displayed: the strongest standing first.
 */
export type VillageConnectionRole =
  | 'ambassador'
  | 'manager'
  | 'creator'
  | 'referrer';

export type VillageConnection = {
  village: Village;
  roles: VillageConnectionRole[];
};

export function getVillageConnectionRoles(
  village: Village,
  userId?: string,
): VillageConnectionRole[] {
  if (!userId) return [];
  const roles: VillageConnectionRole[] = [];
  if (village.ambassadorId === userId) roles.push('ambassador');
  if (village.managedBy?.includes(userId)) roles.push('manager');
  if (village.createdBy === userId) roles.push('creator');
  if (village.referredBy === userId) roles.push('referrer');
  return roles;
}

/**
 * All the villages a person is tied to, with how. Pulls the directory and
 * filters client-side because the connection lives in four different fields.
 */
export async function fetchUserVillageConnections(
  userId?: string,
): Promise<VillageConnection[]> {
  if (!userId) return [];
  const all = await fetchVillages({ limit: 200 });
  return all
    .map((village) => ({
      village,
      roles: getVillageConnectionRoles(village, userId),
    }))
    .filter((connection) => connection.roles.length > 0);
}

async function fetchUsers(where: Record<string, unknown>): Promise<User[]> {
  try {
    const { data } = await api.get(`/user?where=${formatSearch(where)}`, {
      params: { limit: 200 },
    });
    const results = data?.results || data;
    return Array.isArray(results) ? (results as User[]) : [];
  } catch {
    return [];
  }
}

/** Candidates for the coordinator picker. */
export async function fetchAmbassadors(): Promise<User[]> {
  return fetchUsers({ roles: { $in: [AMBASSADOR_ROLE] } });
}

/** Resolves `village.managedBy` ids into users so they can be named in the UI. */
export async function fetchUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  return fetchUsers({ _id: { $in: ids } });
}

/**
 * Who may set the verification badge and assign coordinators: platform admins,
 * plus the ambassadors explicitly assigned to this village. Deliberately
 * narrower than `canManageVillage`, which also lets the original creator in.
 */
export function canCoordinateVillage(
  village: Village | null | undefined,
  userId?: string,
  isAdmin?: boolean,
): boolean {
  if (isAdmin) return true;
  if (!village || !userId) return false;
  return Boolean(village.managedBy?.includes(userId));
}

/**
 * Who may see the internal parts of the village form: the fit checklist that
 * decides whether a village is pre-assessed, and the project manager card.
 * Village owners edit their own listing without either.
 */
export function canReviewVillage(roles?: string[]): boolean {
  return Boolean(roles?.some((role) => VILLAGE_REVIEWER_ROLES.includes(role)));
}

const SOCIAL_BASE_URLS: Record<VillageSocialNetwork, string> = {
  instagram: 'https://instagram.com/',
  twitter: 'https://x.com/',
  facebook: 'https://facebook.com/',
};

/**
 * The form takes whatever the village types — `@handle`, `instagram.com/handle`
 * or a full URL — so the handle is normalised here rather than at input time.
 */
export function villageSocialUrl(
  network: VillageSocialNetwork,
  value?: string,
): string | null {
  const handle = value?.trim();
  if (!handle) return null;
  if (/^https?:\/\//i.test(handle)) return handle;
  const cleaned = handle
    .replace(/^@/, '')
    .replace(/^(www\.)?(instagram|twitter|x|facebook)\.com\//i, '')
    .replace(/^\/+/, '');
  return cleaned ? `${SOCIAL_BASE_URLS[network]}${cleaned}` : null;
}

export function canManageVillage(
  village: Village | null | undefined,
  userId?: string,
): boolean {
  if (!village || !userId) return false;
  if (village.createdBy === userId) return true;
  return Boolean(village.managedBy?.includes(userId));
}

/**
 * Whether this village is still eligible to ask for a deploy: managed by the
 * user, and not yet handed to the deploy queue. The member-side subscription
 * requirement is layered on top by the page — this only answers for the
 * village's own stage.
 */
export function canRequestDeploy(
  village: Village | null | undefined,
  userId?: string,
): boolean {
  if (!canManageVillage(village, userId) || !village) return false;
  const status = village.onboardingStatus;
  return (
    status === 'subscribed' ||
    status === 'pre_assessed' ||
    status === 'map_only'
  );
}
