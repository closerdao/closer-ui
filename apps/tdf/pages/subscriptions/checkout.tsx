import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import SubscriptionCheckoutForm from 'closer/components/SubscriptionCheckoutForm';
import BackButton from 'closer/components/ui/BackButton';
import Heading from 'closer/components/ui/Heading';
import ProgressBar from 'closer/components/ui/ProgressBar';
import Row from 'closer/components/ui/Row';
import Wrapper from 'closer/components/ui/Wrapper';

import { useAuth, useConfig } from 'closer';
import { SUBSCRIPTION_STEPS } from 'closer/constants';
import { SelectedPlan, Subscriptions } from 'closer/types';
import { __, priceFormat } from 'closer/utils/helpers';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUB_KEY as string,
);

const defautlSelectedPlan: SelectedPlan = {
  title: '',
  monthlyCredits: 0,
  price: 0,
};

const Checkout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  console.log('user email', user?.email);
  const router = useRouter();
  const { priceId } = router.query;
  const { PLATFORM_NAME, SUBSCRIPTIONS } = useConfig() || {};
  const subscriptions: Subscriptions = SUBSCRIPTIONS;

  const [selectedPlan, setSelectedPlan] =
    useState<SelectedPlan>(defautlSelectedPlan);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [isAuthenticated, isLoading]);

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

  const goBack = () => {
    router.push(`/subscriptions/summary?priceId=${priceId}`);
  };

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_checkout_title')} — {__('subscriptions_title')} —{' '}
          {PLATFORM_NAME}
        </title>
      </Head>

      <Wrapper className="main-content w-full max-w-screen-sm mx-auto">
        <BackButton clickHandler={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1}>💰 {__('subscriptions_checkout_title')}</Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <div className="mt-16 w-full md:flex-row">
          <div className="mb-10">
            <Heading level={2}>♻️ {__('subscriptions_title')}</Heading>
            <Row
              rowKey={selectedPlan.title}
              value={`${priceFormat(
                selectedPlan.price,
                subscriptions.config.currency,
              )}`}
              additionalInfo={__('subscriptions_summary_per_month')}
            />
          </div>

          <div className="mb-14">
            <Heading level={2}>
              💲 {__('subscriptions_checkout_payment_subtitle')}
            </Heading>
            <div className="mb-10">
              <Elements stripe={stripePromise}>
                <SubscriptionCheckoutForm
                  userEmail={user?.email}
                  priceId={priceId}
                />
              </Elements>
            </div>
          </div>
        </div>
      </Wrapper>
    </>
  );
};

export default Checkout;
