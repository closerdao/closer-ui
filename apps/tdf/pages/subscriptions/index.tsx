import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth, useConfig } from 'closer';
import { Subscriptions } from 'closer/types';
import { __ } from 'closer/utils/helpers';


import SubscriptionCards from 'closer/components/SubscriptionCards';
import Heading from 'closer/components/ui/Heading';
import Wrapper from 'closer/components/ui/Wrapper';

const Subscriptions =  () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { PLATFORM_NAME, SUBSCRIPTIONS } = useConfig() || {};
  const subscriptions: Subscriptions = SUBSCRIPTIONS;
  const paidSubscriptionPlans = subscriptions.plans.filter(plan => plan.price !== 0);

  const handleNext = (priceId: string) => {
    if (priceId === 'free') {
      router.push(`/signup?back=${router.asPath}`);
    } else {
      router.push(`/subscriptions/summary?priceId=${priceId}`);
    }
  };

  if (!isLoading) {
    return null
  }

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_title')} — {PLATFORM_NAME}
        </title>
      </Head>
      <Wrapper className="py-6 main-content w-full">
        <Heading level={1}> ♻️ {__('subscriptions_title')}</Heading>
        {isAuthenticated  && <SubscriptionCards config={subscriptions.config} filteredSubscriptionPlans={paidSubscriptionPlans} clickHandler={handleNext} />}
        {!isAuthenticated  && <SubscriptionCards config={subscriptions.config} filteredSubscriptionPlans={subscriptions.plans} clickHandler={handleNext} />}
      </Wrapper>
    </>
  );
};

export default Subscriptions;
