import Head from 'next/head';
import { useRouter } from 'next/router';

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
  const { isAuthenticated, isLoading } = useAuth();
  console.log('isLoading', isLoading)
  const router = useRouter();
  const { PLATFORM_NAME, SUBSCRIPTIONS } = useConfig() || {};

  const plans: SubscriptionPlan[] = SUBSCRIPTIONS.plans;
  const paidSubscriptionPlans = plans.filter((plan) => plan.price !== 0);

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
    return <Page404 error="" />;
  }

  return (
    <>
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
    </>
  );
};

export default Subscriptions;
