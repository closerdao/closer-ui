import React, { useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useActiveSubscription } from '../../hooks/useActiveSubscription';
import {
  SubscriptionPlan,
  SubscriptionsConfig,
} from '../../types/subscriptions';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { getPaidSubscriptionPlans } from '../../utils/subscriptions.helpers';
import SubscriptionComparisonTable from '../SubscriptionComparisonTable';
import SubscriptionEditorial from '../SubscriptionEditorial';

interface Props {
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

/**
 * The plans on offer. Managing an existing membership lives on
 * /settings/subscription — a member landing here gets a pointer to it rather
 * than a second set of controls competing with the comparison table.
 */
const CustomSubscriptionPlans = (_props: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const subscriptionsConfig = getCachedConfig('subscriptions') as
    | SubscriptionsConfig
    | null;
  const paymentConfig = getCachedConfig('payment') as {
    fiatCur?: string;
    utilityFiatCur?: string;
  } | null;

  const currency =
    paymentConfig?.fiatCur || paymentConfig?.utilityFiatCur || 'EUR';

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const plans = useMemo(
    () => getPaidSubscriptionPlans(subscriptionsConfig),
    [subscriptionsConfig],
  );

  const {
    userActivePlan,
    hasActiveSubscription,
    isOnDeprecatedPlan,
    isOnLegacyPricing,
    isCancelled,
  } = useActiveSubscription(plans);

  if (!areSubscriptionsEnabled || !plans.length) {
    return null;
  }

  const isActivePlan = (plan: SubscriptionPlan) =>
    Boolean(userActivePlan && plan.priceId === userActivePlan.priceId);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    let priceId = plan.priceId;
    if (priceId?.includes(',')) {
      priceId = priceId.split(',')[0];
    }
    if (!isAuthenticated) {
      router.push(
        `/signup?back=${encodeURIComponent(
          `/subscriptions/checkout?priceId=${priceId}`,
        )}`,
      );
      return;
    }
    if (hasActiveSubscription) {
      // Switching, cancelling and resuming all happen in one place, so an
      // existing member is sent there instead of starting a second checkout.
      router.push('/settings/subscription');
      return;
    }
    router.push(`/subscriptions/checkout?priceId=${priceId}`);
  };

  const getCtaLabel = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      return t('subscriptions_create_account_button');
    }
    if (isActivePlan(plan)) {
      return t('subscriptions_current_plan_label');
    }
    if (hasActiveSubscription) {
      return t('subscriptions_manage_button');
    }
    return t('subscriptions_subscribe_button');
  };

  const singlePlan = plans.length === 1 ? plans[0] : null;
  const activePlanTitle = userActivePlan?.title || user?.subscription?.plan;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 flex flex-col gap-8">
        {hasActiveSubscription ? (
          <div
            className={`rounded-2xl border border-line p-5 flex flex-wrap items-center justify-between gap-3 text-foreground ${
              isOnDeprecatedPlan ? 'bg-accent-light' : 'bg-neutral-light'
            }`}
          >
            {/* A member on a retired plan cannot be told which of the plans
                below is theirs, so the banner explains that instead and points
                at the one place a plan change can happen. */}
            {isOnDeprecatedPlan ? (
              <div className="flex flex-col gap-1">
                <p className="font-semibold">
                  {t('subscriptions_deprecated_title')}
                </p>
                <p className="text-sm">{t('subscriptions_deprecated_intro')}</p>
              </div>
            ) : isOnLegacyPricing ? (
              // The plan below is theirs, but the price next to it is not what
              // they pay — so the banner says which of the two is true for them.
              <div className="flex flex-col gap-1">
                <p className="font-semibold">
                  {t('subscriptions_legacy_pricing_title')}
                </p>
                <p className="text-sm">
                  {t('subscriptions_legacy_pricing_intro')}
                </p>
              </div>
            ) : (
              <p>
                {isCancelled
                  ? t('subscriptions_banner_cancelled', {
                      plan: activePlanTitle || '',
                    })
                  : t('subscriptions_banner_active', {
                      plan: activePlanTitle || '',
                    })}
              </p>
            )}
            <Link
              href="/settings/subscription"
              className="underline font-semibold"
            >
              {isOnDeprecatedPlan
                ? t('subscriptions_deprecated_migrate_button')
                : isOnLegacyPricing
                  ? t('subscriptions_legacy_pricing_button')
                  : t('subscriptions_manage_button')}
            </Link>
          </div>
        ) : null}

        {singlePlan ? (
          <SubscriptionEditorial
            plan={singlePlan}
            currency={currency}
            ctaLabel={getCtaLabel(singlePlan)}
            onSubscribe={handleSubscribe}
          />
        ) : (
          <SubscriptionComparisonTable
            plans={plans}
            currency={currency}
            activePriceId={userActivePlan?.priceId}
            getCtaLabel={getCtaLabel}
            onSubscribe={handleSubscribe}
          />
        )}
      </div>
    </section>
  );
};

export default CustomSubscriptionPlans;
