import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import PageError from '../../components/PageError';
import Counter from '../../components/Counter';
import {
  BackButton,
  Button,
  Heading,
  ProgressBar,
  Row,
} from '../../components/ui/';

import { NextPage } from 'next';

import Page404 from '../404';
import { DEFAULT_CURRENCY, SUBSCRIPTION_STEPS, MAX_CREDITS_PER_MONTH } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import {
  SelectedPlan,
  SubscriptionPlan,
} from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import {
  __,
  getVatInfo,
  priceFormat,
  calculateSubscriptionPrice
} from '../../utils/helpers';

interface Props {
  subscriptionPlans: SubscriptionPlan[];
  error?: string;
}

const SubscriptionsSummaryPage: NextPage<Props> = ({
  subscriptionPlans,
  error,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { priceId, monthlyCredits } = router.query;
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();
  const defaultMonthlyCredits = Math.min(parseFloat(monthlyCredits as string) || selectedPlan?.monthlyCredits || 1, MAX_CREDITS_PER_MONTH);
  const [monthlyCreditsSelected, setMonthlyCreditsSelected] = useState<number>(defaultMonthlyCredits);

  const { PLATFORM_NAME } = useConfig() || {};

  useEffect(() => {
    if (user?.subscription && user.subscription.priceId) {
      router.push('/subscriptions');
    }
  }, []);

  useEffect(() => {
    if (priceId && subscriptionPlans) {
      const selectedSubscription = subscriptionPlans.find(
        (plan: SubscriptionPlan) => plan.priceId === priceId,
      );

      setSelectedPlan({
        title: selectedSubscription?.title as string,
        monthlyCredits: selectedSubscription?.monthlyCredits as number,
        price: selectedSubscription?.price as number,
        tiers: selectedSubscription?.tiers,
      });
    }
  }, [priceId, subscriptionPlans, monthlyCredits]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/signup?back=${router.asPath}`);
      }
    }
  }, [isAuthenticated, isLoading]);

  const goBack = () => {
    router.push('/subscriptions');
  };

  const handleEditPlan = () => {
    router.push('/subscriptions');
  };

  const handleCheckout = () => {
    if (selectedPlan?.price === 0) {
      router.push(`/subscriptions/success?priceId=${priceId}`);
    } else {
      router.push(
        `/subscriptions/checkout?priceId=${priceId}&monthlyCredits=${monthlyCreditsSelected}`,
      );
    }
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return <Page404 error="" />;
  }
  
  const total = calculateSubscriptionPrice(selectedPlan, monthlyCreditsSelected);

  return (
    <>
      <Head>
        <title>{`${__('subscriptions_summary_title')} - ${__(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          <span className="mr-2">📑</span>
          <span>{__('subscriptions_summary_title')}</span>
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-14">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              ♻️ {__('subscriptions_summary_your_subscription_subtitle')}
            </Heading>
            <div className="mb-10">
              <Row
                rowKey={__('subscriptions_summary_tier')}
                value={selectedPlan?.title}
              />
              { selectedPlan?.tiers &&
                <div className="flex space-between items-center mt-9">
                  <p className="flex-1">{__('subscriptions_summary_stays_per_month')}</p>
                  <Counter
                    value={monthlyCreditsSelected}
                    setFn={(value) => {
                      setMonthlyCreditsSelected(value);
                    }}
                    minValue={1}
                    maxValue={90}
                  />
                </div>
              }
            </div>
            <Button className="mt-3" type="secondary" onClick={handleEditPlan}>
              {__('subscriptions_summary_edit_button')}
            </Button>
          </div>

          <div className="mb-14">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              💰 {__('subscriptions_summary_costs_subtitle')}
            </Heading>
            <div className="mb-10">
              <Row
                rowKey={__('subscriptions_summary_subscription')}
                value={`${priceFormat(total, DEFAULT_CURRENCY)}`}
                additionalInfo={`${__(
                  'bookings_checkout_step_total_description',
                )} ${getVatInfo({
                  val: total,
                  cur: DEFAULT_CURRENCY,
                })} ${__('subscriptions_summary_per_month')}`}
              />
            </div>
            <Button className="mt-3" onClick={handleCheckout}>
              {__('subscriptions_summary_checkout_button')}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

SubscriptionsSummaryPage.getInitialProps = async () => {
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

export default SubscriptionsSummaryPage;
