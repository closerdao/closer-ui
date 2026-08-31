import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import CitizenQuestsPanel from '../../components/CitizenQuests/CitizenQuestsPanel';
import Wallet from '../../components/Wallet';
import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  ProgressBar,
} from '../../components/ui';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useCitizenQuests } from '../../hooks/useCitizenQuests';
import { useConfig } from '../../hooks/useConfig';
import { CitizenshipConfig } from '../../types/api';
import api from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../utils/common';
import { reportIssue } from '../../utils/reporting.utils';
import PageNotFound from '../not-found';

const ValidationCitizenPage: NextPage = () => {
  const citizenshipConfig = getCachedConfig(
    'citizenship',
  ) as CitizenshipConfig | null;

  const t = useTranslations();
  const { isLoading, user } = useAuth();

  const { PLATFORM_NAME } = useConfig();

  const router = useRouter();

  const quests = useCitizenQuests();
  const {
    tokenBalance,
    tokensRequired,
    ownsRequiredTokens,
    isEligible,
    isMember,
    application,
    openFinanceApplications,
  } = quests;

  const hasFinancedApplication = openFinanceApplications.length > 0;

  const isCitizenshipEnabled = Boolean(citizenshipConfig?.enabled);
  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const [apiError, setApiError] = useState<string | null>(null);

  const getCtaButtonText = () => {
    if (isMember) {
      return t('token_sale_public_sale_buy_token');
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

  /**
   * Buying and financing follow directly from the choice made in the tokens
   * quest, so their button belongs in that card — at the bottom of the page it
   * sits below the fold. Applying depends on every quest, so it stays at the end.
   */
  const isTokenAction =
    isMember ||
    Boolean(application.intent.iWantToBuyTokens) ||
    Boolean(application.intent.iWantToFinanceTokens);

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
      router.replace('/citizenship/why');
    }
  }, [user, isLoading, isMember, router]);

  const goBack = () => {
    // `/citizenship/why` bounces straight back here once the "why" is answered,
    // so send people to the citizenship landing page instead.
    router.push('/citizenship');
  };

  if (!isCitizenshipEnabled) {
    return <PageNotFound error="" />;
  }

  const handleNext = async () => {
    setApiError(null);

    if (isMember) {
      router.push('/token');
      return;
    }

    if (application.intent.iWantToBuyTokens) {
      // People who already hold the required tokens can still buy more, and a
      // zero/negative "missing" amount would send them to an empty checkout.
      const tokensMissing = tokensRequired - tokenBalance;
      const tokensToBuy = tokensMissing > 0 ? tokensMissing : tokensRequired;
      router.push(
        `/token/before-you-begin?citizenApplication=true&tokens=${tokensToBuy}`,
      );
      return;
    }

    if (application.intent.iWantToFinanceTokens) {
      const tokensMissing = tokensRequired - tokenBalance;
      const tokensToBuy = tokensMissing > 0 ? tokensMissing : tokensRequired;
      const tokensToFinance = Math.max(1, Math.ceil(tokensToBuy));
      router.push(
        `/token/finance?citizenApplication=true&tokens=${tokensToFinance}`,
      );
      return;
    }

    try {
      const res = await api.post('/subscription/citizen/apply', {
        owns30Tokens: ownsRequiredTokens,
      });

      if (res.data.status === 'success' || isEligible) {
        router.push('/citizenship/success?intent=apply');
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

  const ctaButton = (
    <Button isEnabled={isCtaEnabled()} onClick={handleNext}>
      {getCtaButtonText()}
    </Button>
  );

  if (!user && !isLoading) {
    reportIssue(
      'Issue with authentication on citizenship/validation',
      'N/A',
    ).catch((err) => console.error('Failed to report issue:', err));
    return <PageNotFound error="" />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true') {
    reportIssue(
      'NEXT_PUBLIC_FEATURE_CITIZENSHIP not true in prod on citizenship/validation',
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
                ? t('subscriptions_citizen_already_member_title')
                : t('subscriptions_citizen_quests_title')}
            </Heading>
            {isMember && (
              // The heading above already says "Already a citizen!", so this
              // only carries the description.
              <p className="text-sm text-gray-600">
                {t('subscriptions_citizen_already_member_description')}
              </p>
            )}
            {!isMember && (
              <p className="text-sm text-gray-600">
                {t('subscriptions_citizen_quests_subtitle')}
              </p>
            )}
          </section>

          <CitizenQuestsPanel
            quests={quests}
            showEligibilityQuests={!isMember}
            tokensAction={isTokenAction ? ctaButton : null}
          />

          {hasFinancedApplication && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex flex-col gap-2">
              <p className="text-sm font-medium">
                {t('subscriptions_citizen_active_applications')}
              </p>
              <Link
                href={
                  openFinanceApplications.length > 1
                    ? '/token/financed'
                    : `/token/financed/${encodeURIComponent(
                        openFinanceApplications[0]._id,
                      )}`
                }
                className="text-sm font-medium text-accent underline"
              >
                {openFinanceApplications.length > 1
                  ? t('member_menu_financed_view_contracts')
                  : t('token_financed_view_contract')}
              </Link>
            </div>
          )}

          {isWalletEnabled ? (
            <div className="my-4 flex flex-col gap-4">
              <p>
                <strong>{t('subscriptions_citizen_connect_wallet')}</strong>
              </p>
              <Wallet />
            </div>
          ) : null}

          {(!isTokenAction || apiError) && (
            <div className="py-4">
              {apiError && <ErrorMessage error={apiError} />}
              {!isTokenAction && ctaButton}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ValidationCitizenPage;
