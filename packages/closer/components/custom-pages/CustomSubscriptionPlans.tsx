import React, { useMemo } from 'react';

import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import SubscriptionComparisonTable from '../SubscriptionComparisonTable';
import SubscriptionEditorial from '../SubscriptionEditorial';
import { useAuth } from '../../contexts/auth';
import { SubscriptionPlan, SubscriptionsConfig } from '../../types/subscriptions';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { getPaidSubscriptionPlans } from '../../utils/subscriptions.helpers';

interface Props {
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

const CustomSubscriptionPlans = (_props: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
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

  if (!areSubscriptionsEnabled || !plans.length) {
    return null;
  }

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
    router.push(`/subscriptions/checkout?priceId=${priceId}`);
  };

  const getCtaLabel = (_plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      return t('subscriptions_create_account_button');
    }
    return t('subscriptions_subscribe_button');
  };

  const singlePlan = plans.length === 1 ? plans[0] : null;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6">
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
            getCtaLabel={getCtaLabel}
            onSubscribe={handleSubscribe}
          />
        )}
      </div>
    </section>
  );
};

export default CustomSubscriptionPlans;
