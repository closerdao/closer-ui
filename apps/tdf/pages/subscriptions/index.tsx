import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Heading, SubscriptionCards, api, useAuth, useConfig } from 'closer';
import { DEFAULT_CURRENCY } from 'closer/constants';
import { SubscriptionPlan } from 'closer/types/subscriptions';
import { __ } from 'closer/utils/helpers';

interface Props {
  subscriptionPlans: SubscriptionPlan[];
}

const Subscriptions = ({ subscriptionPlans }: Props) => {

  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { PLATFORM_NAME, STRIPE_CUSTOMER_PORTAL_URL } = useConfig() || {};

  const plans: SubscriptionPlan[] = subscriptionPlans;
  const paidSubscriptionPlans = plans.filter((plan) => plan.price !== 0);

  const [userActivePlan, setUserActivePlan] = useState<SubscriptionPlan>();

  useEffect(() => {
    const selectedSubscription = subscriptionPlans.find(
      (plan: SubscriptionPlan) =>
        plan.priceId === (user?.subscription?.priceId || 'free'),
    );
    setUserActivePlan(selectedSubscription);
  }, [user]);

  const handleNext = (priceId: string) => {
    if (!isAuthenticated) {
      // User has no account - must start with creating one.
      router.push(
        `/signup?back=${encodeURIComponent(
          `/subscriptions/summary?priceId=${priceId}`,
        )}`,
      );
    } else if (userActivePlan?.priceId !== 'free') {
      // User has a subscription - must be managed in Stripe.
      router.push(
        `${STRIPE_CUSTOMER_PORTAL_URL}?prefilled_email=${encodeURIComponent(
          (user?.subscription?.stripeCustomerEmail as string) ||
            (user?.email as string),
        )}`,
      );
    } else {
      // User does not yet have a subscription, we can show the checkout
      router.push(`/subscriptions/summary?priceId=${priceId}`);
    }
  };

  if (isLoading) {
    return null;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return (
      <>
        <Head>
          <title>{`${__(
            'settings_your_subscription_title',
          )} - ${PLATFORM_NAME}`}</title>
        </Head>

        <div className="max-w-6xl mx-auto">
          <Heading level={1} className="mb-14">
            ♻️ {__('settings_your_subscription_title')}
          </Heading>

          <Heading level={2}>Coming soon!</Heading>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Head>
        <title>{`${__('subscriptions_title')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <Heading level={1} className="mb-6">
          {' '}
          ♻️ {__('subscriptions_title')}
        </Heading>
        <SubscriptionCards
          filteredSubscriptionPlans={
            isAuthenticated ? paidSubscriptionPlans : plans
          }
          clickHandler={handleNext}
          userActivePlan={userActivePlan}
          validUntil={user?.subscription?.validUntil}
          cancelledAt={user?.subscription?.cancelledAt}
          currency={DEFAULT_CURRENCY}
        />
      </main>
    </div>
  );
};

export async function getServerSideProps() {
  try {
    const {
      data: { results },
    } = await api.get('/config/subscriptions');
    return {
      props: {
        subscriptionPlans: results.value.plans,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      subscriptionPlans: [],
    };
  }
}

export default Subscriptions;
