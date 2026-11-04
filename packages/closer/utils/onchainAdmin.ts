import {
  TokenDistributionStatus,
  TokenUserResult,
} from '../types/onchainAdmin';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

export const getDistributionBatches = async (
  chainId: number,
  saleIds: string,
): Promise<TokenDistributionStatus[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/safe/token-distribution-batches', {
      params: { chainId, saleIds },
      cache: false,
    } as any);
    return res.data.results ?? res.data;
  }
  return (await trpc.safe.distributionBatches
    .query({ chainId, saleIds })
    .catch(throwApiError)) as TokenDistributionStatus[];
};

export const getRecipients = async (params: {
  ids?: string;
  q?: string;
  limit?: number;
}): Promise<TokenUserResult[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/onchain-admin/recipients', { params });
    return res.data.results || [];
  }
  return (await trpc.onchainAdmin.recipients
    .query(params)
    .catch(throwApiError)) as TokenUserResult[];
};
