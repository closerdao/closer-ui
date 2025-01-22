import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import Counter from '../../components/Counter';
import PageError from '../../components/PageError';
import {
  BackButton,
  Button,
  Heading,
  ProgressBar,
  Row,
} from '../../components/ui/';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import {
  DEFAULT_CURRENCY,
  MAX_CREDITS_PER_MONTH,
  SUBSCRIPTION_STEPS,
} from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig, PaymentConfig } from '../../types';
import {
  SelectedPlan,
  SubscriptionPlan, // Tier,
} from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import {
  calculateSubscriptionPrice,
  getVatInfo,
  priceFormat,
} from '../../utils/helpers';
import { loadLocaleData } from '../../utils/locale.helpers';
import { prepareSubscriptions } from '../../utils/subscriptions.helpers';
import PageNotFound from '../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };
  generalConfig: GeneralConfig | null;
  error?: string;
  paymentConfig: PaymentConfig | null;
}

const SubscriptionsSummaryPage: NextPage<Props> = ({
  subscriptionsConfig,
  generalConfig,
  error,
  paymentConfig,
}) => {
  const t = useTranslations();
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const defaultConfig = useConfig();
  const { priceId, monthlyCredits } = router.query;
  const defaultVatRate = Number(process.env.NEXT_PUBLIC_VAT_RATE) || 0;
  const vatRateFromConfig = Number(paymentConfig?.vatRate);
  const vatRate = vatRateFromConfig || defaultVatRate;

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const subscriptionPlans = prepareSubscriptions(subscriptionsConfig);

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();

  const defaultMonthlyCredits = Math.min(
    parseFloat(monthlyCredits as string) || selectedPlan?.monthlyCredits || 0,
    MAX_CREDITS_PER_MONTH,
  );
  const [monthlyCreditsSelected, setMonthlyCreditsSelected] = useState<number>(
    defaultMonthlyCredits,
  );

  const hasComponentRendered = useRef(false);

  useEffect(() => {
    if (!hasComponentRendered.current) {
      (async () => {
        try {
            await api.post('/metric', {
              event: selectedPlan?.title === 'wanderer' ? 'tier-1-page-view' : 'tier-2-page-view',
              value: 'subscriptions',
              point: 0,
              category: 'engagement',
            });
        } catch (error) {
          console.error('Error logging page view:', error);
        }
      })();
      hasComponentRendered.current = true;
    }
  }, []);

  useEffect(() => {
    if (user?.subscription && user?.subscription?.priceId) {
      router.push('/subscriptions');
    }
  }, []);

  useEffect(() => {
    if (priceId && subscriptionPlans) {
      const selectedSubscription = subscriptionPlans.find(
        (plan: SubscriptionPlan) => plan.priceId.includes(priceId as string),
      );

      setMonthlyCreditsSelected(selectedSubscription?.monthlyCredits ? 1 : 0);

      setSelectedPlan({
        title: selectedSubscription?.title as string,
        monthlyCredits: selectedSubscription?.monthlyCredits ? 1 : 0,
        price: selectedSubscription?.price as number,
        tiersAvailable: selectedSubscription?.tiersAvailable as boolean,
      });
    }
  }, [priceId, monthlyCredits]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/signup?back=${router.asPath}`);
      }
    }
  }, [isAuthenticated, isLoading]);

  const goBack = () => {
    router.push('/subscriptions');
  };

  const handleEditPlan = () => {
    router.push('/subscriptions');
  };

  const handleCheckout = () => {
    if (selectedPlan?.price === 0) {
      router.push(`/subscriptions/success?priceId=${priceId}`);
    } else {
      router.push(
        `/subscriptions/checkout?priceId=${priceId}&monthlyCredits=${monthlyCreditsSelected}`,
      );
    }
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  const total = calculateSubscriptionPrice(
    selectedPlan,
    monthlyCreditsSelected,
  );

  return (
    <>
      <Head>
        <title>{`${t('subscriptions_summary_title')} - ${t(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          <span className="mr-2">📑</span>
          <span>{t('subscriptions_summary_title')}</span>
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-14">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              ♻️ {t('subscriptions_summary_your_subscription_subtitle')}
            </Heading>
            <div className="mb-10">
              <Row
                rowKey={t('subscriptions_summary_tier')}
                value={selectedPlan?.title}
              />
              {selectedPlan?.tiersAvailable && (
                <div className="flex space-between items-center mt-9">
                  <p className="flex-1">
                    {t('subscriptions_summary_stays_per_month')}
                  </p>
                  <Counter
                    value={monthlyCreditsSelected}
                    setFn={(value) => {
                      setMonthlyCreditsSelected(value);
                    }}
                    minValue={1}
                    maxValue={90}
                  />
                </div>
              )}
            </div>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={handleEditPlan}
            >
              {t('subscriptions_summary_edit_button')}
            </Button>
          </div>

          <div className="mb-14">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              💰 {t('subscriptions_summary_costs_subtitle')}
            </Heading>
            <div className="mb-10">
              <Row
                rowKey={t('subscriptions_summary_subscription')}
                value={`${priceFormat(total, DEFAULT_CURRENCY)}`}
                additionalInfo={`${t(
                  'bookings_checkout_step_total_description',
                )} ${getVatInfo(
                  {
                    val: total,
                    cur: DEFAULT_CURRENCY,
                  },
                  vatRate,
                )} ${t('subscriptions_summary_per_month')}`}
              />
            </div>
            <Button className="mt-3" onClick={handleCheckout}>
              {t('subscriptions_summary_checkout_button')}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

SubscriptionsSummaryPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subscriptionsRes, generalRes, paymentRes, messages] =
      await Promise.all([
        api.get('/config/subscriptions').catch(() => {
          return null;
        }),
        api.get('/config/general').catch(() => {
          return null;
        }),
        api.get('/config/payment').catch(() => {
          return null;
        }),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;
    const generalConfig = generalRes?.data?.results?.value;
    const paymentConfig = paymentRes?.data?.results?.value;

    return {
      subscriptionsConfig,
      generalConfig,
      messages,
      paymentConfig,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
      paymentConfig: null,
    };
  }
};

export default SubscriptionsSummaryPage;
