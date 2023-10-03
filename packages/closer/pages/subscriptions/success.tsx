import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import PageError from '../../components/PageError';
import { BackButton, Button, Heading, ProgressBar } from '../../components/ui/';

import { NextPage } from 'next';

import Page404 from '../404';
import { SUBSCRIPTION_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { SelectedPlan, SubscriptionPlan } from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';
import { event as gaEvent } from 'nextjs-google-analytics'; 

interface Props {
  subscriptionPlans: SubscriptionPlan[];
  error?: string;
}

const SubscriptionSuccessPage: NextPage<Props> = ({
  subscriptionPlans,
  error,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  const router = useRouter();
  const { priceId, subscriptionId } = router.query;
  const { PLATFORM_NAME } = useConfig() || {};

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();

  useEffect(() => {
    if (priceId) {
      const selectedSubscription = subscriptionPlans.find(
        (plan: SubscriptionPlan) => plan.priceId === priceId,
      );

      setSelectedPlan({
        title: selectedSubscription?.title as string,
        monthlyCredits: selectedSubscription?.monthlyCredits as number,
        price: selectedSubscription?.price as number,
      });

      gaEvent('subscription_confirm', {
        category: 'sales',
        label: 'subscription',
        });
    }
  }, [priceId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [isAuthenticated, isLoading]);

  const goBack = () => {
    router.push('/subscriptions');
  };

  const handleViewSubscription = () => {
    router.push('/subscriptions');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return <Page404 error="" />;
  }

  return (
    <>
      <Head>
        <title>{`${__('subscriptions_success_title')} - ${__(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🎊 {__('subscriptions_success_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-14">
            <Heading level={3} className="mb-12 text-2xl">
              {__('subscriptions_success_your')} {selectedPlan?.title}{' '}
              {__('subscriptions_success_subscription_is_active')}
            </Heading>

            <p className="mb-12">
              {__('subscriptions_success_thank_you_message')}
            </p>

            <p className="uppercase font-bold mb-12">
              {__('subscriptions_success_your_subscription_number')}{' '}
              {subscriptionId}
            </p>

            <p className="mb-12">{__('subscriptions_success_next_steps')}</p>

            <Button
              className="mt-3"
              type="primary"
              onClick={handleViewSubscription}
            >
              {__('subscriptions_success_view_button')}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

SubscriptionSuccessPage.getInitialProps = async () => {
  try {
    const {
      data: { results },
    } = await api.get('/config/subscriptions');

    return {
      subscriptionPlans: results.value.plans,
    };
  } catch (err: unknown) {
    return {
      subscriptionPlans: [],
      error: parseMessageFromError(err),
    };
  }
};

export default SubscriptionSuccessPage;
