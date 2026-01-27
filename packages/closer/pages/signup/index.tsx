import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import ApplicationForm from '../../components/ApplicationForm';
import SignupForm from '../../components/SignupForm';
import { Card, ErrorMessage } from '../../components/ui';

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
      <main className="main-content mt-12 px-2 sm:px-4 max-w-4xl mx-auto">
        {process.env.NEXT_PUBLIC_REGISTRATION_MODE === 'curated' ? (
          <ApplicationForm />
        ) : (
          <div className="flex flex-col-reverse md:flex-row gap-6 md:mt-[60px]">
            <div className="hidden md:flex flex-col w-full md:w-1/2">
              <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
                <Image
                  src="/images/landing-page/lake.jpg"
                  alt="Traditional Dream Factory"
                  fill
                  className="object-cover"
                />
              </div>
              {error && <ErrorMessage error={error} />}
              {referrer && (
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    {t('signup_form_referrer')}{' '}
                    <Card className="bg-accent-light py-2">
                      <div className="flex items-center gap-2">
                        {referrer ? (
                          <Image
                            src={`${cdn}${referrer.get('photo')}-profile-sm.jpg`}
                            alt=""
                            width={30}
                            height={30}
                            className="rounded-full"
                          />
                        ) : (
                          <FaUser className="text-success w-[30px] h-[30px]" />
                        )}
                        <span>{referrer.get('screenname')}</span>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
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
