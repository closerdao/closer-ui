import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { Button, Card } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { SubscriptionPlan } from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { getCurrencySymbol } from '../../utils/helpers';
import { loadLocaleData } from '../../utils/locale.helpers';
import { prepareSubscriptions } from '../../utils/subscriptions.helpers';
import PageNotFound from '../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };
  bookingConfig: any;
}

const UnlockStaysPage = ({ subscriptionsConfig, bookingConfig }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const subscriptionPlans = prepareSubscriptions(subscriptionsConfig);
  const config = useConfig();
  const { STAY_BOOKING_ALLOWED_PLANS, MIN_INSTANT_BOOKING_ALLOWED_PLAN } =
    config || {};

  const allowedSubscriptionPlan = subscriptionPlans.find(
    (plan: SubscriptionPlan) => plan.slug === MIN_INSTANT_BOOKING_ALLOWED_PLAN,
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

  if (
    !isBookingEnabled ||
    !subscriptionsConfig ||
    !subscriptionsConfig.enabled
  ) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{t('carrots_heading')}</title>
      </Head>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full main-content w-full flex flex-col gap-12  min-h-screen py-2">
        <div className="bg-accent-light rounded-md p-6 flex flex-wrap content-center justify-center">
          <Heading level={1} className="flex justify-center flex-wrap">
            🔒 {t('unlock_stays_heading')}
          </Heading>
          <Heading
            level={2}
            className="p-4 text-xl text-center font-normal w-full"
          >
            {t('unlock_stays_subheading')}
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
                  {t('subscriptions_summary_per_month')}
                </span>
              </div>

              <ul className="mb-4">
                {allowedSubscriptionPlan?.perks.split(',').map((perk) => {
                  return (
                    <li
                      key={perk}
                      className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                    >
                      <span className="block">
                        {perk.includes('<') ? (
                          <span dangerouslySetInnerHTML={{ __html: perk }} />
                        ) : (
                          perk
                        )}
                      </span>
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
              {t('subscriptions_subscribe_button')}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

UnlockStaysPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subscriptionsRes, bookingRes, messages] = await Promise.all([
      api.get('/config/subscriptions').catch(() => {
        return null;
      }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;
    const bookingConfig = bookingRes?.data?.results?.value;

    return {
      subscriptionsConfig,
      bookingConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },
      bookingConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default UnlockStaysPage;
