import type {
  ResidencyAgreement,
  ResidencyAgreementStatus,
  ResidencyAgreementSubmission,
} from '../types/residency';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

export type ResidencyListParams = {
  limit?: number;
  status?: ResidencyAgreementStatus;
  mine?: boolean;
};

// Legacy `GET /residencies`, uncached so a season just approved or ended reads fresh.
export const fetchResidencyAgreements = async (
  params: ResidencyListParams,
): Promise<ResidencyAgreement[]> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get('/residencies', {
      params,
      cache: false,
    } as any);
    return data?.results || [];
  }
  const results = await trpc.residency.list.query(params).catch(throwApiError);
  return results as unknown as ResidencyAgreement[];
};

// Legacy `POST /residencies/apply`; resolves to the filed `{ agreement, stay }`.
export const applyForResidency = async (
  submission: ResidencyAgreementSubmission,
) => {
  if (!isTrpcEnabled('11.4a')) {
    const { data } = await api.post('/residencies/apply', submission);
    return data?.results;
  }
  return trpc.residency.apply.mutate({ ...submission }).catch(throwApiError);
};

// Legacy `POST /residencies/:id/approve`; resolves to `{ agreement, stay }`.
export const approveResidency = async (id: string) => {
  if (!isTrpcEnabled('11.4a')) {
    const { data } = await api.post(`/residencies/${id}/approve`, {});
    return data?.results;
  }
  return trpc.residency.approve.mutate({ id }).catch(throwApiError);
};

// Legacy `POST /residencies/:id/cancel`; resolves to `{ agreement, stay, refund }`.
export const cancelResidency = async (id: string, reason?: string) => {
  if (!isTrpcEnabled('11.4a')) {
    const { data } = await api.post(
      `/residencies/${id}/cancel`,
      reason ? { reason } : {},
    );
    return data?.results;
  }
  return trpc.residency.cancel
    .mutate(reason ? { id, reason } : { id })
    .catch(throwApiError);
};
