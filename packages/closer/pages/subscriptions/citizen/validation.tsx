import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import CitizenGoodToBuy from '../../../components/CitizenGoodToBuy';
import CitizenQuests from '../../../components/CitizenQuests';
import Wallet from '../../../components/Wallet';
import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  ProgressBar,
} from '../../../components/ui';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { WalletState } from '../../../contexts/wallet';
import { useConfig } from '../../../hooks/useConfig';
import { CitizenshipConfig } from '../../../types';
import {
  CitizenApplication,
  SubscriptionPlan,
} from '../../../types/subscriptions';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { reportIssue } from '../../../utils/reporting.utils';
import PageNotFound from '../../not-found';

const ValidationCitizenPage: NextPage = () => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as {
    enabled: boolean;
    elements: SubscriptionPlan[];
  };

  const citizenshipConfig = getCachedConfig(
    'citizenship',
  ) as CitizenshipConfig | null;
  const t = useTranslations();
  const { isLoading, user } = useAuth();

  const { PLATFORM_NAME } = useConfig();

  const router = useRouter();

  const {
    balanceTotal,
    isWalletConnected,
    isCorrectNetwork,
    hasSameConnectedAccount,
  } = useContext(WalletState);

  const tokensRequired = citizenshipConfig?.tokensRequired ?? 30;
  const ownsRequiredTokens = (balanceTotal || 0) >= tokensRequired;

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';
  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const isMember = user?.roles?.includes('member');

  const [isVouched, setIsVouched] = useState(false);
  const [hasStayedForMinDuration, setHasStayedForMinDuration] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [application, setApplication] = useState<CitizenApplication>({
    ownsRequiredTokens,
    why: user?.citizenship?.why || '',
    hasSelectedTokenIntent: false,
    intent: {
      iWantToApply: Boolean(ownsRequiredTokens) && !isMember,
      iWantToBuyTokens: false,
      iWantToFinanceTokens: false,
    },
  });

  const isSpaceHostVouchRequired = citizenshipConfig?.isSpaceHostVouchRequired;
  const minVouches = citizenshipConfig?.minVouches ?? 3;
  const vouchCount = user?.vouched?.length || 0;

  const hasNoReports =
    (user?.reportedBy?.length === 0 || !user?.reportedBy) &&
    (user?.reports?.length === 0 || !user?.reports);

  const isTokensComplete =
    ownsRequiredTokens ||
    (application.hasSelectedTokenIntent &&
      (Boolean(application.intent.iWantToBuyTokens) ||
        Boolean(application.intent.iWantToFinanceTokens)));

  const tokensProgress = Math.min(1, (balanceTotal || 0) / tokensRequired);

  const isEligible =
    hasStayedForMinDuration &&
    isVouched &&
    ownsRequiredTokens &&
    hasNoReports;

  const getCtaButtonText = () => {
    if (isMember) {
      return t('subscriptions_citizen_already_member');
    }

    if (application.intent.iWantToBuyTokens) {
      return t('token_sale_public_sale_buy_token');
    }

    if (application.intent.iWantToFinanceTokens) {
      return t('subscriptions_citizen_start_financed_plan');
    }

    if (isEligible) {
      return t('subscriptions_citizen_apply');
    }

    return t('booking_button_continue');
  };

  const isCtaEnabled = () => {
    if (isMember) {
      return true;
    }

    if (application.intent.iWantToBuyTokens || application.intent.iWantToFinanceTokens) {
      return application.hasSelectedTokenIntent;
    }

    return isEligible;
  };

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    (async () => {
      try {
        const hasStayedRes = await api.get(
          '/subscription/citizen/check-has-stayed-for-min-duration',
        );

        const hasStayedForMinDurationLocal =
          hasStayedRes?.data?.hasStayedForMinDuration;

        setHasStayedForMinDuration(Boolean(hasStayedForMinDurationLocal));

        const isVouchedRes = await api.get(
          '/subscription/citizen/check-is-vouched',
        );

        const isVouchedLocal = isVouchedRes?.data?.isVouched;

        setIsVouched(Boolean(isVouchedLocal));
      } catch (error) {}
    })();
  }, [ownsRequiredTokens, isMember, user?._id]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
      return;
    }

    if (isLoading || !router.isReady) {
      return;
    }

    const comingFromWhy = router.query.intent === 'apply';

    if (
      user &&
      !isMember &&
      !user?.citizenship?.why &&
      !user?.citizenship?.status &&
      !comingFromWhy
    ) {
      router.replace('/subscriptions/citizen/why');
    }
  }, [user, isLoading, isMember, router]);

  useEffect(() => {
    if (ownsRequiredTokens) {
      setApplication((prev) => ({
        ...prev,
        ownsRequiredTokens,
        intent: {
          ...prev.intent,
          iWantToApply: !isMember,
          iWantToFinanceTokens: false,
          iWantToBuyTokens: false,
        },
      }));
    }
  }, [ownsRequiredTokens, isMember]);

  const goBack = () => {
    router.push('/subscriptions/citizen/why');
  };

  const updateApplication = (
    key: keyof CitizenApplication,
    value: CitizenApplication[keyof CitizenApplication],
  ) => {
    setApplication((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'intent' ? { hasSelectedTokenIntent: true } : {}),
    }));
  };

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  const handleNext = async () => {
    setApiError(null);

    if (isMember) {
      router.push('/token');
      return;
    }

    if (application.intent.iWantToBuyTokens) {
      const tokensMissing = tokensRequired - (balanceTotal || 0);
      const tokensToBuy = tokensMissing > 0 ? tokensMissing : tokensRequired;
      router.push(
        `/token/before-you-begin?citizenApplication=true&tokens=${tokensToBuy}`,
      );
      return;
    }

    if (application.intent.iWantToFinanceTokens) {
      router.push('/token/finance?citizenApplication=true');
      return;
    }

    try {
      const res = await api.post('/subscription/citizen/apply', {
        owns30Tokens: ownsRequiredTokens,
      });

      if (res.data.status === 'success' || isEligible) {
        router.push('/subscriptions/citizen/success?intent=apply');
        return;
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: string } } };
      if (error?.response?.status === 400 && error?.response?.data?.error) {
        setApiError(error.response.data.error);
      } else {
        setApiError(parseMessageFromError(err));
      }
    }
  };

  if (!user && !isLoading) {
    reportIssue(
      'Issue with authentication on subscriptions/citizen/validation',
      'N/A',
    ).catch((err) => console.error('Failed to report issue:', err));
    return <PageNotFound error="" />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true') {
    reportIssue(
      'NEXT_PUBLIC_FEATURE_CITIZENSHIP not true in prod on subscriptions/citizen/validation',
      user?.email,
    ).catch((err) => console.error('Failed to report issue:', err));

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

        <main className="pt-14 pb-24 flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <Heading level={2} className="border-b pb-2 text-xl">
              {isMember
                ? t('subscriptions_citizen_already_member')
                : t('subscriptions_citizen_quests_title')}
            </Heading>
            {isMember && (
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <p className="mb-2 font-bold text-green-700">
                  {t('subscriptions_citizen_already_member_title')}
                </p>
                <p>{t('subscriptions_citizen_already_member_description')}</p>
              </div>
            )}
            {!isMember && (
              <p className="text-sm text-gray-600">
                {t('subscriptions_citizen_quests_subtitle')}
              </p>
            )}
          </section>

          <CitizenQuests
            hasStayedForMinDuration={hasStayedForMinDuration}
            isTokensComplete={isTokensComplete}
            isVouched={isVouched}
            hasNoReports={hasNoReports}
            vouchCount={vouchCount}
            minVouches={minVouches}
            isSpaceHostVouchRequired={isSpaceHostVouchRequired}
            tokensProgress={tokensProgress}
            showEligibilityQuests={!isMember}
            tokensCard={
              <>
                {isWalletConnected &&
                  isCorrectNetwork &&
                  hasSameConnectedAccount && (
                    <p className="mb-3 text-sm font-bold">
                      {t('subscriptions_citizen_you_hold', {
                        var: balanceTotal,
                      })}
                    </p>
                  )}
                <CitizenGoodToBuy
                  updateApplication={updateApplication}
                  application={application}
                  buyMore={ownsRequiredTokens}
                  balanceTotal={balanceTotal}
                  tokensRequired={tokensRequired}
                />
              </>
            }
          />

          {isWalletEnabled ? (
            <div className="my-4 flex flex-col gap-4">
              <p>
                <strong>{t('subscriptions_citizen_connect_wallet')}</strong>
              </p>
              <Wallet />
            </div>
          ) : null}

          <div className="py-4">
            {apiError && <ErrorMessage error={apiError} />}
            <Button isEnabled={isCtaEnabled()} onClick={handleNext}>
              {getCtaButtonText()}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default ValidationCitizenPage;
