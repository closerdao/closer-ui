import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import {
  BackButton,
  Heading,
  Page404,
  ProgressBar,
  Row,
  SubscriptionCheckoutForm,
  useAuth,
  useConfig,
} from 'closer';
import { SUBSCRIPTION_STEPS } from 'closer/constants';
import { SelectedPlan, SubscriptionPlan } from 'closer/types/subscriptions';
import { __, priceFormat } from 'closer/utils/helpers';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUB_KEY as string,
);

const Checkout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { priceId } = router.query;
  const { PLATFORM_NAME, SUBSCRIPTIONS } = useConfig() || {};
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [isAuthenticated, isLoading]);

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
    (async function () {
      console.log(user);
    })();
  }, [user]);

  const goBack = () => {
    router.push(`/subscriptions/summary?priceId=${priceId}`);
  };

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return <Page404 error="" />;
  }

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_checkout_title')} — {__('subscriptions_title')} —{' '}
          {PLATFORM_NAME}
        </title>
      </Head>

      <div className="main-content w-full max-w-screen-sm mx-auto p-6">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-6">
          💰 {__('subscriptions_checkout_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-10">
            <Heading level={2} className="mb-8">
              ♻️ {__('subscriptions_title')}
            </Heading>

            <Row
              className="mb-4"
              rowKey={selectedPlan?.title}
              value={`${priceFormat(
                selectedPlan?.price,
                SUBSCRIPTIONS.config.currency,
              )}`}
              additionalInfo={__('subscriptions_summary_per_month')}
            />
          </div>

          <div className="mb-14">
            <Heading level={2} className="mb-8">
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
        </main>
      </div>
    </>
  );
};

export default Checkout;
