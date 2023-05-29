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
  Tier,
} from '../../types/subscriptions';
import api from '../../utils/api';
import { __, getCurrencySymbol } from '../../utils/helpers';

import { subscriptionPlansTmp } from './subcsriptionsTmp';


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

  const handleNext = (priceId: string, monthlyCredits: number) => {
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
      router.push(`/subscriptions/summary?priceId=${priceId}&monthlyCredits=${monthlyCredits}`);
    }
  };

  const getSubscriptionVariantPrice = (credits: number) => {
    const priceTier = subscriptionPlan.tiers.find((tier: Tier) => { 
     return tier.minAmount <= credits && tier.maxAmount >= credits
    })
    console.log('pricePerCredit=', priceTier.unitPrice);
    return priceTier.unitPrice * credits
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
                      {/* TODO: use tiered pricing or volume pricing: */}
                      {getSubscriptionVariantPrice(variant.monthlyCredits)}
                      {/* {variant.monthlyCredits * subscriptionPlan.price} */}
                    </div>
                    <p className="text-sm font-normal">
                      {__('subscriptions_summary_per_month')}
                    </p>
                  </div>
                  <Button
                    isEnabled={true}
                    onClick={() => handleNext(subscriptionPlan.priceId, variant.monthlyCredits)}
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
