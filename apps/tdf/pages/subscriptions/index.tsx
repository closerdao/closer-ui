import Head from 'next/head';
import { useRouter } from 'next/router';

import { useConfig } from '@/../../packages/closer';
import { __ } from '@/../../packages/closer/utils/helpers';

import Button from '@/../../packages/closer/components/ui/Button';
import Card from '@/../../packages/closer/components/ui/Card';
import Heading from '@/../../packages/closer/components/ui/Heading';

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
  const router = useRouter();

  const { PERMISSIONS, PLATFORM_NAME, SUBSCRIPTION_PLANS } = useConfig() || {};

  const subscriptions: Subscription[] = SUBSCRIPTION_PLANS;

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_title')} — {PLATFORM_NAME}{' '}
        </title>
      </Head>

      <div className="main-content w-full">
        <Heading level={1}>
          <span className="mr-1">♻️</span>
          <span>{__('subscriptions_title')}</span>
        </Heading>

        <div className="mt-16 flex gap-8 w-full flex-col md:flex-row">
          {subscriptions &&
            subscriptions.map((subscription) => (
              <Card
                key={subscription.title}
                className={`w-full md:w-[${Math.floor(
                  100 / subscriptions.length,
                )}%]`}
              >
                <div>
                  <Heading level={2}>{subscription.title}</Heading>
                  <p className="mb-4">{subscription.description}</p>
                  <ul className="mb-4">
                    {subscription.perks.map((perk) => {
                      return (
                        <li key={perk} className="list-inside list-disc">
                          {perk}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <Button
                  clickHandler={() => router.push('/subscriptions/about-you')}
                >
                  Subscribe
                </Button>
              </Card>
            ))}
        </div>
      </div>
    </>
  );
};

export default Subscribe;
