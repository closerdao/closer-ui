import Head from 'next/head';
import { useRouter } from 'next/router';

import { useConfig } from '@/../../packages/closer';
import { __ } from '@/../../packages/closer/utils/helpers';

import SubscriptionCards from '@/../../packages/closer/components/SubscriptionCards';
import Heading from '@/../../packages/closer/components/ui/Heading';
import Wrapper from '@/../../packages/closer/components/ui/Wrapper';

const Subscriptions = () => {
  const router = useRouter();

  const { PLATFORM_NAME } = useConfig() || {};

  const handleNext = (priceId: string) => {
    router.push(`/subscriptions/about-you?plan=${priceId}`);
  };

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_title')} — {PLATFORM_NAME}
        </title>
      </Head>
      <Wrapper className="main-content w-full">
        <Heading level={1}>
          <span className="mr-1">♻️</span>
          <span>{__('subscriptions_title')}</span>
        </Heading>

        <SubscriptionCards clickHandler={handleNext} />
      </Wrapper>
    </>
  );
};

export default Subscriptions;
