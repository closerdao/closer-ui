import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import PageNotFound from '@/../../packages/closer/pages/404';

import {
  Button,
  Card,
  Heading,
  Page404,
  Row,
  useAuth,
  useConfig,
} from 'closer';
import { SubscriptionPlan } from 'closer/types/subscriptions';
import { __, priceFormat } from 'closer/utils/helpers';

const Subscriptions = () => {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  const { PLATFORM_NAME, SUBSCRIPTIONS } = useConfig() || {};

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>();
  const [upgradePlan, setUpgradePlan] = useState<SubscriptionPlan>();
  const [isFreePlan, setIsFreePlan] = useState(true);


  useEffect(() => {
    if (user) {
      if (user.subscription.priceId) {
        setIsFreePlan(false);
        const selectedSubscription = SUBSCRIPTIONS.plans.find(
          (plan: SubscriptionPlan) =>
            plan.priceId === user.subscription.priceId,
        );
        setSelectedPlan(selectedSubscription);
      } else {
        setIsFreePlan(true);
        const selectedSubscription = SUBSCRIPTIONS.plans[0];
        setSelectedPlan(selectedSubscription);
        setUpgradePlan(SUBSCRIPTIONS.plans[1]);
      }
    }
  }, [user]);

  const handleUpgradePlan = () => {
    if (upgradePlan) {
      router.push(`/subscriptions/summary?priceId=${upgradePlan.priceId}`);
    }
  };

  const handleManageSubscription = () => {
    if (user) {
      router.push(
        `https://billing.stripe.com/p/login/test_dR69Cl1Igat5dhK3cc?prefilled_email=${user.subscription.stripeCustomerEmail}`,
      );
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return <Page404 error="" />;
  }

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <PageNotFound error="" />;
  }

  return (
    <>
      <Head>
        <title>
          {__('settings_your_subscription_title')} — {PLATFORM_NAME}
        </title>
      </Head>

      <div className="main-content w-full max-w-screen-sm mx-auto p-6">
        <Heading level={1} className="mb-6">
          ♻️ {__('settings_your_subscription_title')}
        </Heading>
        {!isFreePlan && selectedPlan && (
          <>
            <Heading level={1} className="mb-12">
              {selectedPlan.emoji} {selectedPlan.title}
            </Heading>

            <Heading level={2} className="">
              💰 {__('subscriptions_summary_costs_subtitle')}
            </Heading>
            <div className="mb-8 mt-6">
              <Row
                rowKey={__('subscriptions_summary_subscription')}
                value={`${priceFormat(
                  selectedPlan?.price,
                  SUBSCRIPTIONS.config.currency,
                )}`}
                additionalInfo={__('subscriptions_summary_per_month')}
              />
            </div>
            <ul className="mb-4">
              {selectedPlan.perks.map((perk) => {
                return (
                  <li key={perk} className="">
                    {perk}
                  </li>
                );
              })}
            </ul>
            <Button className="mt-12" onClick={handleManageSubscription}>
              {__('settings_your_subscription_manage_subscription_button')}
            </Button>
          </>
        )}

        {isFreePlan && selectedPlan && upgradePlan && (
          <>
            <div className="my-12">
              <Heading level={2}>
                {selectedPlan.emoji} {selectedPlan.title}
              </Heading>
              <div className="mb-8 mt-6">
                <Row
                  rowKey={__('subscriptions_summary_subscription')}
                  value={`${priceFormat(
                    selectedPlan?.price,
                    SUBSCRIPTIONS.config.currency,
                  )}`}
                  additionalInfo={__('subscriptions_summary_per_month')}
                />
              </div>
            </div>
            <Card>
              <Heading level={1} className="mb-6">
                {' '}
                {upgradePlan.emoji}{' '}
                {__('settings_your_subscription_upgrade_to')}{' '}
                {upgradePlan.title}
              </Heading>
              <ul className="mb-4">
                {upgradePlan.perks.map((perk) => {
                  return (
                    <li key={perk} className="">
                      {perk}
                    </li>
                  );
                })}
              </ul>
              <Button onClick={handleUpgradePlan}>
                {__('settings_your_subscription_upgrade_button')}
              </Button>
            </Card>
          </>
        )}
      </div>
    </>
  );
};



export default Subscriptions;
