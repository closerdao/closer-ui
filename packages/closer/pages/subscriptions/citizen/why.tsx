import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import CitizenGoodToBuy from '../../../components/CitizenGoodToBuy';
import CitizenWhy from '../../../components/CitizenWhy';
import PageError from '../../../components/PageError';
import Wallet from '../../../components/Wallet';
import { Button, Card, Heading, ProgressBar } from '../../../components/ui';

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

interface PlatformContext {
  user: {
    patch: (id: string, data: any) => Promise<any>;
  };
  [key: string]: any;
}

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };

  error?: string;
}

const CitizenWhyPage: NextPage<Props> = ({ subscriptionsConfig, error }) => {
  const t = useTranslations();
  const { isLoading, user, refetchUser } = useAuth();
  const { PLATFORM_NAME } = useConfig();
  const { platform } = usePlatform() as { platform: PlatformContext };

  const router = useRouter();

  const {
    balanceTotal,
    isWalletConnected,
    isCorrectNetwork,
    hasSameConnectedAccount,
  } = useContext(WalletState);

  const owns30Tokens = balanceTotal >= 30;

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';
  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const isMember = user?.roles?.includes('member');

  const citizenshipStatus = user?.citizenship?.status;

  console.log('citizenshipStatus=', citizenshipStatus);

  const userCitizenshipWhy = user?.citizenship?.why;

  // const currentCitizenshipStatus = user?.citizenship?.status;

  const [eligibility, setEligibility] = useState<null | string>(null);
  const [application, setApplication] = useState<{
    owns30Tokens: boolean;
    why: string;
    intent: {
      iWantToApply: boolean;
      iWantToBuyTokens: boolean;
      iWantToFinanceTokens: boolean;
    };
  }>({
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
    if (application?.intent?.iWantToBuyTokens) {
      return t('token_sale_public_sale_buy_token');
    } else if (application?.intent?.iWantToFinanceTokens) {
      return t('subscriptions_citizen_start_financed_plan');
    } else {
      return t('booking_button_continue');
    }
  };

  useEffect(() => {
    if (owns30Tokens) {
      setApplication((prev) => ({
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
    if (user) {
      (async () => {
        try {
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
        } catch (error) {}
      })();
    }
  }, [owns30Tokens, isMember, user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
    }

    if (
      !citizenshipStatus &&
      !userCitizenshipWhy &&
      !user?.citizenship?.appliedAt &&
      !user?.citizenship?.why
    ) {
      platform.user
        .patch(user?._id || '', {
          citizenship: {
            ...user?.citizenship,
            appliedAt: new Date(),
          },
        })
        .then(() => {
          refetchUser();
        });
    }
  }, [user, isLoading, refetchUser]);

  useEffect(() => {
    if (userCitizenshipWhy && !application.why) {
      setApplication((prev) => ({
        ...prev,
        why: userCitizenshipWhy,
      }));
    }
  }, [userCitizenshipWhy]);

  const updateApplication = (
    key: string,
    value:
      | string
      | boolean
      | {
          iWantToApply: boolean;
          iWantToBuyTokens: boolean;
          iWantToFinanceTokens: boolean;
        },
  ) => {
    setApplication((prev) => ({ ...prev, [key]: value }));
  };

  const goBack = () => {
    router.push('/citizenship/');
  };

  const handleNext = async () => {
    try {
      await platform.user.patch(user?._id || '', {
        citizenship: {
          ...user?.citizenship,
          why: application?.why,
        },
      });

      // Track citizen application
      try {
        await api.post('/metric', {
          event: 'citizen-applied',
          value: 'citizenship',
          point: 0,
          category: 'engagement',
        });
      } catch (error) {
        console.error('Error tracking citizen application:', error);
      }
    } catch (error) {
      console.error('error with citizen application:', error);
    }

    if (application?.intent?.iWantToBuyTokens) {
      router.push(
        `/token/before-you-begin?citizenApplication=true&tokens=${
          30 - (balanceTotal || 0)
        }`,
      );
      return;
    } else if (application?.intent?.iWantToFinanceTokens) {
      router.push('/token/finance?citizenApplication=true');
      return;
    }

    router.push('/subscriptions/citizen/validation?intent=apply');
    return;
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
        <Heading level={1} className="mb-4">
          {t('subscriptions_citizen_apply_title')}
        </Heading>
        <ProgressBar steps={SUBSCRIPTION_CITIZEN_STEPS} />

        <main className="pt-14 pb-24 space-y-6">
          {!isMember && <> {renderUserMessage()}</>}

          {citizenshipStatus && (
            <div>
              {t.rich('subscriptions_citizen_buy_more', {
                link: (chunks) => (
                  <a
                    href="/token"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline' }}
                  >
                    {chunks}
                  </a>
                ),
              })}
            </div>
          )}

          {/* TODO: add a message if the user has a pending payment */}
          {!citizenshipStatus && (
            <>
              <p>{t('subscriptions_citizen_good_to_go_intro')}</p>
              <section className="mb-10 space-y-6">
                {isMember && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <p className="font-bold text-green-700 mb-2">
                      {t('subscriptions_citizen_already_member_title')}
                    </p>
                    <p>
                      {t('subscriptions_citizen_already_member_description')}
                    </p>
                  </div>
                )}
              </section>
              {!isMember && (
                <CitizenWhy
                  updateApplication={updateApplication}
                  application={application}
                />
              )}

              <Card>
                {isWalletConnected &&
                  isCorrectNetwork &&
                  hasSameConnectedAccount && (
                    <>
                      {t('subscriptions_citizen_you_hold', {
                        var: balanceTotal,
                      })}
                    </>
                  )}
                <CitizenGoodToBuy
                  updateApplication={updateApplication}
                  application={application}
                  balanceTotal={balanceTotal}
                />
              </Card>
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
                    eligibility === 'buy_more'
                      ? true
                      : Boolean(application?.why)
                  }
                  onClick={handleNext}
                >
                  {getCtaButtonText()}
                </Button>
              </div>
            </>
          )}
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
