import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import CitizenEligibility from '../../../components/CitizenEligibility';
import PageError from '../../../components/PageError';
import Wallet from '../../../components/Wallet';
import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  LinkButton,
  ProgressBar,
} from '../../../components/ui';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { WalletState } from '../../../contexts/wallet';
import { useConfig } from '../../../hooks/useConfig';
import { CitizenshipConfig } from '../../../types';
import { SubscriptionPlan } from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { reportIssue } from '../../../utils/reporting.utils';
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

  const { PLATFORM_NAME, DISCORD_URL } = useConfig();

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

  const [isEligible, setIsEligible] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isSpaceHostVouchRequired = citizenshipConfig?.isSpaceHostVouchRequired;

  const minVouches = citizenshipConfig?.minVouches || 3;

  const getCtaButtonText = () => {
    if (isMember) {
      return t('subscriptions_citizen_already_member');
    }

    if (isEligible) {
      return t('subscriptions_citizen_apply');
    }

    return t('booking_button_continue');
  };

  useEffect(() => {
    (async () => {
      try {
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

        console.log(
          '=====================hasStayedForMinDurationLocal=',
          hasStayedForMinDurationLocal,
        );
        console.log('user?.reportedB=', user?.reportedBy);
        console.log('user?.reports=', user?.reports);

        console.log(
          'eligible=',
          isVouchedLocal &&
          hasStayedForMinDurationLocal &&
            (user?.reportedBy?.length === 0 || !user?.reportedBy) &&
            (user?.reports?.length === 0 || !user?.reports),
        );

        setIsEligible(
          // isVouchedLocal &&
            hasStayedForMinDurationLocal &&
            (user?.reportedBy?.length === 0 || !user?.reportedBy) &&
            (user?.reports?.length === 0 || !user?.reports),
        );
      } catch (error) {}
    })();
  }, [owns30Tokens, isMember]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [user, isLoading]);

  const goBack = () => {
    router.push('/citizenship');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  const handleNext = async () => {
    setApiError(null);

    if (isMember) {
      router.push('/token');
      return;
    }
    try {
      const res = await api.post('/subscription/citizen/apply', {
        owns30Tokens,
      });

      if (res.data.status === 'success') {
        router.push('/subscriptions/citizen/success?intent=apply');
        return;
      }

      if (isEligible) {
        router.push('/subscriptions/citizen/success?intent=apply');
        return;
      }
    } catch (err: any) {
      if (err?.response?.status === 400 && err?.response?.data?.error) {
        setApiError(err.response.data.error);
      } else {
        setApiError(parseMessageFromError(err));
      }
    }
  };

  if (!user && !isLoading) {
    reportIssue(
      `Issue with authentication on subscriptions/citizen/validation: ${error}`,
      'N/A',
    ).catch((err) => console.error('Failed to report issue:', err));
    return <PageNotFound error="" />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true') {
    reportIssue(
      `NEXT_PUBLIC_FEATURE_CITIZENSHIP not true in prod on subscriptions/citizen/validation: ${error}`,
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

        <main className="pt-14 pb-24 space-y-6">
          <section className="mb-10 space-y-6">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              {isMember
                ? t('subscriptions_citizen_already_member')
                : isEligible === false
                ? t('subscriptions_citizen_not_eligible')
                : t('subscriptions_citizen_eligible')}
            </Heading>
            {isMember && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <p className="font-bold text-green-700 mb-2">
                  {t('subscriptions_citizen_already_member_title')}
                </p>
                <p>{t('subscriptions_citizen_already_member_description')}</p>
              </div>
            )}
          </section>
          {!isMember && (
            <section className="space-y-6">
              <CitizenEligibility
                userReports={user?.reports || []}
                userSubscription={user?.subscription}
                hasStayedForMinDuration={hasStayedForMinDuration}
                isVouched={isVouched}
                owns30Tokens={owns30Tokens}
                minVouches={minVouches}
                isSpaceHostVouchRequired={isSpaceHostVouchRequired}
              />
            </section>
          )}

          {!isVouched && DISCORD_URL && (
            <div>
              {t('subscriptions_citizen_introduce_yourself_in_discord')}
              <Link
                className="text-primary underline"
                href={DISCORD_URL || ''}
                target="_blank"
              >
                {' '}
                {DISCORD_URL || ''}
              </Link>
            </div>
          )}
          {!hasStayedForMinDuration && (
            <div>
              <LinkButton variant="secondary" href="/stay" target="_blank">
                {t('navigation_stay')}
              </LinkButton>
            </div>
          )}

          {isWalletEnabled && !isEligible ? (
            <div className="my-8 space-y-6">
              <p>
                <strong>{t('subscriptions_citizen_connect_wallet')}</strong>
              </p>
              <Wallet />
            </div>
          ) : null}

          {isEligible && (
            <div className="py-4">
              {apiError && <ErrorMessage error={apiError} />}
              <Button onClick={handleNext}>{getCtaButtonText()}</Button>
            </div>
          )}
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
