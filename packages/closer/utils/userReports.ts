import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

export type UserReport = { reason: string; unsafe: boolean };

// Whether the signed-in member has reported this user.
export const fetchIsReported = async (userId: string): Promise<boolean> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.get(`/report/user/${userId}`);
    return Boolean(data?.results?.reported);
  }
  const result = await trpc.userReport.mine
    .query({ userId })
    .catch(throwApiError);
  return Boolean(result?.reported);
};

export const createUserReport = async (
  userId: string,
  report: UserReport,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.post(`/report/user/${userId}`, report);
    return;
  }
  await trpc.userReport.create
    .mutate({ userId, ...report })
    .catch(throwApiError);
};

export const withdrawReport = async (userId: string): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.delete(`/report/user/${userId}`);
    return;
  }
  await trpc.userReport.withdraw.mutate({ userId }).catch(throwApiError);
};
