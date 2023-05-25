import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import SubscriptionCards from '../../components/SubscriptionCards';
import { Heading } from '../../components/ui/';

import { NextPage } from 'next';

import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { SubscriptionPlan } from '../../types/subscriptions';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const subscriptionPlansTmp = [
  {
    slug: 'explorer',
    title: 'Explorer',
    emoji: '🕵🏽‍♀️',
    description:
      'The perfect starting point if you’re new to regeneration, and want to dip your toe before buckling up for the adventure.',
    priceId: 'free',
    tier: 1,
    monthlyCredits: 0,
    price: 0,
    perks: [
      'Book 🎉 Events',
      'Apply To 💪🏽 Volunteer',
      'Quests (Coming Soon)',
      'Monthly Newsletters',
    ],
    billingPeriod: 'month',
  },
  {
    slug: 'wanderer',
    title: 'Wanderer',
    emoji: '👩🏽‍🌾',
    description: 'Stay in the loop and see if TDF is for you',
    priceId: 'price_1MqtoHGtt5D0VKR2Has7KE5X',
    tier: 2,
    available: true,
    monthlyCredits: 0,
    price: 10,
    perks: [
      'Book 🏡 Stays',
      'Event Discounts',
      'TDF Community Calls',
      'Discord Access',
      'Welcome Gift',
    ],

    billingPeriod: 'month',
  },
  {
    slug: 'pioneer',
    title: 'Pioneer',
    available: true,
    emoji: '👨🏽‍🚀',
    description: 'BE THE LOOP. CONTINUOUSLY SUPPORT AND COME TO TDF ',
    priceId: 'price_1Mqtp0Gtt5D0VKR297NwmzIy',
    tier: 3,
    monthlyCredits: 3,
    price: 120,
    perks: ['Harvest 🥕 Carrots Monthly'],
    variants: [
      {
        title: 'Balcony gardener',
        monthlyCredits: 2,
        price: 60,
        priceId: 'price_1Mqtp0Gtt5D0VKR297NwmzIy',
      },
      {
        title: 'Home gardener',
        monthlyCredits: 4,
        price: 120,
        priceId: 'price_1Mqtp0Gtt5D0VKR297NwmzIy',
      },
      {
        title: 'Market gardener',
        monthlyCredits: 6,
        price: 180,
        priceId: 'price_1Mqtp0Gtt5D0VKR297NwmzIy',
      },
    ],
    billingPeriod: 'month',
  },
  {
    slug: 'sheep',
    title: 'Sheep',
    available: false,
    emoji: '👨🏽‍🚀',
    description: '',
    priceId: 'price_1Mqtp0Gtt5D0VKR297NwmzIy',
    tier: 3,
    monthlyCredits: 3,
    price: 120,
    perks: [],
    billingPeriod: 'month',
  },
];

interface Props {
  subscriptionPlans: SubscriptionPlan[];
}

const SubscriptionsPage: NextPage<any> = ({ subscriptionPlans }) => {
  console.log('subscriptionPlans=', subscriptionPlans);

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

  const handleNext = (priceId: string, hasVariants: boolean, slug: string) => {
    console.log('hasVariants=', hasVariants);
    if (hasVariants) { 
      // Subscription has ariants - redirect to variant selection page
      router.push(`/subscriptions/${slug}`);
     } else if (!isAuthenticated) {

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
    } 
    else {
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
    <div className="max-w-screen-md mx-auto">
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

SubscriptionsPage.getInitialProps = async () => {
  try {
    const {
      data: { results },
    } = await api.get('/config/subscriptions');

    console.log('results.value.plans=', results.value.plans);

    return {
      // subscriptionPlans: results.value.plans,
      subscriptionPlans: subscriptionPlansTmp,
    };
  } catch (err: any) {
    return {
      subscriptionPlans: [],
    };
  }
};

export default SubscriptionsPage;
