import {
  SafeProposalResult,
  TokenDistributionStatus,
  TokenUserResult,
} from '../types/onchainAdmin';
import api from './api';
import { isTrpcEnabled, throwApiError, toApiError, trpc } from './trpc';

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

const WRITES_GROUP = '13.0d';

type ProposeInput = Parameters<typeof trpc.safe.propose.mutate>[0];
type CreateBatchInput = Parameters<
  typeof trpc.safe.createDistributionBatch.mutate
>[0];
type SyncBatchesInput = Parameters<
  typeof trpc.safe.syncDistributionBatches.mutate
>[0];

// tRPC carries legacy's `code` and error details in `data.debug`; getApiErrorDetails reads them off an axios error body.
const throwOnchainError = (error: unknown): never => {
  const apiError = toApiError(error) as { response?: { data: object } };
  if (apiError.response) {
    Object.assign(
      apiError.response.data,
      (error as { data?: { debug?: object } }).data?.debug,
    );
  }
  throw Object.assign(apiError, { isAxiosError: true });
};

// Legacy `POST /safe/proposals`; resolves to its `results`.
export const postSafeProposal = async (
  input: ProposeInput,
): Promise<SafeProposalResult> => {
  if (!isTrpcEnabled(WRITES_GROUP)) {
    const res = await api.post('/safe/proposals', input);
    return res.data.results ?? res.data;
  }
  return (await trpc.safe.propose
    .mutate(input)
    .catch(throwOnchainError)) as SafeProposalResult;
};

// Legacy `POST /safe/token-distribution-batches`; resolves to its `results`.
export const postDistributionBatch = async (input: CreateBatchInput) => {
  if (!isTrpcEnabled(WRITES_GROUP)) {
    const res = await api.post('/safe/token-distribution-batches', input);
    return res.data.results ?? res.data;
  }
  return trpc.safe.createDistributionBatch
    .mutate(input)
    .catch(throwOnchainError);
};

// Legacy `POST /safe/token-distribution-batches/sync`; resolves to its `results`.
export const postDistributionBatchSync = async (input: SyncBatchesInput) => {
  if (!isTrpcEnabled(WRITES_GROUP)) {
    const res = await api.post('/safe/token-distribution-batches/sync', input);
    return res.data.results ?? res.data;
  }
  return trpc.safe.syncDistributionBatches
    .mutate(input)
    .catch(throwOnchainError);
};
