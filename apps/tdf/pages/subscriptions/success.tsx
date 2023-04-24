import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  BackButton,
  Button,
  Heading,
  Page404,
  ProgressBar,
  useAuth,
  useConfig,
} from 'closer';
import { SUBSCRIPTION_STEPS } from 'closer/constants';
import { SelectedPlan, SubscriptionPlan } from 'closer/types/subscriptions';
import { __ } from 'closer/utils/helpers';

const Success = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { priceId, subscriptionId } = router.query;
  const { PLATFORM_NAME, SUBSCRIPTIONS } = useConfig() || {};

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();

  useEffect(() => {
    if (user?.subscription && user.subscription.priceId) {
      router.push('/subscriptions');
    }
  }, [user]);

  useEffect(() => {
    if (priceId) {
      const selectedSubscription = SUBSCRIPTIONS.plans.find(
        (plan: SubscriptionPlan) => plan.priceId === priceId,
      );

      setSelectedPlan({
        title: selectedSubscription.title,
        monthlyCredits: selectedSubscription.monthlyCredits,
        price: selectedSubscription.price,
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

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return <Page404 error="" />;
  }

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_success_title')} — {__('subscriptions_title')} —{' '}
          {PLATFORM_NAME}
        </title>
      </Head>

      <div className="max-w-6xl mx-auto">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-6">
          {' '}
          🎊 {__('subscriptions_success_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-14">
            <Heading level={3} className="mb-12 text-2xl">
              {__('subscriptions_success_your')} {selectedPlan?.title}{' '}
              {__('subscriptions_success_subscription_is_active')}
            </Heading>

            <p className="mb-12">
              {__('subscriptions_success_thank_you_message')}
            </p>

            <p className="uppercase font-bold mb-12">
              {__('subscriptions_success_your_subscription_number')}{' '}
              {subscriptionId}
            </p>

            <p className="mb-12">{__('subscriptions_success_next_steps')}</p>

            <Button
              className="mt-3"
              type="primary"
              onClick={handleViewSubscription}
            >
              {__('subscriptions_success_view_button')}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default Success;
