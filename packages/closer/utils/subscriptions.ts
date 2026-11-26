import { SubscriptionPlansSyncRequest } from '../types/subscriptions';
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

const CHECKOUT_GROUP = '12.8a';

type CreateSubscriptionInput = Parameters<
  typeof trpc.subscription.create.mutate
>[0];
type ValidateSubscriptionInput = Parameters<
  typeof trpc.subscription.validate.mutate
>[0];
type ValidateSubscriptionResult = Awaited<
  ReturnType<typeof trpc.subscription.validate.mutate>
>;

// Legacy `POST /subscription`; resolves to its `results`.
export const postSubscription = async (input: CreateSubscriptionInput) => {
  if (!isTrpcEnabled(CHECKOUT_GROUP)) {
    const res = await api.post('/subscription', input);
    return res.data.results;
  }
  return trpc.subscription.create.mutate(input).catch(throwApiError);
};

// Legacy `POST /subscription/validation`; resolves to its `results`.
export const postSubscriptionValidation = async (
  input: ValidateSubscriptionInput,
): Promise<ValidateSubscriptionResult> => {
  if (!isTrpcEnabled(CHECKOUT_GROUP)) {
    const res = await api.post('/subscription/validation', input);
    return res.data.results;
  }
  return trpc.subscription.validate.mutate(input).catch(throwApiError);
};

// Legacy `POST /stripe/change-subscription`; resolves to the legacy body `{ results }`.
export const postChangeSubscription = async (priceId: string) => {
  if (!isTrpcEnabled(CHECKOUT_GROUP)) {
    const res = await api.post('/stripe/change-subscription', { priceId });
    return res.data;
  }
  const results = await trpc.subscription.change
    .mutate({ priceId })
    .catch(throwApiError);
  return { results };
};

// Legacy `POST /stripe/resume-subscription`; resolves to the legacy body `{ results }`.
export const postResumeSubscription = async () => {
  if (!isTrpcEnabled(CHECKOUT_GROUP)) {
    const res = await api.post('/stripe/resume-subscription');
    return res.data;
  }
  const results = await trpc.subscription.resume
    .mutate({})
    .catch(throwApiError);
  return { results };
};

// Legacy `GET /stripe/create-customer-portal`; the API ignores the email and uses the session's.
export const fetchCustomerPortalUrl = async (
  email: string,
): Promise<string> => {
  if (!isTrpcEnabled(CHECKOUT_GROUP)) {
    const res = await api.get(
      '/stripe/create-customer-portal?email=' + encodeURIComponent(email),
    );
    return res.data.sessionUrl;
  }
  const { sessionUrl } = await trpc.subscription.customerPortal
    .query()
    .catch(throwApiError);
  return sessionUrl;
};

const PLANS_SYNC_GROUP = '13.0c';

// Legacy `POST /stripe/subscription-plans/sync`; resolves to the response body.
export const postSubscriptionPlansSync = async (
  payload: SubscriptionPlansSyncRequest,
): Promise<unknown> => {
  if (!isTrpcEnabled(PLANS_SYNC_GROUP)) {
    const res = await api.post('/stripe/subscription-plans/sync', payload);
    return res?.data;
  }
  return trpc.subscription.syncPlans
    .mutate({ ...payload })
    .catch(throwApiError);
};
