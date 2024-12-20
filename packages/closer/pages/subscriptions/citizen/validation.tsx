import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import CitizenGoodToBuy from '../../../components/CitizenGoodToBuy';
import CitizenNotEligible from '../../../components/CitizenNotEligible';
import PageError from '../../../components/PageError';
import Wallet from '../../../components/Wallet';
import {
  BackButton,
  Button,
  Heading,
  ProgressBar,
} from '../../../components/ui';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { WalletState } from '../../../contexts/wallet';
import { useConfig } from '../../../hooks/useConfig';
import { CitizenshipConfig } from '../../../types';
import { SubscriptionPlan } from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };

  citizenshipConfig: CitizenshipConfig | null;
  error?: string;
}

const ValidationCitizenPage: NextPage<Props> = ({
  subscriptionsConfig,
  citizenshipConfig,
  error,
}) => {
  const t = useTranslations();
  const { isLoading, user } = useAuth();
  const { PLATFORM_NAME } = useConfig();
  const { platform }: any = usePlatform();
  const router = useRouter();

  const { balanceTotal } = useContext(WalletState);

  const owns30Tokens = balanceTotal >= 30;

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';
  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const isMember = user?.roles?.includes('member');

  const [isVouched, setIsVouched] = useState(false);
  const [hasStayedForMinDuration, setHasStayedForMinDuration] = useState(false);
  const [apiError, setApiError] = useState('');
  const [eligibility, setEligibility] = useState<null | string>(null);
  const [application, setApplication] = useState<any>({
    owns30Tokens,
    why: '',
    intent: {
      iWantToApply: Boolean(owns30Tokens) && !isMember,
      iWantToBuyTokens: false,
      iWantToFinanceTokens: true,
    },
  });

  const minVouches = citizenshipConfig?.minVouches || 3;

  const getCtaButtonText = () => {
    switch (eligibility) {
      case 'good_to_buy':
        if (application?.intent?.iWantToBuyTokens) {
          return t('navigation_buy_token');
        } else {
          return t('booking_button_continue');
        }
      case 'buy_more':
        if (application?.intent?.iWantToBuyTokens) {
          return t('navigation_buy_token');
        } else if (application?.intent?.iWantToApply) {
          return t('subscriptions_citizen_apply');
        } else {
          return t('booking_button_continue');
        }
      case 'not_eligible':
        return t('subscriptions_citizen_see_other_ways');
      default:
        return t('booking_button_continue');
    }
  };

  useEffect(() => {
    if (owns30Tokens) {
      setApplication((prev: any) => ({
        ...prev,
        owns30Tokens,
        intent: {
          ...prev.intent,
          iWantToApply: false,
          iWantToFinanceTokens: true,
          iWantToBuyTokens: false,
        },
      }));
    }
    (async () => {
      try {
        setApiError('');
        const hasStayedRes = await api.get(
          '/subscription/citizen/check-has-stayed-for-min-duration',
        );

        const hasStayedForMinDurationLocal =
          hasStayedRes?.data?.hasStayedForMinDuration;

        setHasStayedForMinDuration(hasStayedForMinDurationLocal);
        const isVouchedRes = await api.get(
          '/subscription/citizen/check-is-vouched',
        );
        const isVouchedLocal = isVouchedRes?.data?.isVouched;

        setIsVouched(isVouchedLocal);

        if (isVouchedLocal && hasStayedForMinDurationLocal && owns30Tokens) {
          setEligibility('buy_more');
        } else if (
          (isVouchedLocal && hasStayedForMinDurationLocal) ||
          isMember
        ) {
          setEligibility('good_to_buy');
        } else {
          setEligibility('not_eligible');
        }
      } catch (error) {
        setApiError(parseMessageFromError(error));
      }
    })();
  }, [owns30Tokens, isMember]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [user, isLoading]);

  const updateApplication = (key: string, value: any) => {
    setApplication((prev: any) => ({ ...prev, [key]: value }));
  };

  const goBack = () => {
    router.push('/subscriptions/');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  const handleNext = async () => {
    switch (eligibility) {
      case 'good_to_buy':
        if (application?.intent?.iWantToBuyTokens) {
          router.push('/token/before-you-begin?isCitizenApplication=true');
          return;
        } else {
          router.push(
            `/subscriptions/citizen/apply?intent=finance&why=${application?.why}`,
          );
          return;
        }
      case 'buy_more':
        if (application?.intent?.iWantToBuyTokens) {
          router.push('/token/before-you-begin?isCitizenApplication=true');
          return;
        } else if (application?.intent?.iWantToApply) {
          router.push(
            `/subscriptions/citizen/apply?intent=apply&why=${application?.why}`,
          );
          return;
        } else {
          router.push(
            `/subscriptions/citizen/apply?intent=finance&why=${application?.why}`,
          );
          return;
        }
      case 'not_eligible':
        router.push('/#how-to-play');
        return;
    }
  };

  if (!user && !isLoading) {
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

        <main className="pt-14 pb-24 space-y-6">
          <section className="mb-10 space-y-6">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              {eligibility === 'good_to_buy' || eligibility === 'buy_more'
                ? t('subscriptions_citizen_good_to_go')
                : t('subscriptions_citizen_not_eligible')}
            </Heading>
            <p>{t('subscriptions_citizen_good_to_go_intro')}</p>
          </section>

          <section className="space-y-6">
            {eligibility === 'not_eligible' && (
              <CitizenNotEligible
                userReports={user?.reports || []}
                userSubscription={user?.subscription}
                hasStayedForMinDuration={hasStayedForMinDuration}
                isVouched={isVouched}
                owns30Tokens={owns30Tokens}
                minVouches={minVouches}
              />
            )}
            {eligibility === 'good_to_buy' && (
              <CitizenGoodToBuy
                updateApplication={updateApplication}
                application={application}
              />
            )}
            {eligibility === 'buy_more' && (
              <CitizenGoodToBuy
                buyMore={true}
                updateApplication={updateApplication}
                application={application}
              />
            )}
          </section>

          {isWalletEnabled &&
          (eligibility === 'buy_more' || eligibility === 'not_eligible') ? (
            <div className="my-8 space-y-6">
              <p>
                <strong>{t('subscriptions_citizen_connect_wallet')}</strong>
              </p>
              <Wallet />
            </div>
          ) : null}

          <div className="py-4">
            <Button
              isEnabled={
                eligibility !== 'not_eligible'
                  ? Boolean(application?.why)
                  : true
              }
              onClick={handleNext}
            >
              {getCtaButtonText()}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

ValidationCitizenPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subscriptionsRes, citizenshipRes, messages] = await Promise.all([
      api.get('/config/subscriptions').catch(() => {
        return null;
      }),

      api.get('/config/citizenship').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;

    const citizenshipConfig = citizenshipRes?.data?.results?.value;
    return {
      subscriptionsConfig,
      citizenshipConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },
      citizenshipConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default ValidationCitizenPage;
