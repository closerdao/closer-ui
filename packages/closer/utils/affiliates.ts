import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

export type AffiliateResult = {
  userId: string;
  affiliate: string | null;
  affiliateApplication: Record<string, unknown> | null;
};

// Legacy `POST /affiliates/apply`: `reason` plus the form's free-form answers.
export const submitAffiliateApplication = async (
  answers: { reason: string } & Record<string, unknown>,
): Promise<AffiliateResult> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/affiliates/apply', answers);
    return res.data.results;
  }
  return trpc.affiliate.submitApplication.mutate(answers).catch(throwApiError);
};

export const approveAffiliate = async (
  userId: string,
): Promise<AffiliateResult> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/affiliates/approve', { userId });
    return res.data.results;
  }
  return trpc.affiliate.approve.mutate({ userId }).catch(throwApiError);
};

// Declines an application or ends an affiliate.
export const removeAffiliate = async (
  userId: string,
): Promise<AffiliateResult> => {
  if (!isTrpcEnabled()) {
    const res = await api.post('/affiliates/remove', { userId });
    return res.data.results;
  }
  return trpc.affiliate.remove.mutate({ userId }).catch(throwApiError);
};
