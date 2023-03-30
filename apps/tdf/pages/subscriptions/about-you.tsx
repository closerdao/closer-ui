import Head from 'next/head';
import { useRouter } from 'next/router';

import { useAuth, useConfig } from '@/../../packages/closer';
import { __ } from '@/../../packages/closer/utils/helpers';

import BackButton from '@/../../packages/closer/components/ui/BackButton';
import Heading from '@/../../packages/closer/components/ui/Heading';
import ProgressBar from '@/../../packages/closer/components/ui/ProgressBar';

import { NextPage } from 'next';

interface Subscription {
  title: string;
  description: string;
  priceID: string;
  tier: number;
  monthlyCredits: number;
  price: number;
  perks: string[];
  billingPeriod: string;
}

const Subscribe: NextPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const { PERMISSIONS, PLATFORM_NAME, SUBSCRIPTION_PLANS } = useConfig() || {};

  const subscriptions: Subscription[] = SUBSCRIPTION_PLANS;

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_about_you_title')} — {__('subscriptions_title')} —{' '}
          {PLATFORM_NAME}
        </title>
      </Head>

      <div className="main-content w-full max-w-screen-sm mx-auto">
        <BackButton clickHandler={() => null}>{__('buttons_back')}</BackButton>

        <Heading level={1}>
          <span className="mr-1">🤓</span>
          <span>{__('subscriptions_about_you_title')}</span>
        </Heading>

        <ProgressBar />
        {/* <div className="mt-16 flex flex-col gap-16 "> */}
        <div className="mt-16 flex gap-8 w-full flex-col md:flex-row">
          Login
        </div>
      </div>
    </>
  );
};

// export async function getStaticProps() {
//   const res = await fetch('')
//   const subscriptions = await res.json()

//   return {
//     props: {
//       subscriptions,
//     },
//   }
// }

export default Subscribe;
