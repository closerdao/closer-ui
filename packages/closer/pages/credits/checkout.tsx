import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import CreditsCheckoutForm from '../../components/CreditsCheckoutForm';
import PageError from '../../components/PageError';
import { BackButton, ErrorMessage, Heading, Row } from '../../components/ui/';

import { NextPage } from 'next';

import PageNotFound from '../404';
import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { FundraisingConfig, GeneralConfig, PaymentConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __, getVatInfo, priceFormat } from '../../utils/helpers';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY as string,
);

interface Props {
  fundraisingConfig: FundraisingConfig | null;
  paymentConfig: PaymentConfig | null;
  generalConfig: GeneralConfig | null;
  apiError?: string;
}

const CreditsCheckoutPage: NextPage<Props> = ({
  fundraisingConfig,
  paymentConfig,
  generalConfig,
  apiError,
}) => {
  const CREDIT_PACKAGES = ['30', '90', '180'];
  const { APP_NAME } = useConfig();
  const router = useRouter();

  const isCreditPaymentEnabled =
    process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true' &&
    fundraisingConfig?.enabled;

  const { amount } = router.query;

  const getTotal = () => {
    if (!fundraisingConfig) {
      return 0;
    }
    switch (amount) {
      case '30':
        return 30 * fundraisingConfig?.creditPrice30Credits;
      case '90':
        return 90 * fundraisingConfig?.creditPrice90Credits;
      case '180':
        return 180 * fundraisingConfig?.creditPrice180Credits;
      default:
        return 0;
    }
  };

  const total = getTotal();
  const isPaymentEnabled = paymentConfig?.enabled || false;

  const { isAuthenticated, user } = useAuth();

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [isAuthenticated]);

  const goBack = () => {
    router.push('/support-us');
  };

  if (!isCreditPaymentEnabled) {
    return <PageNotFound />;
  }

  if (!CREDIT_PACKAGES.includes(amount as string)) {
    return <PageError error="No package available" />;
  }
  if (apiError) {
    return <PageError error={apiError} />;
  }

  return (
    <>
      <Head>
        <title>{`${__('subscriptions_checkout_title')} - ${
          APP_NAME && __('carrots_heading', APP_NAME)
        } - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          💰 {__('subscriptions_checkout_title')}
        </Heading>

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-10">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              {APP_NAME && __('carrots_balance', APP_NAME)}{' '}
              {APP_NAME && __('carrots_heading', APP_NAME)}
            </Heading>

            {
              <Row
                className="mb-4"
                rowKey={String(amount)}
                value={total ? priceFormat(total, DEFAULT_CURRENCY) : '0'}
                additionalInfo={`${__(
                  'bookings_checkout_step_total_description',
                )} ${getVatInfo({
                  val: total,
                  cur: DEFAULT_CURRENCY,
                })}`}
              />
            }
          </div>

          <div className="mb-14">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              <span className="mr-2">💲</span>
              {__('subscriptions_checkout_payment_subtitle')}
            </Heading>
            <div className="mb-10">
              {isPaymentEnabled ? (
                <Elements stripe={stripePromise}>
                  <CreditsCheckoutForm
                    userEmail={user?.email}
                    credits={Number(amount)}
                  />
                </Elements>
              ) : (
                <ErrorMessage error={__('checkout_payment_disabled_error')} />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

CreditsCheckoutPage.getInitialProps = async () => {
  try {
    const [fundraiserRes, paymentRes, generalRes] = await Promise.all([
      api.get('/config/fundraiser').catch(() => {
        return null;
      }),
      api.get('/config/payment').catch(() => {
        return null;
      }),
      api.get('/config/general').catch(() => {
        return null;
      }),
    ]);

    const fundraisingConfig = fundraiserRes?.data?.results?.value;
    const paymentConfig = paymentRes?.data?.results?.value;
    const generalConfig = generalRes?.data?.results?.value;
    return {
      fundraisingConfig,
      paymentConfig,
      generalConfig,
    };
  } catch (err: unknown) {
    return {
      fundraisingConfig: null,
      paymentConfig: null,
      generalConfig: null,
      apiError: parseMessageFromError(err),
    };
  }
};

export default CreditsCheckoutPage;
