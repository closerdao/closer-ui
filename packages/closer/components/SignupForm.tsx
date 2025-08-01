import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FormEvent, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../constants';
import { useAuth } from '../contexts/auth';
import { getRedirectUrl } from '../utils/auth.helpers';
import { isInputValid } from '../utils/helpers';
import GoogleButton from './GoogleButton';
import { Button, Card, Checkbox, ErrorMessage, Input } from './ui';
import Heading from './ui/Heading';
import api from '../utils/api';

interface Props {
  app: string | undefined;
}

const SignupForm = ({ app }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { back, source, start, end, adults, useTokens, eventId, volunteerId } =
    router.query || {};

  const {
    isAuthenticated,
    user,
    error,
    isLoading,
    hasSignedUp,
    isGoogleLoading,
    authGoogle,
    signup,
  } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [application, setApplication] = useState({
    screenname: '',
    phone: '',
    email: '',
    password: '',
    fields: {},
    source: typeof window !== 'undefined' && window.location.href,
  });
  const [preferences, setPreferences] = useState({
    about: '',
    superpower: '',
    dream: '',
  });
  const [isLogin, setIsLogin] = useState(false);

  const dateFormat = 'YYYY-MM-DD';

  const getSignupQuery = () => {
    if (back && start && end && adults) {
      return `/?back=${back}&start=${dayjs(start as string).format(
        dateFormat,
      )}&end=${dayjs(end as string).format(
        dateFormat,
      )}&adults=${adults}&useTokens=${useTokens}${
        volunteerId ? `&volunteerId=${volunteerId}` : ''
      }${eventId ? `&eventId=${eventId}` : ''}`;
    } else if (back && source) {
      return `/?back=${back}&source=${source}`;
    } else if (back) {
      return `/?back=${back}`;
    } else {
      return '/';
    }
  };

  const signupQuery = getSignupQuery();

  const [isEmailConsent, setIsEmailConsent] = useState(true);

  const redirectAfterSignup = () => {
    if (source) {
      router.push(
        `${decodeURIComponent(back as string)}&source=${source}` || '/settings',
      );
      return;
    }
    router.push(back ? `${decodeURIComponent(back as string)}` : '/settings');
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectAfterSignup();
    }
    if (isAuthenticated && isLogin) {
      const redirectUrl = getRedirectUrl({
        back,
        source,
        start,
        end,
        adults,
        useTokens,
        eventId,
        volunteerId,
        hasSubscription: Boolean(user && user?.subscription?.plan),
      });
      redirectTo(redirectUrl);
    }
  }, [isAuthenticated, back, user]);

  useEffect(() => {
    const localEmail = localStorage.getItem('email');
    if (localEmail) {
      setEmail(localEmail);
      setApplication({ ...application, email: localEmail });
    }
  }, []);

  const updateApplication = (update: any) => {
    setApplication((prevState) => ({ ...prevState, ...update }));
  };

  const updatePreferences = (update: any) => {
    setPreferences((prevState) => ({ ...prevState, ...update }));
  };

  const isSignupDisabled =
    !application.password ||
    !application.screenname ||
    !isInputValid(application.email, 'email');

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !isInputValid(email, 'email')) {
      return;
    }

    try {
      const referrer = typeof localStorage !== 'undefined' && localStorage.getItem('referrer');
      await api.post('/subscribe', {
        email,
        screenname: '',
        tags: ['signup', router.asPath, `ref:${referrer}`],
      });
      
      setNewsletterSuccess(true);
      setNewsletterError(null);
      setApplication({ ...application, email });
      localStorage.setItem('email', email);
      
      setTimeout(() => {
        setStep(2);
      }, 1000);
    } catch (err: any) {
      setNewsletterError(
        (err.response && err.response.data && err.response.data.error) ||
        err.message
      );
    }
  };

  const handleAccountSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!application.screenname || !application.password) {
      return;
    }
    setStep(3);
  };

  const handlePreferencesSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!application.email) {
      return;
    }
    const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
    await signup({
      ...application,
      preferences,
      ...(referredBy && { referredBy }),
    });
  };

  const redirectTo = (url: string) => {
    router.push(url);
  };

  const authUserWithGoogle = async () => {
    setIsLogin(false);
    const authRes = await authGoogle();
    if (authRes.result === 'login') {
      setIsLogin(true);
    }
    if (authRes.result === 'signup') {
      gaEvent('sign_up', {
        category: 'signing',
      });
    }
  };

  return (
    <Card
      className={`${
        app && app.toLowerCase() === 'tdf' ? 'mt-[200px]' : 'mt-0'
      } pb-8 relative  md:mt-0`}
    >
      {app && app.toLowerCase() === 'tdf' && (
        <div className="absolute top-[-202px] h-[200px] overflow-hidden w-[90%]">
          <Image
            className="mx-auto"
            alt="e"
            src="/images/subscriptions/explorer.png"
            width={200}
            height={354}
          />
        </div>
      )}
      {hasSignedUp && !error ? (
        <>
          <Heading level={2} className="my-4">
            {t('signup_success')}
          </Heading>
          <p>{t('signup_success_cta')}</p>
        </>
      ) : step === 1 ? (
        <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
          <Heading level={2} className="mb-4">
            {t('signup_step1_title')}
          </Heading>
          <p className="text-gray-600 mb-4">
            {t('signup_step1_description')}
          </p>
          
          <Input
            label={t('signup_form_email')}
            placeholder={t('signup_form_email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            validation="email"
          />
          
          {newsletterError && <ErrorMessage error={newsletterError} />}
          {newsletterSuccess && (
            <div className="text-green-600 text-sm">
              {t('signup_step1_success')}
            </div>
          )}
          
          <Checkbox
            className="my-4"
            id="emailConsent"
            isChecked={isEmailConsent}
            onChange={() => setIsEmailConsent(!isEmailConsent)}
          >
            {t('signup_form_email_consent')}
          </Checkbox>
          
          <div className="w-full flex flex-col gap-4">
            <Button
              isEnabled={!!email && isInputValid(email, 'email') && !newsletterSuccess && isEmailConsent}
              isLoading={false}
              type="submit"
            >
              {t('signup_step1_continue')}
            </Button>

            {process.env.NEXT_PUBLIC_FIREBASE_CONFIG && (
              <GoogleButton
                isLoading={isGoogleLoading}
                onClick={authUserWithGoogle}
              />
            )}
          </div>
        </form>
      ) : step === 2 ? (
        <form className="flex flex-col gap-4" onSubmit={handleAccountSubmit}>
          <Heading level={2} className="mb-4">
            {t('signup_step2_title')}
          </Heading>
          <p className="text-gray-600 mb-4">
            {t('signup_step2_description')}
          </p>
          
          <input
            type="hidden"
            name="backurl"
            value={decodeURIComponent((back as string) || '/')}
          />

          <Input
            label={t('signup_form_name')}
            placeholder={t('signup_form_name_placeholder')}
            value={application.screenname}
            onChange={(e) =>
              updateApplication({
                screenname: e.target.value,
              })
            }
          />
          <Input
            type="password"
            placeholder={t('signup_form_password_placeholder')}
            label={t('signup_form_password')}
            value={application.password}
            onChange={(e) =>
              updateApplication({
                password: e.target.value,
              })
            }
          />

          {error && <ErrorMessage error={error} />}
          <div className="w-full my-4 flex flex-col gap-6">
            <Button
              isEnabled={!!application.screenname && !!application.password && !isLoading}
              isLoading={isLoading}
            >
              {t('signup_step2_continue')}
            </Button>
          </div>
          <div className="text-center text-sm">
            {t('signup_form_have_account')}{' '}
            <Link
              data-testid="login-link"
              className="text-accent underline font-bold"
              href={`/login${signupQuery}`}
            >
              {t('login_title')}{' '}
            </Link>
          </div>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handlePreferencesSubmit}>
          <Heading level={2} className="mb-4">
            {t('signup_step3_title')}
          </Heading>
          <p className="text-gray-600 mb-4">
            {t('signup_step3_description')}
          </p>
          
          <Input
            label={t('settings_about_you')}
            placeholder={t('settings_tell_us_more_about_yourself')}
            value={preferences.about}
            onChange={(e) => updatePreferences({ about: e.target.value })}
          />

          <Input
            label={t('settings_superpower')}
            placeholder={t('settings_superpower_placeholder')}
            value={preferences.superpower}
            onChange={(e) => updatePreferences({ superpower: e.target.value })}
          />

          <Input
            label={t('settings_dream')}
            placeholder={t('settings_dream_placeholder')}
            value={preferences.dream}
            onChange={(e) => updatePreferences({ dream: e.target.value })}
          />

          {error && <ErrorMessage error={error} />}
          <div className="w-full my-4 flex flex-col gap-6">
            <Button
              isEnabled={!isLoading}
              isLoading={isLoading}
            >
              {t('signup_form_create')}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};

export default SignupForm;
