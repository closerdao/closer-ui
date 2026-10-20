import type { FinanceApplicationCreateRequest } from '../types/subscriptions';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type FinancedPlan = Awaited<ReturnType<typeof trpc.token.cancelFinance.mutate>>;

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
