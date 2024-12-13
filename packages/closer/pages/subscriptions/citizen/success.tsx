import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import PageError from '../../../components/PageError';
import {
  BackButton,
  Button,
  Heading,
  ProgressBar,
  Row,
} from '../../../components/ui';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import {
  DEFAULT_CURRENCY,
  MAX_CREDITS_PER_MONTH,
  SUBSCRIPTION_CITIZEN_STEPS,
  SUBSCRIPTION_STEPS,
} from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig, PaymentConfig } from '../../../types';
import {
  SelectedPlan,
  SubscriptionPlan, // Tier,
} from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import {
  calculateSubscriptionPrice,
  getVatInfo,
  priceFormat,
} from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { prepareSubscriptions } from '../../../utils/subscriptions.helpers';
import PageNotFound from '../../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };
  paymentConfig: PaymentConfig | null;
  generalConfig: GeneralConfig | null;
  error?: string;
}

const SuccessCitizenPage: NextPage<Props> = ({
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

  const [authTokenData, setAuthTokenData] = useState();
  const [accessToken, setAccessToken] = useState();
  const [copied, setCopied] = useState(false);

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

  const applyCitizen = async () => {
    console.log('applyCitizen');

    // const { setAccessToken } = useAppContext();
    console.log(
      'quer',
      new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
    );
    const fetchAccessToken = async () => {
      setCopied(false);
      fetch('https://api.monerium.dev/auth/token', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
        body: new URLSearchParams({
          client_id: '1b3a17ef-460f-47b0-84c6-4495e18589b3',
          client_secret: 'samplepassword',
          grant_type: 'client_credentials',
        }),
      }).then(async (res) => {
        const data = await res.json();
        setAuthTokenData(data);
        setAccessToken(data.access_token);
      });
    };
  };

  return (
    <>
      <Head>
        <title>{`${t('subscriptions_apply_ttile')} - ${t(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
         {t('subscriptions_apply_ttile')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_CITIZEN_STEPS} />

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
                )} ${getVatInfo(
                  {
                    val: total,
                    cur: DEFAULT_CURRENCY,
                  },
                  vatRate,
                )} ${t('subscriptions_summary_per_month')}`}
              />
            }
          </div>
          <Button
            isEnabled={true}
            className="booking-btn"
            onClick={applyCitizen}
          >
            {t('apply_submit_button')}
          </Button>
        </main>
      </div>
    </>
  );
};

SuccessCitizenPage
.getInitialProps = async (
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

export default SuccessCitizenPage
;
