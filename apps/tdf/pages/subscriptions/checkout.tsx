import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import {
  BackButton,
  Heading,
  HeadingRow,
  Page404,
  ProgressBar,
  Row,
  SubscriptionCheckoutForm,
  api,
  useAuth,
  useConfig,
} from 'closer';
import { DEFAULT_CURRENCY, SUBSCRIPTION_STEPS } from 'closer/constants';
import { SelectedPlan, SubscriptionPlan } from 'closer/types/subscriptions';
import { __, getVatInfo, priceFormat } from 'closer/utils/helpers';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUB_KEY as string,
);

interface Props {
  subscriptionPlans: SubscriptionPlan[];
}

const Checkout = ({ subscriptionPlans }: Props) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { priceId } = router.query;
  const { PLATFORM_NAME } = useConfig() || {};
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();

  useEffect(() => {
    if (user?.subscription && user.subscription.priceId) {
      router.push('/subscriptions');
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (priceId) {
      const selectedSubscription = subscriptionPlans.find(
        (plan: SubscriptionPlan) => plan.priceId === priceId,
      );

      setSelectedPlan({
        title: selectedSubscription?.title as string,
        monthlyCredits: selectedSubscription?.monthlyCredits as number,
        price: selectedSubscription?.price as number,
      });
    }
  }, [priceId]);

  const goBack = () => {
    router.push(`/subscriptions/summary?priceId=${priceId}`);
  };

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return <Page404 error="" />;
  }

  return (
    <>
      <Head>
        <title>{`${__('subscriptions_checkout_title')} - ${__(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-6">
          💰 {__('subscriptions_checkout_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-10">
            <HeadingRow>
              <span className="mr-2">♻️</span>
              {__('subscriptions_title')}
            </HeadingRow>

            <Row
              className="mb-4"
              rowKey={selectedPlan?.title}
              value={`${priceFormat(selectedPlan?.price, DEFAULT_CURRENCY)}`}
              additionalInfo={`${__(
                'bookings_checkout_step_total_description',
              )} ${getVatInfo({
                val: selectedPlan?.price,
                cur: DEFAULT_CURRENCY,
              })} ${__('subscriptions_summary_per_month')}`}
            />
          </div>

          <div className="mb-14">
            <HeadingRow>
              <span className="mr-2">💲</span>
              {__('subscriptions_checkout_payment_subtitle')}
            </HeadingRow>
            <div className="mb-10">
              <Elements stripe={stripePromise}>
                <SubscriptionCheckoutForm
                  userEmail={user?.email}
                  priceId={priceId}
                />
              </Elements>
            </div>
          </div>
        </main>
      </div>
    </>
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

export default Checkout;
