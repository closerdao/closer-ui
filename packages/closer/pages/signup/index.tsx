import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import ApplicationForm from '../../components/ApplicationForm';
import SignupForm from '../../components/SignupForm';
import UserAvatarPlaceholder from '../../components/UserAvatarPlaceholder';
import { ErrorMessage, Heading } from '../../components/ui';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../../constants';
import { useNewsletter } from '../../contexts/newsletter';
import { usePlatform } from '../../contexts/platform';
import { cdn } from '../../utils/api';

const Signup = () => {
  const t = useTranslations();

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
  const referrer = referredBy ? platform?.user.findOne(referredBy) : null;

  const loadData = async () => {
    // Most signups arrive without a referral; fetching then would just be a
    // failing request on the critical path.
    if (!referredBy) {
      return;
    }
    try {
      await platform.user.getOne(referredBy);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [referredBy]);

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
      {/* `accent-alt-light` is the theme's pale tint of the configured
          secondary colour, so the panel picks up the brand without shouting —
          and the `bg-background` cards on top keep reading as raised. Login
          uses the same treatment; the two pages are a pair. */}
      <main className="flex flex-col items-center w-full min-w-0 px-0 rounded-2xl bg-accent-alt-light min-h-[80vh]">
        {process.env.NEXT_PUBLIC_REGISTRATION_MODE === 'curated' ? (
          <div className="main-content mt-12 px-2 sm:px-4 max-w-4xl mx-auto">
            <ApplicationForm />
          </div>
        ) : (
          <section className="w-full max-w-md flex flex-col gap-6 py-10 sm:py-16 px-4 sm:px-6">
            <Heading
              level={1}
              className="uppercase text-4xl sm:text-5xl font-extrabold"
            >
              {t('signup_form_create')}
            </Heading>

            {error && <ErrorMessage error={error} />}

            {referrer && (
              <div className="flex items-center gap-2 rounded-full bg-accent-light px-4 py-2 text-sm w-fit">
                {referrer.get('photo') ? (
                  <Image
                    src={`${cdn}${referrer.get('photo')}-profile-sm.jpg`}
                    alt=""
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <UserAvatarPlaceholder size="sm" />
                )}
                <span className="text-gray-600">
                  {t('signup_form_referrer')}
                </span>
                <span className="font-bold">{referrer.get('screenname')}</span>
              </div>
            )}

            <SignupForm />
          </section>
        )}
      </main>
    </>
  );
};

export default Signup;
