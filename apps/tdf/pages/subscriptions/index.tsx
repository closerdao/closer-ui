import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth, useConfig } from '@/../../packages/closer';
import { Subscriptions } from '@/../../packages/closer/types';
import { __ } from '@/../../packages/closer/utils/helpers';


import SubscriptionCards from '@/../../packages/closer/components/SubscriptionCards';
import Heading from '@/../../packages/closer/components/ui/Heading';
import Wrapper from '@/../../packages/closer/components/ui/Wrapper';

// TODO: 
// fix content blinking
// add Barlow font properly
// fix import paths
// add login likk to subscribe page and vice versa
// research save credit card info
// research customer portal options
// if user has a paid plan, filter out current plan from subscriptions page
// unit tests

const Subscriptions = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const { PLATFORM_NAME } = useConfig() || {};
  const { SUBSCRIPTIONS } = useConfig() || {};

  const subscriptions: Subscriptions = SUBSCRIPTIONS;

  const filteredSubscriptionPlans = subscriptions.plans.filter(plan => plan.price !== 0);
  
  const handleNext = (priceId: string) => {
    if (priceId === 'free') {
      router.push(`/signup?back=${router.asPath}`);
    } else {
      router.push(`/subscriptions/summary?priceId=${priceId}`);
    }
  };

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_title')} — {PLATFORM_NAME}
        </title>
      </Head>
      <Wrapper className="py-6 main-content w-full">
        <Heading level={1}> ♻️ {__('subscriptions_title')}</Heading>
        
        <SubscriptionCards config={subscriptions.config} filteredSubscriptionPlans={isAuthenticated ? filteredSubscriptionPlans : subscriptions.plans} clickHandler={handleNext} />
      </Wrapper>
    </>
  );
};

export default Subscriptions;
