import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FormEvent, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../constants';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import api from '../utils/api';
import { getRedirectUrl } from '../utils/auth.helpers';
import { parseMessageFromError, slugify } from '../utils/common';
import { isInputValid, validatePassword } from '../utils/helpers';
import { reportIssue } from '../utils/reporting.utils';
import GoogleButton from './GoogleButton';
import { Button, Card, Checkbox, ErrorMessage, Input } from './ui';
import Heading from './ui/Heading';

interface Props {
  app: string | undefined;
}

const SignupForm = ({ app }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { platform } = usePlatform() as any;
  const { back, source, start, end, adults, useTokens, eventId, volunteerId } =
    router.query || {};

  const {
    isAuthenticated,
    user,
    error: authError,
    isLoading,
    hasSignedUp,
    isGoogleLoading,
    authGoogle,
    signup,
    refetchUser,
  } = useAuth();

  const [step, setStep] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const savedStep = sessionStorage.getItem('signup_step');
      return savedStep ? parseInt(savedStep, 10) : 1;
    }
    return 1;
  });
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
  const [localError, setLocalError] = useState<string | null>(null);
  const [preferencesSuccess, setPreferencesSuccess] = useState(false);
  const [isEmailConsent, setIsEmailConsent] = useState(true);
  const [isSignupLoading, setIsSignupLoading] = useState(false);

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
    // Don't redirect if user is in the middle of signup process (steps 1, 2, or 3)
    if (step && step >= 1 && step <= 3) {
      return;
    }

    // If user is authenticated and has completed signup (step is null), redirect
    if (isAuthenticated && user && step === null) {
      redirectAfterSignup();
    }

    // If user is authenticated and came from login (not signup), redirect
    if (isAuthenticated && isLogin && step === null) {
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

    // If user is authenticated and reloaded the page, check if they should be redirected
    // (only if they're not in the middle of signup)
    if (isAuthenticated && user && !step && !isLogin) {
      const savedStep = sessionStorage.getItem('signup_step');
      if (!savedStep) {
        // User is authenticated but not in signup process, redirect
        redirectAfterSignup();
      }
    }
  }, [isAuthenticated, back, user, step, isLogin]);

  // Cleanup session storage when component unmounts or user completes signup
  useEffect(() => {
    return () => {
      if (step === null) {
        sessionStorage.removeItem('signup_step');
      }
    };
  }, [step]);

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

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !isInputValid(email, 'email')) {
      return;
    }

    try {
      const res = await api.post('/check-user-exists', {
        email,
      });
      const doesUserExist = res?.data?.doesUserExist;

      if (doesUserExist) {
        setNewsletterError(t('signup_form_email_exists'));
        return;
      }

      const referrer =
        typeof localStorage !== 'undefined' && localStorage.getItem('referrer');

      if (
        process.env.NEXT_PUBLIC_FEATURE_SIGNUP_SUBSCRIBE === 'true' &&
        isEmailConsent
      ) {
        try {
          await api.post('/subscribe', {
            email,
            screenname: '',
            tags: ['signup'],
          });
        } catch (error) {
          console.error('error with subscribe:', error);
          await reportIssue(`error with subscription: ${error}`, user?.email);
        }
      }

      setNewsletterSuccess(true);
      setNewsletterError(null);
      setApplication({ ...application, email });
      localStorage.setItem('email', email);
      localStorage.setItem('signupCompleted', 'true');
      setTimeout(() => {
        setStep(2);
        sessionStorage.setItem('signup_step', '2');
      }, 1000);
    } catch (err: any) {
      setNewsletterError(
        (err.response && err.response.data && err.response.data.error) ||
          err.message,
      );
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!application.screenname || !application.password) {
      return;
    }

    // Validate password before submitting
    const passwordValidation = validatePassword(application.password);
    if (!passwordValidation.isValid) {
      setLocalError(passwordValidation.error);
      return;
    }

    setIsSignupLoading(true);
    setLocalError(null);

    try {
      const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);

      const res = await signup({
        ...application,
        slug: slugify(application.screenname),
        ...(referredBy && { referredBy }),
        emailConsent: isEmailConsent,
      });

      if (res && res.result === 'signup') {
        setStep(3);
        sessionStorage.setItem('signup_step', '3');
      } else {
        // Error is already set by the auth context, so we don't need to set it here
        // The user will stay on step 2 and see the error message
      }
    } catch (error) {
      console.error('Signup error:', error);
      // Error is handled by the auth context
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setLocalError('User not found. Please try again.');
      return;
    }

    setIsSignupLoading(true);
    setLocalError(null);

    try {
      // Update user preferences
      const payload = {
        preferences: {
          ...user?.preferences,
          about: preferences.about,
          superpower: preferences.superpower,
          dream: preferences.dream,
        },
      };

      await platform.user.patch(user._id, payload);
      await refetchUser();
      setPreferencesSuccess(true);

      // Clear the signup step and redirect after success
      setTimeout(() => {
        sessionStorage.removeItem('signup_step');
        setStep(null);
        redirectAfterSignup();
      }, 1500);
    } catch (error) {
      console.error('Preferences update error:', error);
      setLocalError(parseMessageFromError(error));
    } finally {
      setIsSignupLoading(false);
    }
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
      // If user signed up with Google, move them to step 3 to collect preferences
      setStep(3);
      sessionStorage.setItem('signup_step', '3');
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
      {hasSignedUp && !authError && step !== 3 ? (
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
          <p className="text-gray-600 mb-4">{t('signup_step1_description')}</p>

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
              isEnabled={
                !!email &&
                isInputValid(email, 'email') &&
                !newsletterSuccess &&
                isEmailConsent
              }
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

          <div className="text-center text-sm mt-4">
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
      ) : step === 2 ? (
        <form className="flex flex-col gap-4" onSubmit={handleSignUp}>
          <Heading level={2} className="mb-4">
            {t('signup_step2_title')}
          </Heading>
          <p className="text-gray-600 mb-4">{t('signup_step2_description')}</p>

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
            onChange={(e) => {
              updateApplication({
                password: e.target.value,
              });
              // Clear local error when user starts typing
              if (localError) {
                setLocalError(null);
              }
            }}
          />

          {(localError || authError) && (
            <ErrorMessage error={localError || authError} />
          )}
          <div className="w-full my-4 flex flex-col gap-6">
            <Button
              isEnabled={
                !!application.screenname &&
                !!application.password &&
                !isSignupLoading
              }
              isLoading={isSignupLoading}
            >
              {isSignupLoading
                ? 'Creating account...'
                : t('signup_step2_continue')}
            </Button>
          </div>
        </form>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={handlePreferencesSubmit}
        >
          <Heading level={2} className="mb-4">
            {t('signup_step3_title')}
          </Heading>
          <p className="text-gray-600 mb-4">{t('signup_step3_description')}</p>

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

          {(localError || authError) && (
            <ErrorMessage error={localError || authError} />
          )}
          {preferencesSuccess && (
            <div className="text-green-600 text-sm">{t('settings_saved')}</div>
          )}
          <div className="w-full my-4 flex flex-col gap-6">
            <Button isEnabled={!isLoading} isLoading={isLoading}>
              {t('generic_save_button')}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};

export default SignupForm;
