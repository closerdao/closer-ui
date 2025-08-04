import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import ApplicationForm from '../../components/ApplicationForm';
import SignupForm from '../../components/SignupForm';
import { Card, ErrorMessage } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../../constants';
import { useNewsletter } from '../../contexts/newsletter';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { SubscriptionPlan } from '../../types/subscriptions';
import api, { cdn } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };
}

const Signup = () => {
  const t = useTranslations();
  const config = useConfig();
  const { APP_NAME } = config || {};

  // Use newsletter context at top level - hooks must be called unconditionally
  const newsletterContext = useNewsletter();
  const setHideFooterNewsletter = newsletterContext?.setHideFooterNewsletter;

  const { platform }: any = usePlatform();

  const [error, setError] = useState(false);

  const router = useRouter();
  const { referral } = router.query || {};

  let referredBy: null | string = null;

  if (typeof window !== 'undefined') {
    if (referral) {
      referredBy = referral as string;
    } else {
      referredBy = localStorage.getItem(
        REFERRAL_ID_LOCAL_STORAGE_KEY,
      ) as string;
    }
  }
  const referrer = platform?.user.findOne(referredBy);

  const loadData = async () => {
    try {
      await platform.user.getOne(referredBy);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (setHideFooterNewsletter) {
      setHideFooterNewsletter(true);
      return () => {
        if (setHideFooterNewsletter) {
          setHideFooterNewsletter(false);
        }
      };
    }
  }, [setHideFooterNewsletter]);

  return (
    <>
      <Head>
        <title>{t('signup_title')}</title>
      </Head>
      <main className="main-content mt-12 px-4 max-w-4xl mx-auto">
        {process.env.NEXT_PUBLIC_REGISTRATION_MODE === 'curated' ? (
          <ApplicationForm />
        ) : (
          <div
            className={`${
              APP_NAME && APP_NAME?.toLowerCase() === 'tdf'
                ? 'md:mt-[200px]'
                : ' md:mt-[60px]'
            } flex flex-col md:flex-row gap-6 mt-0`}
          >
            <div className="flex flex-col gap-10 w-full md:w-1/2">
              <Heading
                level={1}
                className="uppercase text-5xl sm:text-5xl font-extrabold"
              >
                {t('signup_hero_title')}
              </Heading>
              <p className="text-lg text-gray-600">
                {t('signup_hero_subtitle')}
              </p>

              <ul className="space-y-1 text-xs text-gray-600 pt-2">
                <li>
                  {t('signup_feature_restore')}
                </li>
                <li>
                  {t('signup_feature_colive')}
                </li>
                <li>
                  {t('signup_feature_earn')}
                </li>
                <li>
                  {t('signup_feature_makers')}
                </li>
                <li>
                  {t('signup_feature_surf')}
                </li>
              </ul>

              <div>
                {error && <ErrorMessage error={error} />}
                {referrer && (
                  <div>
                    <div className="flex items-center gap-4 ">
                      {t('signup_form_referrer')}{' '}
                      <Card className="bg-accent-light py-2">
                        <div className="flex items-center gap-2">
                          {referrer ? (
                            <Image
                              src={
                                referrer &&
                                `${cdn}${referrer.get('photo')}-profile-sm.jpg`
                              }
                              alt={''}
                              width={30}
                              height={30}
                              className="rounded-full"
                            />
                          ) : (
                            <FaUser className="text-success w-[3opx] h-[30px] " />
                          )}
                          <span>{referrer.get('screenname')}</span>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <SignupForm app={APP_NAME} />
            </div>
          </div>
        )}
      </main>
    </>
  );
};

Signup.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subscriptionsResponse, messages] = await Promise.all([
      api.get('/config/subscriptions').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    return {
      subscriptionsConfig: subscriptionsResponse?.data?.results?.value,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: [],
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default Signup;
