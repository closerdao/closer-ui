import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { Button, Card } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { NextPage } from 'next';

import PageNotFound from '../404';
import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { SubscriptionPlan } from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __, getCurrencySymbol } from '../../utils/helpers';

const STAY_BOOKING_ALLOWED_PLANS = ['wanderer', 'pioneer', 'sheep'];
const MIN_ALLOWED_PLAN = 'wanderer';

interface Props {
  subscriptionPlans: SubscriptionPlan[];
}

const UnlockStaysPage: NextPage<Props> = ({ subscriptionPlans }) => {
  const allowedSubscriptionPlan = subscriptionPlans.find(
    (plan: SubscriptionPlan) => plan.slug === MIN_ALLOWED_PLAN,
  );

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (
        user.subscription &&
        user.subscription.plan &&
        STAY_BOOKING_ALLOWED_PLANS.includes(user.subscription.plan)
      ) {
        router.push('/bookings/create/dates');
      }
    }
  }, [user]);

  const handleSubscribe = () => {
    router.push('/subscriptions');
  };

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{__('carrots_heading')}</title>
      </Head>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full main-content w-full flex flex-col gap-12  min-h-screen py-2">
        <div className="bg-accent-light rounded-md p-6 flex flex-wrap content-center justify-center">
          <Heading level={1} className="flex justify-center flex-wrap">
            🔒 {__('unlock_stays_heading')}
          </Heading>
          <Heading
            level={2}
            className="p-4 text-xl text-center font-normal w-full"
          >
            {__('unlock_stays_subheading')}
          </Heading>
        </div>

        <Card key={allowedSubscriptionPlan?.title} className={'w-full p-8  '}>
          <div className="flex flex-col gap-4">
            <div className="w-[90%] md:w-[60%]">
              <Heading level={2} className="border-b-0 mb-6">
                {allowedSubscriptionPlan?.title}
              </Heading>

              <div className="text-6xl font-bold mb-8">
                {getCurrencySymbol(DEFAULT_CURRENCY)}
                {allowedSubscriptionPlan?.price}

                <span className="pl-1 text-lg">
                  {__('subscriptions_summary_per_month')}
                </span>
              </div>

              <ul className="mb-4">
                {allowedSubscriptionPlan?.perks.map((perk) => {
                  return (
                    <li
                      key={perk}
                      className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                    >
                      <span className="block">{perk}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Button
              isEnabled={true}
              onClick={handleSubscribe}
              isFullWidth={true}
              size="medium"
            >
              {__('subscriptions_subscribe_button')}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

UnlockStaysPage.getInitialProps = async () => {
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

export default UnlockStaysPage;