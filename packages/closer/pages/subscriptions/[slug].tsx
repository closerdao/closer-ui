import Head from 'next/head';
import { useRouter } from 'next/router';

import { Button, Card, Heading } from '../../components/ui';

import { NextPage } from 'next';
import { ParsedUrlQuery } from 'querystring';

import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import {
  SubscriptionPlan,
  SubscriptionVariant,
} from '../../types/subscriptions';
import api from '../../utils/api';
import {
  __,
  getCurrencySymbol,
  getSubscriptionVariantPrice,
} from '../../utils/helpers';

interface Props {
  subscriptionPlans: SubscriptionPlan[];
  slug?: string | string[] | undefined;
}

const SubscriptionPlanPage: NextPage<Props> = ({ subscriptionPlans, slug }) => {
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

        {subscriptionPlan?.variants &&
          subscriptionPlan.variants.map((variant: SubscriptionVariant) => {
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
                        {getSubscriptionVariantPrice(
                          variant.monthlyCredits,
                          subscriptionPlan,
                        )}
                      </div>
                      <p className="text-sm font-normal">
                        {__('subscriptions_summary_per_month')}
                      </p>
                    </div>
                    <Button
                      isEnabled={true}
                      onClick={() =>
                        handleNext(
                          subscriptionPlan.priceId,
                          variant.monthlyCredits,
                        )
                      }
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
      subscriptionPlans: results.value.plans,
      slug: query.slug,
    };
  } catch (err: unknown) {
    return {
      subscriptionPlans: [],
    };
  }
};

export default SubscriptionPlanPage;
