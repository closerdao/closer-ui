import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import Autocomplete from '../../components/Autocomplete';
import CitizenWhy from '../../components/CitizenWhy';
import UserAvatarPlaceholder from '../../components/UserAvatarPlaceholder';
import { Button, Heading, ProgressBar } from '../../components/ui';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { CitizenshipConfig } from '../../types/api';
import { CitizenApplication } from '../../types/subscriptions';
import api, { cdn } from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { logMetric } from '../../utils/metrics';
import PageNotFound from '../not-found';

interface PlatformContext {
  user: {
    patch: (id: string, data: any) => Promise<any>;
  };
  [key: string]: any;
}

const CitizenWhyPage: NextPage = () => {
  const citizenshipConfig = getCachedConfig(
    'citizenship',
  ) as CitizenshipConfig | null;
  const t = useTranslations();
  const { isLoading, user, refetchUser } = useAuth();
  const { PLATFORM_NAME } = useConfig();
  const { platform } = usePlatform() as { platform: PlatformContext };

  const router = useRouter();

  const isCitizenshipEnabled = Boolean(citizenshipConfig?.enabled);
  const isMember = user?.roles?.includes('member');

  const citizenshipStatus = user?.citizenship?.status;
  const userCitizenshipWhy = user?.citizenship?.why;
  const hasSubmittedWhy = Boolean(userCitizenshipWhy);

  const stampedCitizenshipAppliedAtForUserIdRef = useRef<string | null>(null);
  // Who referred the applicant. Only asked when nothing set it earlier (e.g. a
  // referral signup link); once user.referredBy exists the question is replaced
  // by the referrer's name.
  const [referredByUser, setReferredByUser] = useState<{
    _id: string;
    screenname?: string;
    photo?: string;
  } | null>(null);
  const [existingReferrer, setExistingReferrer] = useState<{
    screenname?: string;
    photo?: string;
  } | null>(null);

  useEffect(() => {
    if (!user?.referredBy) {
      setExistingReferrer(null);
      return;
    }
    (async () => {
      try {
        const res = await api.get(`/user/${user.referredBy}`);
        const referrer = res?.data?.results;
        setExistingReferrer(
          referrer?.screenname
            ? { screenname: referrer.screenname, photo: referrer.photo }
            : null,
        );
      } catch (err) {
        // A dangling referredBy id just means there is no name to show.
        setExistingReferrer(null);
      }
    })();
  }, [user?.referredBy]);

  // The same referrer pill the signup page shows for a referral link.
  const renderReferrerPill = (
    referrer: { screenname?: string; photo?: string },
    action?: JSX.Element,
  ) => (
    <div className="flex items-center gap-2 rounded-full bg-accent-light px-4 py-2 text-sm w-fit">
      {referrer.photo ? (
        <Image
          src={`${cdn}${referrer.photo}-profile-sm.jpg`}
          alt=""
          width={24}
          height={24}
          className="rounded-full"
        />
      ) : (
        <UserAvatarPlaceholder size="sm" />
      )}
      <span className="text-gray-600">{t('signup_form_referrer')}</span>
      <span className="font-bold">{referrer.screenname}</span>
      {action}
    </div>
  );
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
      router.replace('/citizenship/validation');
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
    // `citizenship` is not client-editable on the user model - a generic user
    // patch would silently drop it - so the stamp goes through the dedicated
    // application endpoint.
    api
      .post('/subscription/citizen/application', {})
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
      // The why goes through the citizenship application endpoint (the
      // `citizenship` field is not client-editable); referredBy is an
      // editable user field and saves through the normal patch.
      await Promise.all([
        api.post('/subscription/citizen/application', {
          why: application?.why,
        }),
        referredByUser && !user?.referredBy
          ? platform.user.patch(user?._id || '', {
              referredBy: referredByUser._id,
            })
          : Promise.resolve(),
      ]);
      await refetchUser();

      void logMetric({
        event: 'citizen-applied',
        category: 'citizenship',
        value: 'applied',
      });
    } catch (error) {
      console.error('error with citizen application:', error);
    }

    router.push('/citizenship/validation?intent=apply');
  };

  if (!isCitizenshipEnabled) {
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
              {user?.referredBy &&
                existingReferrer &&
                renderReferrerPill(existingReferrer)}
              {!user?.referredBy && (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="referredBy"
                    className="block text-sm font-bold"
                  >
                    {t('subscriptions_citizen_referred_by_label')}
                  </label>
                  <p className="text-sm text-gray-500">
                    {t('subscriptions_citizen_referred_by_hint')}
                  </p>
                  {referredByUser ? (
                    renderReferrerPill(
                      referredByUser,
                      <button
                        type="button"
                        className="text-accent underline"
                        onClick={() => setReferredByUser(null)}
                      >
                        {t('subscriptions_citizen_referred_by_change')}
                      </button>,
                    )
                  ) : (
                    <Autocomplete
                      endpoint="/user"
                      placeholder={t(
                        'subscriptions_citizen_referred_by_placeholder',
                      )}
                      value={(user ? [{ _id: user._id }] : []) as never[]}
                      onChange={((
                        _list: unknown,
                        option: {
                          _id: string;
                          screenname?: string;
                          photo?: string;
                        },
                      ) => {
                        if (option && option._id !== user?._id) {
                          setReferredByUser(option);
                        }
                      }) as unknown as () => void}
                    />
                  )}
                </div>
              )}
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
