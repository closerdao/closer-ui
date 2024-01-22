import Head from 'next/head';
import { useRouter } from 'next/router';

import PageError from '../../components/PageError';
import { Heading } from '../../components/ui';

import { NextPage } from 'next';
import { ParsedUrlQuery } from 'querystring';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { SubscriptionPlan } from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';
import { prepareSubscriptions } from '../../utils/subscriptions.helpers';

interface Props {
  subscriptionPlans: SubscriptionPlan[];
  slug?: string | string[] | undefined;
  error?: string;
}

const SubscriptionPlanPage: NextPage<Props> = ({
  subscriptionPlans,
  slug,
  error,
}) => {
  subscriptionPlans = prepareSubscriptions(subscriptionPlans);
  const router = useRouter();

  const subscriptionPlan = subscriptionPlans.find((plan: SubscriptionPlan) => {
    return plan.slug === slug;
  });

  const { isAuthenticated, isLoading, user } = useAuth();

  const { PLATFORM_NAME } = useConfig() || {};

  const handleNext = (priceId: string, monthlyCredits: number) => {
    if (!isAuthenticated) {
      // User has no account - must start with creating one.
      router.push(
        `/signup?back=${encodeURIComponent(
          `/subscriptions/summary?priceId=${priceId}`,
        )}`,
      );
    } else {
      // User does not yet have a subscription, we can show the checkout
      router.push(
        `/subscriptions/summary?priceId=${priceId}&monthlyCredits=${monthlyCredits}`,
      );
    }
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className="max-w-screen-md mx-auto">
      <Head>
        <title>{`${__(
          `subscriptions_${slug}_title`,
        )} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-1/2 text-sm mb-6">
            <Heading
              level={1}
              className="mb-6 uppercase text-4xl font-extrabold"
            >
              {__('subscriptions_pioneer_title')}
            </Heading>
            {__('subscriptions_pioneer_intro_text')}
          </div>
          <div
            className={
              'min-h-[200px] w-full sm:w-1/2 bg-contain bg-[url(/images/subscriptions/pioneer-lg.png)] bg-[center_bottom] sm:bg-[right_bottom] bg-no-repeat '
            }
          ></div>
        </div>
      </main>
    </div>
  );
};

SubscriptionPlanPage.getInitialProps = async ({
  query,
}: {
  query: ParsedUrlQuery;
}) => {
  try {
    const {
      data: { results },
    } = await api.get('/config/subscriptions');

    return {
      subscriptionPlans: results.value,
      slug: query.slug,
    };
  } catch (err: unknown) {
    return {
      subscriptionPlans: [],
      error: parseMessageFromError(err),
    };
  }
};

export default SubscriptionPlanPage;
