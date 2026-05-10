import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import CreditsCheckoutForm from '../../components/CreditsCheckoutForm';
import { BackButton, ErrorMessage, Heading, Row } from '../../components/ui/';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { FundraisingConfig, GeneralConfig, PaymentConfig } from '../../types';
import { mergePaymentValueWithBookingCurrencyFallback } from '../../utils/config.utils';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { getVatInfo, priceFormat } from '../../utils/helpers';
import PageNotFound from '../not-found';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY as string,
);

interface Props {}

const CreditsCheckoutPage: NextPage<Props> = () => {
  const fundraisingConfig = getCachedConfig('fundraiser') as FundraisingConfig | null;
  const paymentConfig = (mergePaymentValueWithBookingCurrencyFallback(
    getCachedConfig('payment'),
    getCachedConfig('booking'),
  ) ?? null) as PaymentConfig | null;
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();
  const router = useRouter();

  const isCreditPaymentEnabled =
    process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true' &&
    fundraisingConfig?.enabled;

  const { amount } = router.query;

  const getTotal = () => {
    if (!fundraisingConfig) {
      return 0;
    }

    const numericAmount = parseInt(amount as string);

    const pricePerUnit = Number(fundraisingConfig?.creditPricePerUnit) || 30;
    return numericAmount * pricePerUnit;
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
    router.push('/fundraiser');
  };

  if (!isCreditPaymentEnabled) {
    return <PageNotFound />;
  }

  // if (!CREDIT_PACKAGES.includes(amount as string)) {
  //   return <PageError error="No package available" />;
  // }

  return (
    <>
      <Head>
        <title>{`${t('subscriptions_checkout_title')} - ${t(
          'carrots_heading',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          💰 {t('subscriptions_checkout_title')}
        </Heading>

        <main className="pt-14 pb-24 md:flex-row flex-wrap">
          <div className="mb-10">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              {t('carrots_balance')} {t('carrots_heading')}
            </Heading>

            {
              <Row
                className="mb-4"
                rowKey={String(amount)}
                value={total ? priceFormat(total, DEFAULT_CURRENCY) : '0'}
                additionalInfo={`${t(
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
              {t('subscriptions_checkout_payment_subtitle')}
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
                <ErrorMessage error={t('checkout_payment_disabled_error')} />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CreditsCheckoutPage;
