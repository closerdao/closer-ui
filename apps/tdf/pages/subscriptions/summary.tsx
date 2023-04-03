import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useAuth, useConfig } from '@/../../packages/closer';
import { SUBSCRIPTION_STEPS } from '@/../../packages/closer/constants';
import { SelectedPlan, Subscriptions } from '@/../../packages/closer/types';
import { __, priceFormat } from '@/../../packages/closer/utils/helpers';

import BackButton from '@/../../packages/closer/components/ui/BackButton';
import Button from '@/../../packages/closer/components/ui/Button';
import Heading from '@/../../packages/closer/components/ui/Heading';
import ProgressBar from '@/../../packages/closer/components/ui/ProgressBar';
import Row from '@/../../packages/closer/components/ui/Row';
import Wrapper from '@/../../packages/closer/components/ui/Wrapper';

// TODO:
// add locales variables everywhere
// add Barlow font correctly

const defautlSelectedPlan: SelectedPlan = {
  title: '',
  monthlyCredits: 0,
  price: 0,
};

const Summary = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { priceId } = router.query;
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
        router.push(`/login?back=${router.asPath}`);
        // router.push(`/signup?back=${router.asPath}`);
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
    if (selectedPlan.price === 0) {
      router.push(`/subscriptions/success?priceId=${priceId}`);
    } else {
      router.push(`/subscriptions/checkout?priceId=${priceId}`);
    }
  };

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_summary_title')} — {__('subscriptions_title')} —{' '}
          {PLATFORM_NAME}
        </title>
      </Head>

      <div className="main-content w-full max-w-screen-sm mx-auto">
        <BackButton clickHandler={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1}>📑 {__('subscriptions_summary_title')}</Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <Wrapper className="mt-16 mb-24  md:flex-row flex-wrap">
          <div className="mb-14">
            <Heading level={2}>
              ♻️ {__('subscriptions_summary_your_subscription_subtitle')}
            </Heading>
            <div className="mb-10">
              <Row
                rowKey={__('subscriptions_summary_tier')}
                value={selectedPlan.title}
              />
              <Row
                rowKey={__('subscriptions_summary_stays_per_month')}
                value={selectedPlan.monthlyCredits}
              />
            </div>
            <Button type="secondary" clickHandler={handleEditPlan}>
              {__('subscriptions_summary_edit_button')}
            </Button>
          </div>

          <div className="mb-14">
            <Heading level={2}>
              💰 {__('subscriptions_summary_costs_subtitle')}
            </Heading>
            <div className="mb-10">
              <Row
                rowKey={__('subscriptions_summary_subscription')}
                value={`${priceFormat(
                  selectedPlan.price,
                  subscriptions.config.currency,
                )}`}
                additionalInfo={__('subscriptions_summary_per_month')}
              />
            </div>
            <Button clickHandler={handleCheckout}>
              {selectedPlan.price === 0
                ? 'Subscribe for free'
                : __('subscriptions_summary_checkout_button')}
            </Button>
          </div>
        </Wrapper>
      </div>
    </>
  );
};

export default Summary;
