import api from './api';

/**
 * Thrown when the platform API does not implement a subscription action yet.
 * Callers fall back to the Stripe customer portal so the user is never stuck.
 */
export class SubscriptionActionUnavailableError extends Error {
  constructor(action: string) {
    super(`Subscription action "${action}" is not available on this platform`);
    this.name = 'SubscriptionActionUnavailableError';
  }
}

const UNAVAILABLE_STATUSES = [404, 405, 501];

const isUnavailable = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  return typeof status === 'number' && UNAVAILABLE_STATUSES.includes(status);
};

const call = async <T>(action: string, request: () => Promise<T>): Promise<T> => {
  try {
    return await request();
  } catch (error: unknown) {
    if (isUnavailable(error)) {
      throw new SubscriptionActionUnavailableError(action);
    }
    throw error;
  }
};

/**
 * Switch the active subscription to another plan. The backend is expected to
 * apply Stripe proration and return the updated subscription.
 */
export const changeSubscriptionPlan = (priceId: string) =>
  call('change', () =>
    api.post('/stripe/change-subscription', { priceId }).then((res) => res.data),
  );

/**
 * Cancel the active subscription. Defaults to cancelling at the end of the paid
 * period so the member keeps what they already paid for.
 */
export const cancelSubscription = (atPeriodEnd = true) =>
  call('cancel', () =>
    api
      .post('/stripe/cancel-subscription', { atPeriodEnd })
      .then((res) => res.data),
  );

/** Undo a pending cancellation before the period ends. */
export const resumeSubscription = () =>
  call('resume', () =>
    api.post('/stripe/resume-subscription').then((res) => res.data),
  );
