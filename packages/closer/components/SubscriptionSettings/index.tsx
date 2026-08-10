import Link from 'next/link';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useActiveSubscription } from '../../hooks/useActiveSubscription';
import { SubscriptionsConfig } from '../../types/subscriptions';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { getPaidSubscriptionPlans } from '../../utils/subscriptions.helpers';
import SubscriptionManageCard from '../SubscriptionManageCard';
import { LinkButton } from '../ui';

/**
 * Managing an existing membership: change plan, cancel, resume. Lives in the
 * settings tabs rather than on /subscriptions, where a membership card above
 * the plan comparison table read as two competing offers.
 */
const SubscriptionSettings = () => {
  const t = useTranslations();
  const { user } = useAuth();

  const subscriptionsConfig = getCachedConfig('subscriptions') as
    | SubscriptionsConfig
    | null;
  const paymentConfig = getCachedConfig('payment') as {
    fiatCur?: string;
    utilityFiatCur?: string;
  } | null;

  const currency =
    paymentConfig?.fiatCur || paymentConfig?.utilityFiatCur || 'EUR';

  const plans = useMemo(
    () => getPaidSubscriptionPlans(subscriptionsConfig),
    [subscriptionsConfig],
  );

  const {
    userActivePlan,
    hasActiveSubscription,
    isCancelled,
    validUntil,
    actionState,
    clearActionError,
    changePlan,
    cancel,
    resume,
  } = useActiveSubscription(plans);

  const otherPlans = useMemo(
    () => plans.filter((plan) => plan.priceId !== userActivePlan?.priceId),
    [plans, userActivePlan],
  );

  if (!hasActiveSubscription) {
    return (
      <div className="flex flex-col gap-4">
        <p>{t('subscriptions_settings_no_membership')}</p>
        <LinkButton href="/subscriptions" isFullWidth={false} size="small">
          {t('subscriptions_settings_view_plans_button')}
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SubscriptionManageCard
        activePlan={userActivePlan}
        planTitleFallback={user?.subscription?.plan}
        price={user?.subscription?.monthlyPrice?.val}
        currency={currency}
        validUntil={validUntil}
        isCancelled={isCancelled}
        isBusy={actionState.isBusy}
        error={actionState.error}
        otherPlans={otherPlans}
        onChangePlan={changePlan}
        onCancel={cancel}
        onResume={resume}
        onDismissError={clearActionError}
      />
      <Link href="/subscriptions" className="text-sm underline w-fit">
        {t('subscriptions_compare_title')}
      </Link>
    </div>
  );
};

export default SubscriptionSettings;
