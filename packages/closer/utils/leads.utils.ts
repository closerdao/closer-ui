import { AMBASSADOR_ROLE } from '../constants/village.constants';
import { User } from '../contexts/auth/types';
import {
  Lead,
  LeadActionsVocabulary,
  LeadEmailBatchParams,
  LeadEmailBatchResult,
  LeadEmailPreview,
  LeadFitCheck,
  LeadsBoardParams,
} from '../types/lead';
import api, { formatSearch, invalidateGetCache } from './api';
import { fitCheckFromResponse, leadsFromResponse } from './leads.helpers';

export const LEADS_ENDPOINT = '/leads';

/**
 * Roles offered in the owner picker. Ambassadors do the calls; team and admin
 * are here so a manager can hold a lead themselves rather than parking it.
 */
export const LEAD_OWNER_ROLES = [AMBASSADOR_ROLE, 'team', 'admin'];

/** Drops the cached board reads so the next load sees a mutation. */
const refreshBoard = () => invalidateGetCache(LEADS_ENDPOINT);

/** One lead by id. Used when a deep link points at a row the page has not loaded. */
export async function fetchLead(id: string): Promise<Lead | null> {
  try {
    const { data } = await api.get(`${LEADS_ENDPOINT}/${id}`, {
      cache: false,
    } as any);
    const raw = data?.results ?? data;
    const result = Array.isArray(raw) ? raw[0] : raw;
    return result && typeof result === 'object' && result._id
      ? (result as Lead)
      : null;
  } catch {
    return null;
  }
}

/** Drops empty values so the API applies its defaults instead of filtering on ''. */
function dropEmpty(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
}

/**
 * The board, already scoped by the API: a manager gets everything, anyone else
 * gets the leads assigned to them. Errors are thrown rather than swallowed so
 * the page can tell "no leads" apart from "the request failed".
 */
export async function fetchLeadsBoard(
  params: LeadsBoardParams,
): Promise<{ rows: Lead[]; total: number }> {
  const { data } = await api.get(LEADS_ENDPOINT, {
    params: dropEmpty(params as Record<string, unknown>),
    // Skips the shared GET cache: the board has to reflect a mutation made a
    // moment ago rather than the five-minute-old copy.
    cache: false,
  } as any);
  return leadsFromResponse(data);
}

export async function patchLead(
  id: string,
  payload: Record<string, unknown>,
): Promise<Lead | null> {
  const { data } = await api.patch(`${LEADS_ENDPOINT}/${id}`, payload);
  refreshBoard();
  return (data?.results as Lead) ?? null;
}

/** Re-runs the enrichment job for one lead. Admin and team only. */
export async function enrichLead(id: string): Promise<void> {
  await api.post(`${LEADS_ENDPOINT}/${id}/enrich`, {});
  refreshBoard();
}

/** Rebuilds the links between leads and the records they point at. */
export async function syncLeads(): Promise<void> {
  await api.post(`${LEADS_ENDPOINT}/sync`, {});
  refreshBoard();
}

/**
 * The village's fit check with the explanation behind the verdict. Read on
 * demand when a card opens; a failure leaves the card with the bare verdict
 * rather than breaking the board.
 */
export async function fetchVillageFit(
  villageId: string,
): Promise<LeadFitCheck | null> {
  try {
    const { data } = await api.get(`/village/${villageId}/fit`, {
      // The questionnaire may have changed since the board was cached.
      cache: false,
    } as any);
    return fitCheckFromResponse(data);
  } catch {
    return null;
  }
}

async function fetchUsers(where: Record<string, unknown>): Promise<User[]> {
  try {
    const { data } = await api.get(`/user?where=${formatSearch(where)}`, {
      params: { limit: 200 },
    });
    const results = data?.results || data;
    return Array.isArray(results) ? (results as User[]) : [];
  } catch {
    // The picker is an affordance, not the page — a failure leaves it empty.
    return [];
  }
}

export async function fetchLeadOwnerCandidates(): Promise<User[]> {
  return fetchUsers({ roles: { $in: LEAD_OWNER_ROLES } });
}

/** Resolves owner ids into users so the board can name them. */
export async function fetchLeadOwners(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  return fetchUsers({ _id: { $in: ids } });
}

/**
 * The action vocabulary — statuses, channels and email templates — so the
 * page never hard-codes an enum the API owns. Readable by anyone.
 */
export async function fetchLeadActions(): Promise<LeadActionsVocabulary> {
  const { data } = await api.get(`${LEADS_ENDPOINT}/actions`);
  const body = data?.results ?? data;
  return body && typeof body === 'object'
    ? (body as LeadActionsVocabulary)
    : {};
}

/** The batch as query params: `leadIds` is comma-separated on the GET. */
function emailBatchParams(
  params: LeadEmailBatchParams,
): Record<string, unknown> {
  const { leadIds, ...rest } = params;
  return dropEmpty({
    ...rest,
    ...(leadIds?.length ? { leadIds: leadIds.join(',') } : {}),
  });
}

/**
 * Who would get the template and the email as one of them would see it. The
 * same parameters as the send, so what is previewed is what goes out.
 */
export async function previewLeadEmail(
  params: LeadEmailBatchParams,
): Promise<LeadEmailPreview> {
  const { data } = await api.get(`${LEADS_ENDPOINT}/email`, {
    params: emailBatchParams(params),
    cache: false,
  } as any);
  return (data?.results as LeadEmailPreview) ?? {};
}

/**
 * Sends the template to every lead who has not had it. The API excludes anyone
 * already sent it, so calling again is safe until `candidates` is 0.
 */
export async function sendLeadEmail(
  params: LeadEmailBatchParams,
): Promise<LeadEmailBatchResult> {
  // `sampleId` picks who the preview renders; it means nothing to a send.
  const { leadIds, sampleId: _sampleId, ...rest } = params;
  const { data } = await api.post(`${LEADS_ENDPOINT}/email`, {
    ...dropEmpty(rest as Record<string, unknown>),
    ...(leadIds?.length ? { leadIds } : {}),
  });
  refreshBoard();
  return (data?.results as LeadEmailBatchResult) ?? {};
}
