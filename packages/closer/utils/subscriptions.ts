import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

const GROUP = '12.6a';

// Legacy `GET /subscription/intro-eligibility`, past the GET cache.
export const fetchIntroEligibility = async (): Promise<boolean> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.get('/subscription/intro-eligibility', {
      cache: false,
    } as any);
    return Boolean(res.data?.results?.eligibleForIntro);
  }
  const { eligibleForIntro } = await trpc.subscription.introEligibility
    .query()
    .catch(throwApiError);
  return eligibleForIntro;
};

// Legacy `POST /stripe/cancel-subscription`; resolves to the legacy body `{ results: { subscription } }`.
export const postCancelSubscription = async (atPeriodEnd: boolean) => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.post('/stripe/cancel-subscription', { atPeriodEnd });
    return res.data;
  }
  const results = await trpc.subscription.cancel
    .mutate({ atPeriodEnd })
    .catch(throwApiError);
  return { results };
};
