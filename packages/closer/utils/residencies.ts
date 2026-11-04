import type {
  ResidencyAgreement,
  ResidencyAgreementStatus,
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
