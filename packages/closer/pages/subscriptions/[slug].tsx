import Head from 'next/head';
import { useRouter } from 'next/router';

import { Button, Card, Heading } from '../../components/ui';

import { NextPage } from 'next';

import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import {
  SubscriptionPlan,
  SubscriptionVariant,
} from '../../types/subscriptions';
import api from '../../utils/api';
import { __, getCurrencySymbol } from '../../utils/helpers';

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
        priceId: 'price_11',
      },
      {
        title: 'Home gardener',
        monthlyCredits: 4,
        price: 120,
        priceId: 'price_12',
      },
      {
        title: 'Market gardener',
        monthlyCredits: 6,
        price: 180,
        priceId: 'price_13',
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
  subscriptionPlan: SubscriptionPlan;
  slug: string;
}

const SubscriptionPlanPage: NextPage<any> = ({ subscriptionPlan, slug }) => {
  console.log('subscriptionPlan=', subscriptionPlan);

  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { PLATFORM_NAME, STRIPE_CUSTOMER_PORTAL_URL } = useConfig() || {};

  // const plans: SubscriptionPlan[] = subscriptionPlans;
  // const paidSubscriptionPlans = plans.filter((plan) => plan.price !== 0);

  // const [userActivePlan, setUserActivePlan] = useState<SubscriptionPlan>();

  // useEffect(() => {
  //   const selectedSubscription = subscriptionPlans.find(
  //     (plan: SubscriptionPlan) =>
  //       plan.priceId === (user?.subscription?.priceId || 'free'),
  //   );
  //   setUserActivePlan(selectedSubscription);
  // }, [user]);

  const handleNext = (priceId: string) => {
    // console.log('hasVariants=', hasVariants);
    if (!isAuthenticated) {
      // User has no account - must start with creating one.
      router.push(
        `/signup?back=${encodeURIComponent(
          `/subscriptions/summary?priceId=${priceId}`,
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

        {subscriptionPlan.variants.map((variant: SubscriptionVariant) => {
          return (
            <div key={variant.title}>
              <Card>
                <div className="flex flex-col gap-4 sm:gap-1 sm:flex-row items-center justify-between">
                  <Heading
                    level={3}
                    className="uppercase w-full sm:w-2/5 text-center sm:text-left"
                  >
                    {variant.title}
                  </Heading>
                  <div className="text-center">
                    <p className="text-accent text-2xl font-bold">
                      {variant.monthlyCredits} 🥕
                    </p>
                  </div>
                  <div className="text-center">
                    <div className=" font-bold text-xl">
                      {getCurrencySymbol(DEFAULT_CURRENCY)}
                      {variant.price}
                    </div>
                    <p className="text-sm font-normal">
                      {__('subscriptions_summary_per_month')}
                    </p>
                  </div>
                  <Button
                    isEnabled={true}
                    onClick={() => handleNext(variant.priceId)}
                    size="medium"
                    className=" border"
                  >
                    {__('subscriptions_subscribe_button')}
                  </Button>
                </div>
              </Card>
            </div>
          );
        })}
      </main>
    </div>
  );
};

SubscriptionPlanPage.getInitialProps = async ({ query }) => {
  try {
    const {
      data: { results },
    } = await api.get('/config/subscriptions');

    console.log('query.slug=', query.slug);
    const subscriptionPlan = subscriptionPlansTmp.find((plan) => {
      return plan.slug === query.slug;
    });

    // console.log('subscriptionPlan=', subscriptionPlan);
    // console.log('query.slug=', query.slug);

    return {
      // subscriptionPlans: results.value.plans,
      subscriptionPlan,
      slug: query.slug,
    };
  } catch (err: any) {
    return {
      subscriptionPlan: [],
    };
  }

  // try {
  //   const res = await api.get(`/user/${query.slug}`);

  //   return {
  //     member: res.data.results,
  //   };
  // } catch (err) {
  //   console.log('Error', err.message);

  //   return {
  //     loadError: err.message,
  //   };
  // }
};

export default SubscriptionPlanPage;
