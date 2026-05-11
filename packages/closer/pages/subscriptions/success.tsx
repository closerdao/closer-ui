import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { BackButton, Button, Heading, ProgressBar } from '../../components/ui/';

import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import { DEFAULT_CURRENCY, SUBSCRIPTION_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import { SelectedPlan, SubscriptionPlan } from '../../types/subscriptions';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { prepareSubscriptions } from '../../utils/subscriptions.helpers';
import PageNotFound from '../not-found';

interface Props {}
const SubscriptionSuccessPage = () => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as {
    enabled: boolean;
    elements: SubscriptionPlan[];
  };
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const subscriptionPlans = prepareSubscriptions(subscriptionsConfig);

  const { isAuthenticated, isLoading } = useAuth();

  const router = useRouter();
  const { priceId, subscriptionId } = router.query;

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();

  useEffect(() => {
    if (priceId) {
      const selectedSubscription = subscriptionPlans.find(
        (plan: SubscriptionPlan) => plan.priceId === priceId,
      );

      setSelectedPlan({
        title: selectedSubscription?.title as string,
        monthlyCredits: selectedSubscription?.monthlyCredits as number,
        price: selectedSubscription?.price as number,
        tiersAvailable: selectedSubscription?.tiersAvailable as boolean,
      });

      gaEvent('subscription_confirm', {
        category: 'sales',
        label: 'subscription',
        value: selectedPlan?.price,
        currency: DEFAULT_CURRENCY,
      });
    }
  }, [priceId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [isAuthenticated, isLoading]);

  const goBack = () => {
    router.push('/subscriptions');
  };

  const handleViewSubscription = () => {
    router.push('/subscriptions');
  };

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  return (
    <>
      <Head>
        <title>{`${t('subscriptions_success_title')} - ${t(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🎊 {t('subscriptions_success_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-14">
            <Heading level={3} className="mb-12 text-2xl">
              {t('subscriptions_success_your')} {selectedPlan?.title}{' '}
              {t('subscriptions_success_subscription_is_active')}
            </Heading>

            <p className="mb-12">
              {t('subscriptions_success_thank_you_message')}
            </p>

            <p className="uppercase font-bold mb-12">
              {t('subscriptions_success_your_subscription_number')}{' '}
              {subscriptionId}
            </p>

            <p className="mb-12">{t('subscriptions_success_next_steps')}</p>

            <Button
              className="mt-3"
              variant="primary"
              onClick={handleViewSubscription}
            >
              {t('subscriptions_success_view_button')}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default SubscriptionSuccessPage;
