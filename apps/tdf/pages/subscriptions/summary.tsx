import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  BackButton,
  Button,
  Heading,
  Page404,
  ProgressBar,
  Row,
  useAuth,
  useConfig,
} from 'closer';
import { SUBSCRIPTION_STEPS } from 'closer/constants';
import { SelectedPlan, SubscriptionPlan } from 'closer/types/subscriptions';
import { __, priceFormat } from 'closer/utils/helpers';

const Summary = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { priceId } = router.query;
  const { PLATFORM_NAME, SUBSCRIPTIONS } = useConfig() || {};

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();

  useEffect(() => {
    if (user?.subscription && user.subscription.priceId) {
      router.push('/settings/subscriptions');
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
      router.push(`/subscriptions/checkout?priceId=${priceId}`);
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return <Page404 error="" />;
  }

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_summary_title')} — {__('subscriptions_title')} —{' '}
          {PLATFORM_NAME}
        </title>
      </Head>

      <div className="main-content w-full max-w-screen-sm mx-auto p-6">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-6">
          📑 {__('subscriptions_summary_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-14">
            <Heading level={4} className="mb-8">
              ♻️ {__('subscriptions_summary_your_subscription_subtitle')}
            </Heading>
            <div className="mb-10">
              <Row
                rowKey={__('subscriptions_summary_tier')}
                value={selectedPlan?.title}
              />
              <Row
                rowKey={__('subscriptions_summary_stays_per_month')}
                value={selectedPlan?.monthlyCredits}
              />
            </div>
            <Button className="mt-3" type="secondary" onClick={handleEditPlan}>
              {__('subscriptions_summary_edit_button')}
            </Button>
          </div>

          <div className="mb-14">
            <Heading level={4} className="mb-8">
              💰 {__('subscriptions_summary_costs_subtitle')}
            </Heading>
            <div className="mb-10">
              <Row
                rowKey={__('subscriptions_summary_subscription')}
                value={`${priceFormat(
                  selectedPlan?.price,
                  SUBSCRIPTIONS.config.currency,
                )}`}
                additionalInfo={__('subscriptions_summary_per_month')}
              />
            </div>
            <Button className="mt-3" onClick={handleCheckout}>
              {__('subscriptions_summary_checkout_button')}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default Summary;
