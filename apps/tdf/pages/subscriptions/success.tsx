import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BackButton from 'closer/components/ui/BackButton';
import Button from 'closer/components/ui/Button';
import Heading from 'closer/components/ui/Heading';
import ProgressBar from 'closer/components/ui/ProgressBar';
import Wrapper from 'closer/components/ui/Wrapper';

import { useAuth, useConfig } from 'closer';
import { SUBSCRIPTION_STEPS } from 'closer/constants';
import { SelectedPlan, Subscriptions } from 'closer/types';
import { __ } from 'closer/utils/helpers';

const defautlSelectedPlan: SelectedPlan = {
  title: '',
  monthlyCredits: 0,
  price: 0,
};

const Success = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { priceId, subscriptionId } = router.query;
  const { PLATFORM_NAME, SUBSCRIPTIONS } = useConfig() || {};
  const subscriptions: Subscriptions = SUBSCRIPTIONS;

  const [selectedPlan, setSelectedPlan] =
    useState<SelectedPlan>(defautlSelectedPlan);

  useEffect(() => {
    if (priceId && subscriptions) {
      const selectedSubscription =
        subscriptions.plans.find((plan) => plan.priceId === priceId) ??
        defautlSelectedPlan;

      setSelectedPlan({
        title: selectedSubscription.title,
        monthlyCredits: selectedSubscription.monthlyCredits,
        price: selectedSubscription.price,
      });
    }
  }, [subscriptions, priceId]);

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

  const handleViewSubscription = () => {
    router.push('/profile/your-subscription');
  };

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_success_title')} — {__('subscriptions_title')} —{' '}
          {PLATFORM_NAME}
        </title>
      </Head>

      <div className="main-content w-full max-w-screen-sm mx-auto">
        <BackButton clickHandler={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1}> 🎊 {__('subscriptions_success_title')}</Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <Wrapper className="mt-16 mb-24  md:flex-row flex-wrap">
          <div className="mb-14">
            <Heading level={3} className="mb-12 text-2xl">
              {__('subscriptions_success_your')} {selectedPlan.title}{' '}
              {__('subscriptions_success_subscription_is_active')}
            </Heading>

            <p className="mb-12">
              {__('subscriptions_success_thank_you_message')}
            </p>

            <p className="uppercase font-[700] mb-12">
              {__('subscriptions_success_your_subscription_number')}{' '}
              {subscriptionId}
            </p>

            <p className="mb-12">{__('subscriptions_success_next_steps')}</p>

            <Button type="primary" clickHandler={handleViewSubscription}>
              {__('subscriptions_success_view_button')}
            </Button>
          </div>
        </Wrapper>
      </div>
    </>
  );
};

export default Success;
