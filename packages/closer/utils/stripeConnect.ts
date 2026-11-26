import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

const GROUP = '12.7a';

export const fetchStripeConnectStatus = async (): Promise<unknown> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.get('/stripe/connect/status');
    return res?.data?.results;
  }
  return trpc.stripeConnect.status.query().catch(throwApiError);
};

export const setDefaultStripeAccount = async (id: string): Promise<unknown> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.post(`/stripe/connect/accounts/${id}/default`);
    return res?.data?.results;
  }
  return trpc.stripeConnect.setDefault.mutate({ id }).catch(throwApiError);
};

export const renameStripeAccount = async (
  id: string,
  label: string,
): Promise<unknown> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.patch(`/stripe/connect/accounts/${id}`, { label });
    return res?.data?.results;
  }
  return trpc.stripeConnect.update.mutate({ id, label }).catch(throwApiError);
};

export type StripeConnectCompleteResult = {
  connectedAccountId?: unknown;
  webhookId?: unknown;
  connectStatus?: string;
  name?: unknown;
};

export const completeStripeConnect = async (
  code: string,
  redirectUri: string,
): Promise<StripeConnectCompleteResult | undefined> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.post('/stripe/connect/complete', {
      code,
      redirectUri,
    });
    return res?.data?.results;
  }
  return trpc.stripeConnect.complete
    .mutate({ code, redirectUri })
    .catch(throwApiError);
};

export const disconnectStripeAccount = async (id: string): Promise<unknown> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.delete(`/stripe/connect/accounts/${id}`);
    return res?.data?.results;
  }
  return trpc.stripeConnect.remove.mutate({ id }).catch(throwApiError);
};
