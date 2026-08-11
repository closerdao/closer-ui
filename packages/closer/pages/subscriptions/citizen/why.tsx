import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import CitizenWhy from '../../../components/CitizenWhy';
import { Button, Heading, ProgressBar } from '../../../components/ui';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import {
  CitizenApplication,
  SubscriptionPlan,
} from '../../../types/subscriptions';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { logMetric } from '../../../utils/metrics';
import PageNotFound from '../../not-found';

interface PlatformContext {
  user: {
    patch: (id: string, data: any) => Promise<any>;
  };
  [key: string]: any;
}

const CitizenWhyPage: NextPage = () => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as {
    enabled: boolean;
    elements: SubscriptionPlan[];
  };
  const t = useTranslations();
  const { isLoading, user, refetchUser } = useAuth();
  const { PLATFORM_NAME } = useConfig();
  const { platform } = usePlatform() as { platform: PlatformContext };

  const router = useRouter();

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';
  const isMember = user?.roles?.includes('member');

  const citizenshipStatus = user?.citizenship?.status;
  const userCitizenshipWhy = user?.citizenship?.why;
  const hasSubmittedWhy = Boolean(userCitizenshipWhy);

  const stampedCitizenshipAppliedAtForUserIdRef = useRef<string | null>(null);
  const [application, setApplication] = useState<CitizenApplication>({
    ownsRequiredTokens: false,
    why: userCitizenshipWhy || '',
    hasSelectedTokenIntent: false,
    intent: {
      iWantToApply: false,
      iWantToBuyTokens: false,
      iWantToFinanceTokens: false,
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

  useEffect(() => {
    if (!isLoading && !user) {
      stampedCitizenshipAppliedAtForUserIdRef.current = null;
      router.push(`/signup?back=${router.asPath}`);
      return;
    }

    if (isLoading || !user?._id) {
      return;
    }

    if (!citizenshipStatus && (hasSubmittedWhy || isMember)) {
      router.replace('/subscriptions/citizen/validation');
      return;
    }

    if (stampedCitizenshipAppliedAtForUserIdRef.current === user._id) {
      return;
    }

    if (
      citizenshipStatus ||
      userCitizenshipWhy ||
      user.citizenship?.appliedAt ||
      user.citizenship?.why
    ) {
      return;
    }

    stampedCitizenshipAppliedAtForUserIdRef.current = user._id;
    platform.user
      .patch(user._id, {
        citizenship: {
          ...user.citizenship,
          appliedAt: new Date(),
        },
      })
      .then(() => {
        refetchUser();
      })
      .catch(() => {
        if (stampedCitizenshipAppliedAtForUserIdRef.current === user._id) {
          stampedCitizenshipAppliedAtForUserIdRef.current = null;
        }
      });
  }, [
    user,
    isLoading,
    refetchUser,
    citizenshipStatus,
    hasSubmittedWhy,
    userCitizenshipWhy,
    isMember,
    router,
    platform,
  ]);

  useEffect(() => {
    if (userCitizenshipWhy && !application.why) {
      setApplication((prev) => ({
        ...prev,
        why: userCitizenshipWhy,
      }));
    }
  }, [userCitizenshipWhy, application.why]);

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

  const handleNext = async () => {
    try {
      await platform.user.patch(user?._id || '', {
        citizenship: {
          ...user?.citizenship,
          why: application?.why,
        },
      });
      await refetchUser();

      void logMetric({
        event: 'citizen-applied',
        category: 'citizenship',
        value: 'applied',
      });
    } catch (error) {
      console.error('error with citizen application:', error);
    }

    router.push('/subscriptions/citizen/validation?intent=apply');
  };

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

        <main className="pt-14 pb-24 flex flex-col gap-6">
          {!isMember && renderUserMessage()}

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

          {!citizenshipStatus && (
            <>
              <CitizenWhy
                updateApplication={updateApplication}
                application={application}
              />
              <div className="py-4">
                <Button
                  isEnabled={Boolean(application?.why)}
                  onClick={handleNext}
                >
                  {t('booking_button_continue')}
                </Button>
                <p className="mt-4 text-center text-sm text-gray-500">
                  {t('subscriptions_citizen_hero_fineprint')}
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default CitizenWhyPage;
