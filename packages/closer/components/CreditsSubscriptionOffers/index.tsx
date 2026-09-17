import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import type { SubscriptionsConfig } from '../../types/subscriptions';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import {
  getPaidSubscriptionPlans,
  normalizeSubscriptionBillingPeriod,
} from '../../utils/subscriptions.helpers';
import { Card, Heading, LinkButton } from '../ui';

interface Props {
  className?: string;
}

/**
 * Memberships that top a balance up every month. Buying credits one at a time
 * is the expensive way to get them, and the plans that include them were only
 * ever advertised on /subscriptions — someone looking at an empty balance had
 * no way to find out. Renders nothing when no plan grants credits.
 */
const CreditsSubscriptionOffers = ({ className }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();

  const subscriptionsConfig = getCachedConfig(
    'subscriptions',
  ) as SubscriptionsConfig | null;
  const paymentConfig = getCachedConfig('payment') as {
    fiatCur?: string;
    utilityFiatCur?: string;
  } | null;
  const currency =
    paymentConfig?.fiatCur || paymentConfig?.utilityFiatCur || 'EUR';

  const plans = useMemo(
    () =>
      getPaidSubscriptionPlans(subscriptionsConfig).filter(
        (plan) => Number(plan.monthlyCredits) > 0,
      ),
    [subscriptionsConfig],
  );

  if (!subscriptionsConfig?.enabled || plans.length === 0) {
    return null;
  }

  const activePriceId = user?.subscription?.priceId;

  return (
    <div className={className}>
      <Heading level={3} className="mb-2">
        {t('credits_subscriptions_heading')}
      </Heading>
      <p className="mb-4">{t('credits_subscriptions_description')}</p>

      <div className="flex flex-col gap-3">
        {plans.map((plan) => {
          const isCurrent = Boolean(
            activePriceId && plan.priceId === activePriceId,
          );
          const period = normalizeSubscriptionBillingPeriod(plan.billingPeriod);

          return (
            <Card key={plan.slug || plan.priceId} className="gap-2">
              <div className="flex flex-wrap justify-between items-baseline gap-2">
                <span className="font-bold">
                  {plan.emoji && <span className="mr-1">{plan.emoji}</span>}
                  {plan.title}
                  {isCurrent && (
                    <span className="ml-2 text-xs uppercase text-accent">
                      {t('credits_subscriptions_current_plan')}
                    </span>
                  )}
                </span>
                <span className="text-sm text-gray-600">
                  {formatIsoFiatAmount(Number(plan.price) || 0, currency)}
                  {period === 'year'
                    ? t('credits_subscriptions_per_year')
                    : t('credits_subscriptions_per_month')}
                </span>
              </div>

              <div className="text-system-success font-bold">
                {t('credits_subscriptions_monthly_credits', {
                  credits: Number(plan.monthlyCredits),
                })}
              </div>

              {plan.description && (
                <p className="text-sm text-gray-700">{plan.description}</p>
              )}
            </Card>
          );
        })}
      </div>

      <LinkButton
        href="/subscriptions"
        variant="secondary"
        size="small"
        isFullWidth={false}
        className="!normal-case tracking-normal mt-4"
      >
        {t('credits_subscriptions_cta')}
      </LinkButton>
    </div>
  );
};

export default CreditsSubscriptionOffers;
