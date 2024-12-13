import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import PageError from '../../../components/PageError';
import {
  BackButton,
  Heading,
  LinkButton,
  ProgressBar
} from '../../../components/ui';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { MAX_CREDITS_PER_MONTH, SUBSCRIPTION_CITIZEN_STEPS, SUBSCRIPTION_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig } from '../../../types';
import {
  SelectedPlan,
  SubscriptionPlan, // Tier,
} from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { prepareSubscriptions } from '../../../utils/subscriptions.helpers';
import PageNotFound from '../../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };

  generalConfig: GeneralConfig | null;
  error?: string;
}

const IntroCitizenPage: NextPage<Props> = ({
  subscriptionsConfig,

  generalConfig,
  error,
}) => {
  const t = useTranslations();
  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const subscriptionPlans = prepareSubscriptions(subscriptionsConfig);
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { priceId, monthlyCredits, source } = router.query;

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
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [user, isLoading]);

  const goBack = () => {
    router.push(
      `/subscriptions/summary?priceId=${priceId}&monthlyCredits=${monthlyCredits}`,
    );
  };

  const proceedToValidation = async () => {
    router.push('/subscriptions/citizen/validation');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }


  return (
    <>
      <Head>
        <title>{`${t('subscriptions_citizen_apply_title')} - ${t(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          {t('subscriptions_citizen_apply_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_CITIZEN_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-12">
          <section className="space-y-8">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              {t('subscriptions_citizen_intro_title')}
            </Heading>
            <p className="mb-4">{t('subscriptions_citizen_intro_text')}</p>
          </section>

          <section className="space-y-8">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              {t('subscriptions_citizen_perks_title')}
            </Heading>
            <ul className="mb-4">
              {t('subscriptions_citizen_perks_list')
                .split(',')
                .map((perk) => {
                  return (
                    <li
                      className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                      key={perk}
                    >
                      {perk}
                    </li>
                  );
                })}
            </ul>
          </section>
          <LinkButton href="/subscriptions/citizen/validation">
            
            {t('booking_button_continue')}
          </LinkButton>
        </main>
      </div>
    </>
  );
};

IntroCitizenPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subscriptionsRes, generalRes, messages] = await Promise.all([
      api.get('/config/subscriptions').catch(() => {
        return null;
      }),

      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;

    const generalConfig = generalRes?.data?.results?.value;
    return {
      subscriptionsConfig,

      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },
      generalConfig: null,

      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default IntroCitizenPage;
