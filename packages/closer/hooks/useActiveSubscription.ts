import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/router';

import { useAuth } from '../contexts/auth';
import { SubscriptionPlan } from '../types/subscriptions';
import api from '../utils/api';
import { logMetric } from '../utils/metrics';
import { parseMessageFromError } from '../utils/common';
import {
  SubscriptionActionUnavailableError,
  cancelSubscription,
  changeSubscriptionPlan,
  resumeSubscription,
} from '../utils/subscriptionActions';

export type SubscriptionActionState = {
  isBusy: boolean;
  error: string | null;
};

/**
 * Resolves the plan the logged in user is currently subscribed to, and exposes
 * the actions a subscriber needs: switch plan, cancel, resume, or open the
 * Stripe customer portal.
 *
 * `hasActiveSubscription` stays true even when the subscribed priceId is no
 * longer part of the configured plans, so an existing subscriber is never shown
 * a "Subscribe" button after a plan is renamed or retired.
 *
 * Change/cancel/resume call the platform API. Until the backend ships those
 * endpoints (see docs/tickets/subscription-self-service-api.md) the calls fail
 * with SubscriptionActionUnavailableError and we fall back to the Stripe
 * customer portal, so the flow always completes.
 */
export const useActiveSubscription = (plans: SubscriptionPlan[] = []) => {
  const router = useRouter();
  const { user, refetchUser } = useAuth();
  const [userActivePlan, setUserActivePlan] = useState<SubscriptionPlan>();
  const [actionState, setActionState] = useState<SubscriptionActionState>({
    isBusy: false,
    error: null,
  });

  const hasActiveSubscription = useMemo(
    () =>
      Boolean(
        user?.subscription?.plan &&
          user?.subscription?.priceId &&
          user.subscription.priceId !== 'free' &&
          new Date(user?.subscription?.validUntil || '') > new Date(),
      ),
    [user],
  );

  const isCancelled = useMemo(
    () => hasActiveSubscription && Boolean(user?.subscription?.cancelledAt),
    [hasActiveSubscription, user],
  );

  const validUntil = user?.subscription?.validUntil
    ? new Date(user.subscription.validUntil)
    : null;

  useEffect(() => {
    if (!hasActiveSubscription) {
      setUserActivePlan(undefined);
      return;
    }

    const selectedSubscription = plans.find(
      (plan) =>
        plan.priceId === user?.subscription?.priceId ||
        plan.priceId?.includes(user?.subscription?.priceId || ''),
    );
    setUserActivePlan(selectedSubscription);
  }, [user, plans, hasActiveSubscription]);

  const openCustomerPortal = useCallback(async () => {
    void logMetric({
      event: 'manage-subscription-button-click',
      category: 'subscriptions',
      value: 'manage',
    });

    const response = await api.get(
      '/stripe/create-customer-portal?email=' +
        encodeURIComponent(user?.email || ''),
    );
    const portalUrl = response.data.sessionUrl;
    router.push(portalUrl);
  }, [router, user]);

  /**
   * Runs an in-page subscription action, refreshing the user afterwards so the
   * page reflects the new state without a reload. Falls back to the Stripe
   * portal when the platform has no endpoint for the action yet.
   */
  const runAction = useCallback(
    async (
      metricValue: string,
      action: () => Promise<unknown>,
    ): Promise<boolean> => {
      setActionState({ isBusy: true, error: null });
      try {
        await action();
        void logMetric({
          event: `subscription-${metricValue}`,
          category: 'subscriptions',
          value: metricValue,
        });
        await refetchUser?.();
        setActionState({ isBusy: false, error: null });
        return true;
      } catch (error: unknown) {
        if (error instanceof SubscriptionActionUnavailableError) {
          setActionState({ isBusy: false, error: null });
          await openCustomerPortal();
          return false;
        }
        setActionState({
          isBusy: false,
          error: parseMessageFromError(error),
        });
        return false;
      }
    },
    [openCustomerPortal, refetchUser],
  );

  const changePlan = useCallback(
    (plan: SubscriptionPlan) => {
      const priceId = plan.priceId?.includes(',')
        ? plan.priceId.split(',')[0]
        : plan.priceId;
      return runAction('change-plan', async () => {
        // Picking a new plan means the member is staying, so clear the pending
        // cancellation first — otherwise they would switch and still lose the
        // membership at the end of the period. Resuming first also means a
        // failure here leaves the subscription untouched rather than half
        // migrated.
        if (isCancelled) {
          await resumeSubscription();
        }
        return changeSubscriptionPlan(priceId);
      });
    },
    [isCancelled, runAction],
  );

  const cancel = useCallback(
    () => runAction('cancel', () => cancelSubscription(true)),
    [runAction],
  );

  const resume = useCallback(
    () => runAction('resume', () => resumeSubscription()),
    [runAction],
  );

  const clearActionError = useCallback(
    () => setActionState((state) => ({ ...state, error: null })),
    [],
  );

  return {
    userActivePlan,
    hasActiveSubscription,
    isCancelled,
    validUntil,
    actionState,
    clearActionError,
    changePlan,
    cancel,
    resume,
    openCustomerPortal,
  };
};
