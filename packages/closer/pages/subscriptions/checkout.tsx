import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import PageError from '../../components/PageError';
import SubscriptionCheckoutForm from '../../components/SubscriptionCheckoutForm';
import {
  BackButton,
  ErrorMessage,
  Heading,
  ProgressBar,
  Row,
} from '../../components/ui/';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import {
  DEFAULT_CURRENCY,
  MAX_CREDITS_PER_MONTH,
  SUBSCRIPTION_STEPS,
} from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig, PaymentConfig } from '../../types';
import {
  SelectedPlan,
  SubscriptionPlan, // Tier,
} from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import {
  calculateSubscriptionPrice,
  getVatInfo,
  priceFormat,
} from '../../utils/helpers';
import { loadLocaleData } from '../../utils/locale.helpers';
import { prepareSubscriptions } from '../../utils/subscriptions.helpers';
import PageNotFound from '../not-found';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY as string,
  {
    stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT
  }
);

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };
  paymentConfig: PaymentConfig | null;
  generalConfig: GeneralConfig | null;
  error?: string;
}

const SubscriptionsCheckoutPage: NextPage<Props> = ({
  subscriptionsConfig,
  paymentConfig,
  generalConfig,
  error,
}) => {
  const t = useTranslations();
  const isPaymentEnabled = paymentConfig?.enabled || false;
  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const subscriptionPlans = prepareSubscriptions(subscriptionsConfig);
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { priceId, monthlyCredits, source } = router.query;
  const defaultVatRate = Number(process.env.NEXT_PUBLIC_VAT_RATE) || 0;
  const vatRateFromConfig = Number(paymentConfig?.vatRate);
  const vatRate = vatRateFromConfig || defaultVatRate;
  
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>();

  const monthlyCreditsSelected = Math.min(
    parseFloat(monthlyCredits as string) || selectedPlan?.monthlyCredits || 0,
    MAX_CREDITS_PER_MONTH,
  );
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

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
    if (priceId && subscriptionPlans) {
      const selectedSubscription = subscriptionPlans.find(
        (plan: SubscriptionPlan) => plan.priceId.includes(priceId as string),
      );

      setSelectedPlan({
        title: selectedSubscription?.title as string,
        monthlyCredits: selectedSubscription?.monthlyCredits as number,
        price: selectedSubscription?.price as number,
        tiersAvailable: selectedSubscription?.tiersAvailable as boolean,
      });
    }
  }, [priceId]);

  const goBack = () => {
    router.push(
      `/subscriptions/summary?priceId=${priceId}&monthlyCredits=${monthlyCredits}`,
    );
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  const total = calculateSubscriptionPrice(
    selectedPlan,
    monthlyCreditsSelected,
  );

  return (
    <>
      <Head>
        <title>{`${t('subscriptions_checkout_title')} - ${t(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          💰 {t('subscriptions_checkout_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_STEPS} />

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-10">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              <span className="mr-2">♻️</span>
              {t('subscriptions_title')}
            </Heading>

            {
              <Row
                className="mb-4"
                rowKey={` ${selectedPlan?.title} ${
                  Number(monthlyCreditsSelected)
                    ? `- ${Number(monthlyCreditsSelected)}
                      ${t('subscriptions_credits_included')}`
                    : ''
                }  `}
                value={`${
                  selectedPlan && priceFormat(total, DEFAULT_CURRENCY)
                }`}
                additionalInfo={`${t(
                  'bookings_checkout_step_total_description',
                )} ${getVatInfo({
                  val: total,
                  cur: DEFAULT_CURRENCY,
                }, vatRate)} ${t('subscriptions_summary_per_month')}`}
              />
            }
          </div>

          <div className="mb-14">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              <span className="mr-2">💲</span>
              {t('subscriptions_checkout_payment_subtitle')}
            </Heading>
            <div className="mb-10">
              {isPaymentEnabled ? (
                <Elements stripe={stripePromise}>
                  <SubscriptionCheckoutForm
                    userEmail={user?.email}
                    priceId={priceId}
                    monthlyCredits={Number(monthlyCredits)}
                    source={source as string}
                  />
                </Elements>
              ) : (
                <ErrorMessage error={t('checkout_payment_disabled_error')} />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

SubscriptionsCheckoutPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const [subscriptionsRes, paymentRes, generalRes, messages] =
      await Promise.all([
        api.get('/config/subscriptions').catch(() => {
          return null;
        }),
        api.get('/config/payment').catch(() => {
          return null;
        }),
        api.get('/config/general').catch(() => {
          return null;
        }),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;
    const paymentConfig = paymentRes?.data?.results?.value;
    const generalConfig = generalRes?.data?.results?.value;
    return {
      subscriptionsConfig,
      paymentConfig,
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },
      paymentConfig: null,
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default SubscriptionsCheckoutPage;
