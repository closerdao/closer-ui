import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import {
  Heading,
  Page404,
  SubscriptionCards,
  useAuth,
  useConfig,
} from 'closer';
import { SubscriptionPlan } from 'closer/types/subscriptions';
import { __ } from 'closer/utils/helpers';

const Subscriptions = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { PLATFORM_NAME, SUBSCRIPTIONS } = useConfig() || {};

  const plans: SubscriptionPlan[] = SUBSCRIPTIONS.plans;
  const paidSubscriptionPlans = plans.filter((plan) => plan.price !== 0);

  useEffect(() => {
    if (user?.subscription && user.subscription.priceId) {
      router.push('/settings/subscriptions');
    }
  }, [user]);

  const handleNext = (priceId: string) => {
    if (priceId === 'free') {
      router.push(`/signup?back=${router.asPath}`);
    } else {
      router.push(`/subscriptions/summary?priceId=${priceId}`);
    }
  };

  if (isLoading) {
    return null;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return (
      <>
        <Head>
          <title>
            {__('settings_your_subscription_title')} — {PLATFORM_NAME}
          </title>
        </Head>

        <div className="main-content w-full max-w-screen-sm mx-auto p-6">
          <Heading level={1} className="mb-14">
            ♻️ {__('settings_your_subscription_title')}
          </Heading>

          <h2>Coming soon!</h2>
        </div>
      </>
    );
  }

  return (
    <div className="main-content w-full max-w-screen-sm mx-auto p-6">
      <Head>
        <title>
          {__('subscriptions_title')} — {PLATFORM_NAME}
        </title>
      </Head>
      <main className="pt-16 pb-24 px-6 md:flex-row flex-wrap">
        <Heading level={1} className="mb-6">
          {' '}
          ♻️ {__('subscriptions_title')}
        </Heading>
        {isAuthenticated && (
          <SubscriptionCards
            config={SUBSCRIPTIONS.config}
            filteredSubscriptionPlans={paidSubscriptionPlans}
            clickHandler={handleNext}
          />
        )}
        {!isAuthenticated && (
          <SubscriptionCards
            config={SUBSCRIPTIONS.config}
            filteredSubscriptionPlans={plans}
            clickHandler={handleNext}
          />
        )}
      </main>
    </div>
  );
};

export default Subscriptions;
