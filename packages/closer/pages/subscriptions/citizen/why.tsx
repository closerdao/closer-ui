import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import CitizenGoodToBuy from '../../../components/CitizenGoodToBuy';
import CitizenWhy from '../../../components/CitizenWhy';
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
import { SubscriptionPlan } from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };

  error?: string;
}

const CitizenWhyPage: NextPage<Props> = ({ subscriptionsConfig, error }) => {
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

  const citizenshipStatus = user?.citizenship?.status;

  const userCitizenshipWhy = user?.citizenship?.why;

  // const currentCitizenshipStatus = user?.citizenship?.status;

  const [apiError, setApiError] = useState('');
  const [eligibility, setEligibility] = useState<null | string>(null);
  const [application, setApplication] = useState<any>({
    owns30Tokens,
    why: userCitizenshipWhy || '',
    intent: {
      iWantToApply: Boolean(owns30Tokens) && !isMember,
      iWantToBuyTokens: false,
      iWantToFinanceTokens: true,
    },
  });

  const renderUserMessage = () => {
    if (!citizenshipStatus) return null;
    let message = null;
    switch (citizenshipStatus) {
      case 'pending-payment':
        message = t('subscriptions_citizen_pending_payment');
        break;
      case 'cancelled':
        message = t('subscriptions_citizen_cancelled');
        break;
      case 'paid':
        message = t('subscriptions_citizen_paid');
        break;
      case 'completed':
        message = t('subscriptions_citizen_completed');
        break;
      default:
        message = null;
        break;
    }
    return <div className="bg-yellow-100 py-2 px-3 rounded-md">{message}</div>;
  };

  const getCtaButtonText = () => {
    if (eligibility === 'buy_more') {
      if (application?.intent?.iWantToBuyTokens) {
        return t('navigation_buy_token');
      } else if (application?.intent?.iWantToApply) {
        return t('subscriptions_citizen_apply');
      } else {
        return t('booking_button_continue');
      }
    }
    return t('booking_button_continue');
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

        const isVouchedRes = await api.get(
          '/subscription/citizen/check-is-vouched',
        );
        const isVouchedLocal = isVouchedRes?.data?.isVouched;

        if (
          (isVouchedLocal && hasStayedForMinDurationLocal && owns30Tokens) ||
          isMember
        ) {
          setEligibility('buy_more');
        } else if (isVouchedLocal && hasStayedForMinDurationLocal) {
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

    if (
      !citizenshipStatus &&
      !userCitizenshipWhy &&
      !user?.citizenship?.appliedAt
    ) {
      platform.user.patch(user?._id, {
        citizenship: {
          ...user?.citizenship,
          appliedAt: new Date(),
        },
      });
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (userCitizenshipWhy && !application.why) {
      setApplication((prev: any) => ({
        ...prev,
        why: userCitizenshipWhy,
      }));
    }
  }, [userCitizenshipWhy]);

  const updateApplication = (key: string, value: any) => {
    setApplication((prev: any) => ({ ...prev, [key]: value }));
  };

  const goBack = () => {
    router.push('/subscriptions/');
  };

  const handleNext = async () => {
    try {
      await platform.user.patch(user?._id, {
        citizenship: {
          ...user?.citizenship,
          why: application?.why,
        },
      });
    } catch (error) {
      console.error('error with citizen application:', error);
    }

    if (eligibility === 'buy_more') {
      if (application?.intent?.iWantToBuyTokens) {
        router.push('/token/before-you-begin?isCitizenApplication=true');
        return;
      } else if (application?.intent?.iWantToApply) {
        router.push(`/subscriptions/citizen/apply?intent=apply`);
        return;
      }
    }
    router.push(`/subscriptions/citizen/validation?intent=apply`);
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  if (!user && !isLoading) {
    return <PageNotFound error="" />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true') {
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
            {isMember && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <p className="font-bold text-green-700 mb-2">
                  {t('subscriptions_citizen_already_member_title')}
                </p>
                <p>{t('subscriptions_citizen_already_member_description')}</p>
              </div>
            )}

            {!isMember && (
              <>
                {' '}
                {renderUserMessage()}
                <p>{t('subscriptions_citizen_good_to_go_intro')}</p>
              </>
            )}
          </section>


          {!isMember && (
            <CitizenWhy
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
                eligibility === 'buy_more' ? true : Boolean(application?.why)
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

CitizenWhyPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subscriptionsRes, messages] = await Promise.all([
      api.get('/config/subscriptions').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;

    return {
      subscriptionsConfig,

      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },

      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default CitizenWhyPage;
