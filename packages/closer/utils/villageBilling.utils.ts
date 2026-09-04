import { VILLAGE_COLLECTION } from '../constants/village.constants';
import api from './api';

/**
 * Village billing credentials — the shared secret a deployed village signs its
 * platform-fee reports with. Admin-only, and deliberately kept off the
 * `Village` object: `billing` is `protected` on the model, so it never appears
 * in any village payload and must be fetched through the routes below.
 *
 * `none` is the normal state of every village that predates the deploy
 * pipeline issuing credentials automatically — not an error.
 */
export type VillageBillingStatus = 'none' | 'active' | 'suspended' | 'revoked';

export type VillageBillingSummary = {
  villageId: string;
  hubUrl: string | null;
  status: VillageBillingStatus;
  issuedAt: string | null;
  rotatedAt: string | null;
  /** Redundant with `status !== 'none'`, and there so nothing has to infer it. */
  hasSecret: boolean;
};

export type VillageBillingCredentials = {
  villageId: string;
  hubUrl: string | null;
  /**
   * Plaintext, and returned by the rotate route alone — nothing else in the
   * system ever hands it back. Never log it, never put it in a URL.
   */
  secret: string;
};

/**
 * Mirrors `DeployVillageError`: keeps the API's own text, because the status
 * route's refusals (409 on a village with no credentials) say more than
 * anything this layer could invent.
 */
export class VillageBillingError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'VillageBillingError';
    this.status = status;
    this.code = code;
  }
}

function toVillageBillingError(err: unknown): VillageBillingError {
  const response = (
    err as { response?: { status?: number; data?: Record<string, any> } }
  ).response;
  const body = response?.data;
  const message =
    (typeof body?.error === 'string' && body.error) ||
    (typeof body?.error?.message === 'string' && body.error.message) ||
    (typeof body?.message === 'string' && body.message) ||
    (err instanceof Error ? err.message : 'Billing request failed');
  const code =
    (typeof body?.code === 'string' && body.code) ||
    (typeof body?.error?.code === 'string' && body.error.code) ||
    undefined;
  return new VillageBillingError(message, response?.status ?? 0, code);
}

const billingPath = (villageId: string) =>
  `/${VILLAGE_COLLECTION}/${villageId}/billing`;

export async function fetchVillageBilling(
  villageId: string,
): Promise<VillageBillingSummary> {
  try {
    const { data } = await api.get(billingPath(villageId));
    return (data?.results || data) as VillageBillingSummary;
  } catch (err) {
    throw toVillageBillingError(err);
  }
}

/**
 * Issues a village's first secret, or replaces the one it has. The only call in
 * the system that answers with the plaintext secret — if the admin loses it,
 * the only recovery is rotating again, which invalidates the one they lost.
 *
 * The response deliberately carries no `issuedAt`/`rotatedAt`: refetch the
 * summary afterwards rather than patching local state from this.
 */
export async function rotateVillageBilling(
  villageId: string,
): Promise<VillageBillingCredentials> {
  try {
    const { data } = await api.post(`${billingPath(villageId)}/rotate`, {});
    return (data?.results || data) as VillageBillingCredentials;
  } catch (err) {
    throw toVillageBillingError(err);
  }
}

/**
 * Suspends, reactivates or revokes billing. Answers 409 on a village that has
 * never had credentials, so the panel offers rotate as the only first action.
 */
export async function setVillageBillingStatus(
  villageId: string,
  status: Exclude<VillageBillingStatus, 'none'>,
): Promise<VillageBillingSummary> {
  try {
    const { data } = await api.post(`${billingPath(villageId)}/status`, {
      status,
    });
    return (data?.results || data) as VillageBillingSummary;
  } catch (err) {
    throw toVillageBillingError(err);
  }
}
