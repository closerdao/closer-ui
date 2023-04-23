import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

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
  const { isLoading, loadUserFromCookies, user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { PLATFORM_NAME, SUBSCRIPTIONS, STRIPE_CUSTOMER_PORTAL_URL } =
    useConfig() || {};

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>();
  const [upgradePlan, setUpgradePlan] = useState<SubscriptionPlan>();
  const [isFreePlan, setIsFreePlan] = useState(true);

  useEffect(() => {
    loadUserFromCookies();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${router.asPath}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (user) {
      if (!user.subscription || !user.subscription.priceId) {
        console.log('free plan!!!!!!!');
        setIsFreePlan(true);
        const selectedSubscription = SUBSCRIPTIONS.plans[0];
        setSelectedPlan(selectedSubscription);
        setUpgradePlan(SUBSCRIPTIONS.plans[1]);
      }
    }
    if (user?.subscription && user.subscription.priceId) {
      setIsFreePlan(false);
      const selectedSubscription = SUBSCRIPTIONS.plans.find(
        (plan: SubscriptionPlan) => plan.priceId === user.subscription.priceId,
      );
      setSelectedPlan(selectedSubscription);
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
        `${STRIPE_CUSTOMER_PORTAL_URL}?prefilled_email=${user.subscription.stripeCustomerEmail}`,
      );
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return <Page404 error="" />;
  }

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          {__('settings_your_subscription_title')} — {PLATFORM_NAME}
        </title>
      </Head>

      <div className="max-w-6xl mx-auto">
        <Heading level={1} className="mb-14">
          ♻️ {__('settings_your_subscription_title')}
        </Heading>
        {!isFreePlan && selectedPlan && (
          <>
            <Heading level={2} className="">
              {`${selectedPlan.emoji} ${selectedPlan.title}`}
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
