import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import SubscriptionCheckoutForm from '../../components/SubscriptionCheckoutForm';
import { BackButton, Heading, ProgressBar, Row } from '../../components/ui/';

import { NextPage } from 'next';

import Page404 from '../404';
import { DEFAULT_CURRENCY, SUBSCRIPTION_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import {
  SelectedPlan,
  SubscriptionPlan,
  SubscriptionVariant,
} from '../../types/subscriptions';
import api from '../../utils/api';
import {
  __,
  getSubscriptionVariantPrice,
  getVatInfo,
  priceFormat,
} from '../../utils/helpers';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUB_KEY as string,
);

interface Props {
  subscriptionPlans: SubscriptionPlan[];
}

const SubscriptionsCheckoutPage: NextPage<Props> = ({
  subscriptionPlans,
}: Props) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { priceId, monthlyCredits } = router.query;
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

      if (selectedSubscription?.variants) {
        const selectedVariant = selectedSubscription.variants.find(
          (variant: SubscriptionVariant) =>
            variant.monthlyCredits === Number(monthlyCredits),
        );
        setSelectedPlan({
          title: `${selectedSubscription?.title as string} - ${
            selectedVariant?.title as string
          }`,
          monthlyCredits: Number(monthlyCredits),
          price: getSubscriptionVariantPrice(
            Number(monthlyCredits),
            selectedSubscription,
          ) as number,
          variants: selectedSubscription?.variants,
          tiers: selectedSubscription?.tiers,
        });
      } else {
        setSelectedPlan({
          title: selectedSubscription?.title as string,
          monthlyCredits: selectedSubscription?.monthlyCredits as number,
          price: selectedSubscription?.price as number,
        });
      }
    }
  }, [priceId]);

  const goBack = () => {
    router.push(
      `/subscriptions/summary?priceId=${priceId}&monthlyCredits=${monthlyCredits}`,
    );
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

        <Heading level={1} className="mb-4">
          💰 {__('subscriptions_checkout_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-10">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              <span className="mr-2">♻️</span>
              {__('subscriptions_title')}
            </Heading>

            <Row
              className="mb-4"
              rowKey={` ${selectedPlan?.title} ${
                Number(monthlyCredits)
                  ? `- ${Number(selectedPlan?.monthlyCredits)}
                    ${__('subscriptions_credits_included')}`
                  : ''
              }  `}
              value={`${
                selectedPlan &&
                priceFormat(
                  getSubscriptionVariantPrice(monthlyCredits, selectedPlan),
                  DEFAULT_CURRENCY,
                )
              }`}
              additionalInfo={`${__(
                'bookings_checkout_step_total_description',
              )} ${getVatInfo({
                val: selectedPlan?.price,
                cur: DEFAULT_CURRENCY,
              })} ${__('subscriptions_summary_per_month')}`}
            />
          </div>

          <div className="mb-14">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              <span className="mr-2">💲</span>
              {__('subscriptions_checkout_payment_subtitle')}
            </Heading>
            <div className="mb-10">
              <Elements stripe={stripePromise}>
                <SubscriptionCheckoutForm
                  userEmail={user?.email}
                  priceId={priceId}
                  monthlyCredits={Number(monthlyCredits)}
                />
              </Elements>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

SubscriptionsCheckoutPage.getInitialProps = async () => {
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
    };
  }
};

export default SubscriptionsCheckoutPage;
