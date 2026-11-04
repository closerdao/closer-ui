import type { User } from '../contexts/auth/types';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

export type CitizenApplyResult = { status: string };

export type HasStayedMinDurationResult = {
  hasStayedForMinDuration: boolean;
  totalNights: number;
  minStayDuration: number;
};

export type IsVouchedResult = { isVouched: boolean };

export type VouchResult = { results: { user: User } };

// Legacy `POST /subscription/citizen/apply`; a refusal rejects as a 400 with `response.data.error`.
export const submitCitizenApplication =
  async (): Promise<CitizenApplyResult> => {
    if (!isTrpcEnabled()) {
      const res = await api.post('/subscription/citizen/apply');
      return res.data;
    }
    return trpc.citizenship.submitApplication.mutate().catch(throwApiError);
  };

export const fetchHasStayedMinDuration =
  async (): Promise<HasStayedMinDurationResult> => {
    if (!isTrpcEnabled()) {
      const res = await api.get(
        '/subscription/citizen/check-has-stayed-for-min-duration',
      );
      return res.data;
    }
    return trpc.citizenship.hasStayedMinDuration.query().catch(throwApiError);
  };

export const fetchIsVouched = async (): Promise<IsVouchedResult> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/subscription/citizen/check-is-vouched');
    return res.data;
  }
  return trpc.citizenship.isVouched.query().catch(throwApiError);
};

export const vouchForUser = async (
  userId: string,
  message: string,
): Promise<VouchResult> => {
  if (!isTrpcEnabled()) {
    const res = await api.post(`/users/${userId}/vouch`, { message });
    return res.data;
  }
  const { user } = await trpc.citizenship.vouch
    .mutate({ userId, message })
    .catch(throwApiError);
  return { results: { user: user as unknown as User } };
};

export const updateVouchForUser = async (
  userId: string,
  message: string,
): Promise<VouchResult> => {
  if (!isTrpcEnabled()) {
    const res = await api.patch(`/users/${userId}/vouch`, { message });
    return res.data;
  }
  const { user } = await trpc.citizenship.updateVouch
    .mutate({ userId, message })
    .catch(throwApiError);
  return { results: { user: user as unknown as User } };
};

export const removeVouchForUser = async (
  userId: string,
): Promise<VouchResult> => {
  if (!isTrpcEnabled()) {
    const res = await api.delete(`/users/${userId}/vouch`);
    return res.data;
  }
  const { user } = await trpc.citizenship.removeVouch
    .mutate({ userId })
    .catch(throwApiError);
  return { results: { user: user as unknown as User } };
};
