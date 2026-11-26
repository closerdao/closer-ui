import type { FinanceApplicationCreateRequest } from '../types/subscriptions';
import type { TokenGraphResponse } from '../types/token';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type FinancedPlan = Awaited<ReturnType<typeof trpc.token.cancelFinance.mutate>>;

type TokenStats = Awaited<ReturnType<typeof trpc.token.stats.query>>;

// Legacy `GET /token/stats`; `tokenHolders` is null where the explorer count is unparseable.
export const fetchTokenStats = async (): Promise<TokenStats> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/token/stats');
    return res.data;
  }
  return trpc.token.stats.query().catch(throwApiError);
};

// Legacy `GET /token/graph`.
export const fetchTokenGraph = async (): Promise<TokenGraphResponse> => {
  if (!isTrpcEnabled('13.0b')) {
    const res = await api.get<TokenGraphResponse>('/token/graph');
    return res.data;
  }
  return trpc.token.graph.query().catch(throwApiError);
};

export type FinanceDistributionRequest = {
  amount: number;
  txHash: string;
  date?: string;
};

// Legacy `POST /token/finance-application`; the server prices the plan, so the UI's `downPaymentAmount` and `aprPercent` are dropped over tRPC.
export const applyForFinance = async (
  body: FinanceApplicationCreateRequest,
): Promise<{ status: 'success'; memoCode: string }> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/token/finance-application', body);
    return res.data;
  }
  return trpc.token.applyForFinance
    .mutate({
      tokensToFinance: body.tokensToFinance,
      totalToPayInFiat: body.totalToPayInFiat,
      iban: body.iban,
      durationInMonths: body.durationInMonths,
      monthlyPaymentAmount: body.monthlyPaymentAmount,
      isCitizenApplication: body.isCitizenApplication,
      why: body.why,
    })
    .catch(throwApiError);
};

// Legacy `POST /token/finance/:id/cancel`; resolves the plan, `{}` where the caller may not read it.
export const cancelFinance = async (
  id: string,
  reason: string,
): Promise<FinancedPlan> => {
  if (!isTrpcEnabled()) {
    const res = await api.post(
      `/token/finance/${encodeURIComponent(id)}/cancel`,
      { reason },
    );
    return res.data.results;
  }
  return trpc.token.cancelFinance.mutate({ id, reason }).catch(throwApiError);
};

// Legacy `POST /token/financeapplication/:id/token-distribution`; resolves the updated plan.
export const distributeFinanced = async (
  id: string,
  body: FinanceDistributionRequest,
): Promise<FinancedPlan> => {
  if (!isTrpcEnabled()) {
    const res = await api.post(
      `/token/financeapplication/${id}/token-distribution`,
      body,
    );
    return res.data.results;
  }
  return trpc.token.distributeFinanced
    .mutate({ id, ...body })
    .catch(throwApiError);
};

type BankTransferApplicationInput = Parameters<
  typeof trpc.token.bankTransferApplication.mutate
>[0];

// Legacy `POST /token/bank-transfer-application`; resolves to the legacy body `{ status, memoCode }`.
export const postBankTransferApplication = async (
  body: BankTransferApplicationInput,
): Promise<{ status?: string; memoCode?: unknown }> => {
  if (!isTrpcEnabled('12.8a')) {
    const res = await api.post('/token/bank-transfer-application', body);
    return res.data;
  }
  return trpc.token.bankTransferApplication.mutate(body).catch(throwApiError);
};

// Legacy `POST /token-distribution-confirmation`; true where legacy answered 200.
export const confirmTokenDistribution = async (body: {
  saleId: string;
  txHash: string;
}): Promise<boolean> => {
  if (!isTrpcEnabled('12.8a')) {
    const res = await api.post('/token-distribution-confirmation', body);
    return res.status === 200;
  }
  await trpc.token.confirmDistribution.mutate(body).catch(throwApiError);
  return true;
};
