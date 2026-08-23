import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import SubscriptionCheckoutForm from '../../components/SubscriptionCheckoutForm';
import {
  BackButton,
  ErrorMessage,
  Heading,
  ProgressBar,
  Row,
} from '../../components/ui/';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import {
  DEFAULT_CURRENCY,
  MAX_CREDITS_PER_MONTH,
  SUBSCRIPTION_STEPS,
} from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { useIntroOfferEligibility } from '../../hooks/useIntroOfferEligibility';
import { GeneralConfig, PaymentConfig } from '../../types';
import {
  SelectedPlan,
  SubscriptionPlan, // Tier,
} from '../../types/subscriptions';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { mergePaymentValueWithBookingCurrencyFallback } from '../../utils/config.utils';
import {
  calculateSubscriptionPrice,
  getVatInfo,
  priceFormat,
} from '../../utils/helpers';
import { logMetric } from '../../utils/metrics';
import {
  getPaidSubscriptionPlans,
  isFirstMonthFreePlan,
  isSubscriptionActive,
} from '../../utils/subscriptions.helpers';
import PageNotFound from '../not-found';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY as string,
  {
    stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT,
  },
);

const SubscriptionsCheckoutPage: NextPage = () => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as {
    enabled: boolean;
    elements: SubscriptionPlan[];
  };
  const paymentConfig = (mergePaymentValueWithBookingCurrencyFallback(
    getCachedConfig('payment'),
    getCachedConfig('booking'),
  ) ?? null) as PaymentConfig | null;
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();
  const isPaymentEnabled = paymentConfig?.enabled || false;
  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const subscriptionPlans = getPaidSubscriptionPlans(subscriptionsConfig, {
    availableOnly: false,
  });
  const { isAuthenticated, isLoading, user } = useAuth();
  const { eligibleForIntro } = useIntroOfferEligibility();
  const router = useRouter();
  const { priceId, monthlyCredits, source } = router.query;
  const defaultVatRate = Number(process.env.NEXT_PUBLIC_VAT_RATE) || 0;
  const vatRateFromConfig = Number(paymentConfig?.vatRate);
  const vatRate = vatRateFromConfig || defaultVatRate;

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionPlan>();

  const monthlyCreditsSelected = Math.min(
    parseFloat(monthlyCredits as string) || selectedPlan?.monthlyCredits || 0,
    MAX_CREDITS_PER_MONTH,
  );
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const hasComponentRendered = useRef(false);

  useEffect(() => {
    if (!hasComponentRendered.current && selectedPlan) {
      void logMetric({
        event:
          selectedPlan?.title.toLowerCase() === 'wanderer'
            ? 'tier-1-checkout'
            : 'tier-2-checkout',
        category: 'subscriptions',
        value: 'checkout',
      });
      void logMetric({
        event: 'subscription-checkout-started',
        category: 'subscriptions',
        value: 'payment',
      });
      hasComponentRendered.current = true;
    }
  }, [selectedPlan]);

  // Only an existing paying member is sent back to the plans page. Deliberately
  // mount-only: the checkout form refetches the user on success, and reacting to
  // that would bounce a member who just paid before they reach the success page.
  useEffect(() => {
    if (isSubscriptionActive(user?.subscription)) {
      router.push('/subscriptions');
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (priceId && subscriptionPlans) {
      const selectedSubscriptionPlan = subscriptionPlans.find(
        (plan: SubscriptionPlan) => plan.priceId.includes(priceId as string),
      );

      setSelectedSubscription(selectedSubscriptionPlan);
      setSelectedPlan({
        title: selectedSubscriptionPlan?.title as string,
        monthlyCredits: selectedSubscriptionPlan?.monthlyCredits as number,
        price: selectedSubscriptionPlan?.price as number,
        tiersAvailable: selectedSubscriptionPlan?.tiersAvailable as boolean,
      });
    }
  }, [priceId]);

  const goBack = () => {
    router.push(
      `/subscriptions/summary?priceId=${priceId}&monthlyCredits=${monthlyCredits}`,
    );
  };

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  const total = calculateSubscriptionPrice(
    selectedPlan,
    monthlyCreditsSelected,
  );
  const firstMonthFree =
    isFirstMonthFreePlan(selectedSubscription) && eligibleForIntro;
  const dueToday = firstMonthFree ? 0 : total;

  return (
    <>
      <Head>
        <title>{`${t('subscriptions_checkout_title')} - ${t(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          💰 {t('subscriptions_checkout_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-10">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              <span className="mr-2">♻️</span>
              {t('subscriptions_title')}
            </Heading>

            {
              <Row
                className="mb-4"
                rowKey={` ${selectedPlan?.title} ${
                  Number(monthlyCreditsSelected)
                    ? `- ${Number(monthlyCreditsSelected)}
                      ${t('subscriptions_credits_included')}`
                    : ''
                }  `}
                value={`${
                  selectedPlan && priceFormat(dueToday, DEFAULT_CURRENCY)
                }`}
                additionalInfo={
                  firstMonthFree
                    ? t('subscriptions_recurring_after_first_month', {
                        amount: priceFormat(total, DEFAULT_CURRENCY),
                      })
                    : `${t(
                        'bookings_checkout_step_total_description',
                      )} ${getVatInfo(
                        {
                          val: total,
                          cur: DEFAULT_CURRENCY,
                        },
                        vatRate,
                      )} ${t('subscriptions_summary_per_month')}`
                }
              />
            }
          </div>

          <div className="mb-14">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              <span className="mr-2">💲</span>
              {t('subscriptions_checkout_payment_subtitle')}
            </Heading>
            <div className="mb-10">
              {isPaymentEnabled ? (
                <Elements stripe={stripePromise}>
                  <SubscriptionCheckoutForm
                    userEmail={user?.email}
                    priceId={priceId}
                    monthlyCredits={Number(monthlyCredits)}
                    source={source as string}
                    firstMonthFree={firstMonthFree}
                    tierMetricEvent={
                      selectedPlan?.title?.toLowerCase() === 'wanderer'
                        ? 'tier-1-first-payment'
                        : 'tier-2-first-payment'
                    }
                  />
                </Elements>
              ) : (
                <ErrorMessage error={t('checkout_payment_disabled_error')} />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SubscriptionsCheckoutPage;
