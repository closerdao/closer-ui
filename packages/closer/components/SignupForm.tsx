import Link from 'next/link';
import { useRouter } from 'next/router';

import { FormEvent, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../constants';
import { FIELD_LABEL_CLASS } from '../constants/formStyles';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import api from '../utils/api';
import { getRedirectUrl } from '../utils/auth.helpers';
import { parseMessageFromError, slugify } from '../utils/common';
import { isInputValid, validatePassword } from '../utils/helpers';
import { clearInteractionSession } from '../utils/interactionSession';
import {
  createTurnstileHandlers,
  isTurnstileSubmitEnabled,
} from '../utils/turnstile.helpers';
import GoogleButton from './GoogleButton';
import TurnstileWidget from './TurnstileWidget';
import {
  Button,
  Card,
  Checkbox,
  ErrorMessage,
  Input,
  Textarea,
} from './ui';
import Heading from './ui/Heading';

const STEP_STORAGE_KEY = 'signup_step';

// `account` collects everything needed to create the user in a single screen.
// `profile` is the optional follow-up. `null` means the flow is done and the
// redirect effect may take over.
type Step = 'account' | 'profile' | null;

const readStoredStep = (): Step => {
  const saved = sessionStorage.getItem(STEP_STORAGE_KEY);
  // The previous flow spread account creation over numeric steps 1 and 2 and
  // collected the profile on step 3. Anyone mid-flow when this ships keeps
  // their place instead of being bounced back to an empty form.
  if (saved === 'profile' || saved === '3') {
    return 'profile';
  }
  return 'account';
};

const Divider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3" role="separator">
    <span className="h-px flex-1 bg-gray-200" />
    <span className="text-xs uppercase tracking-wide text-gray-400">
      {label}
    </span>
    <span className="h-px flex-1 bg-gray-200" />
  </div>
);

const SignupForm = () => {
  const t = useTranslations();
  const router = useRouter();
  const { platform } = usePlatform() as any;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { back, source, start, end, adults, useTokens, eventId, volunteerId } =
    router.query || {};

  const {
    isAuthenticated,
    user,
    error: authError,
    hasSignedUp,
    isGoogleLoading,
    authGoogle,
    signup,
    refetchUser,
  } = useAuth();

  const [step, setStep] = useState<Step>('account');
  const [application, setApplication] = useState({
    screenname: '',
    phone: '',
    email: '',
    password: '',
    fields: {},
    source: '',
  });
  const [preferences, setPreferences] = useState({
    about: '',
    superpower: '',
    dream: '',
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
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

  const goToStep = (nextStep: Step) => {
    setStep(nextStep);
    if (nextStep) {
      sessionStorage.setItem(STEP_STORAGE_KEY, nextStep);
    } else {
      sessionStorage.removeItem(STEP_STORAGE_KEY);
    }
  };

  const redirectTo = (url: string) => {
    router.push(url);
  };

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
    setStep(readStoredStep());
    setApplication((prev) => ({
      ...prev,
      source: window.location.href,
      // Prefilled from a newsletter box or an earlier visit so returning
      // visitors only have to fill in what is still missing.
      email: localStorage.getItem('email') || prev.email,
    }));
  }, []);

  useEffect(() => {
    // Only redirect once the flow is finished (step === null). While the user
    // is on the account or profile screen they stay put, even though creating
    // the account already authenticated them.
    if (step !== null || !isAuthenticated || !user) {
      return;
    }

    if (isLogin) {
      redirectTo(
        getRedirectUrl({
          back,
          source,
          start,
          end,
          adults,
          useTokens,
          eventId,
          volunteerId,
          hasSubscription: Boolean(user?.subscription?.plan),
        }),
      );
      return;
    }

    redirectAfterSignup();
  }, [isAuthenticated, user, step, isLogin, back, source]);

  const updateApplication = (update: any) => {
    setApplication((prevState) => ({ ...prevState, ...update }));
    if (localError) {
      setLocalError(null);
    }
    if (emailExists) {
      setEmailExists(false);
    }
  };

  const updatePreferences = (update: any) => {
    setPreferences((prevState) => ({ ...prevState, ...update }));
  };

  const passwordValidation = validatePassword(application.password);
  // validatePassword's own messages are hardcoded English, so the localised
  // hint doubles as the error — it spells out every rule it enforces.
  const showPasswordHintAsError =
    !!application.password && !passwordValidation.isValid;

  const canCreateAccount =
    !!application.screenname.trim() &&
    isInputValid(application.email, 'email') &&
    passwordValidation.isValid &&
    !isSignupLoading &&
    isTurnstileSubmitEnabled(turnstileToken);

  const handleCreateAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!canCreateAccount) {
      return;
    }

    setIsSignupLoading(true);
    setLocalError(null);
    setEmailExists(false);

    try {
      // Cheap pre-check so a returning member is pointed at login instead of a
      // generic signup failure. It deliberately carries no turnstile token —
      // that one is reserved for /signup below.
      const existsRes = await api.post('/check-user-exists', {
        email: application.email,
      });
      if (existsRes?.data?.doesUserExist) {
        setEmailExists(true);
        return;
      }

      const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);

      const res = await signup(
        {
          ...application,
          slug: slugify(application.screenname),
          ...(referredBy && { referredBy }),
          emailConsent: isEmailConsent,
        },
        { turnstileToken },
      );

      if (res && res.result === 'signup') {
        localStorage.setItem('email', application.email);
        localStorage.setItem('signupCompleted', 'true');
        goToStep('profile');
      }
      // On failure the auth context has already set `authError`; the user stays
      // on this screen with everything they typed still in place.
    } catch (error) {
      const message = parseMessageFromError(error);
      if (/turnstile/i.test(String(message))) {
        clearInteractionSession();
        setTurnstileToken(null);
      }
      setLocalError(message);
    } finally {
      setIsSignupLoading(false);
    }
  };

  const finishSignup = () => {
    goToStep(null);
    redirectAfterSignup();
  };

  const handlePreferencesSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setLocalError(t('signup_profile_no_user'));
      return;
    }

    setIsSignupLoading(true);
    setLocalError(null);

    try {
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

      setTimeout(finishSignup, 1000);
    } catch (error) {
      console.error('Preferences update error:', error);
      setLocalError(parseMessageFromError(error));
    } finally {
      setIsSignupLoading(false);
    }
  };

  const authUserWithGoogle = async () => {
    setIsLogin(false);
    const authRes = await authGoogle({ turnstileToken });
    if (authRes.result === 'login') {
      // Google matched an existing account, so this is a login: hand over to
      // the redirect effect instead of leaving them staring at the form.
      setIsLogin(true);
      goToStep(null);
    }
    if (authRes.result === 'signup') {
      gaEvent('sign_up', {
        category: 'signing',
      });
      localStorage.setItem('signupCompleted', 'true');
      goToStep('profile');
    }
  };

  const hasProfileInput =
    !!preferences.about || !!preferences.superpower || !!preferences.dream;

  if (hasSignedUp && !authError && step !== 'profile') {
    return (
      <Card className="w-full bg-background p-5 sm:p-7 gap-3">
        <Heading level={2}>{t('signup_success')}</Heading>
        <p className="text-gray-500">{t('signup_success_cta')}</p>
      </Card>
    );
  }

  if (step === 'profile') {
    return (
      <Card className="w-full bg-background p-5 sm:p-7 gap-6">
        <form className="flex flex-col gap-5" onSubmit={handlePreferencesSubmit}>
          <div className="flex flex-col gap-2">
            <Heading level={2}>{t('signup_profile_title')}</Heading>
            <p className="text-sm text-gray-500">
              {t('signup_profile_description')}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className={FIELD_LABEL_CLASS} htmlFor="signup-about">
              {t('settings_about_you')}
            </label>
            <Textarea
              id="signup-about"
              placeholder={t('settings_tell_us_more_about_yourself')}
              value={preferences.about}
              onChange={(e) => updatePreferences({ about: e.target.value })}
            />
          </div>

          <Input
            id="signup-superpower"
            label={t('settings_superpower')}
            placeholder={t('settings_superpower_placeholder')}
            value={preferences.superpower}
            onChange={(e) => updatePreferences({ superpower: e.target.value })}
          />

          <Input
            id="signup-dream"
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

          <div className="w-full flex flex-col gap-3 items-center">
            <Button
              isEnabled={hasProfileInput && !isSignupLoading}
              isLoading={isSignupLoading}
            >
              {t('generic_save_button')}
            </Button>
            <button
              type="button"
              className="text-sm text-gray-500 underline underline-offset-2 hover:no-underline"
              onClick={finishSignup}
            >
              {t('signup_profile_skip')}
            </button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-background p-5 sm:p-7 gap-6">
      <form className="flex flex-col gap-5" onSubmit={handleCreateAccount}>
        <input
          type="hidden"
          name="backurl"
          value={decodeURIComponent((back as string) || '/')}
        />

        <Input
          id="signup-name"
          name="name"
          autoComplete="name"
          autoFocus
          label={t('signup_form_name')}
          placeholder={t('signup_form_name_placeholder')}
          value={application.screenname}
          onChange={(e) => updateApplication({ screenname: e.target.value })}
        />

        <Input
          id="signup-email"
          name="email"
          autoComplete="email"
          label={t('signup_form_email')}
          placeholder={t('signup_form_email_placeholder')}
          value={application.email}
          onChange={(e) => updateApplication({ email: e.target.value })}
          validation="email"
        />

        <div className="flex flex-col gap-2">
          <Input
            id="signup-password"
            name="new-password"
            autoComplete="new-password"
            type={isPasswordVisible ? 'text' : 'password'}
            label={t('signup_form_password')}
            placeholder={t('signup_form_password_placeholder')}
            value={application.password}
            onChange={(e) => updateApplication({ password: e.target.value })}
          />
          <div className="flex justify-between items-start gap-4">
            <p
              className={`text-xs leading-relaxed ${
                showPasswordHintAsError ? 'text-accent' : 'text-gray-500'
              }`}
            >
              {t('signup_form_password_hint')}
            </p>
            <button
              type="button"
              className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-complimentary-core shrink-0"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible
                ? t('signup_form_password_hide')
                : t('signup_form_password_show')}
            </button>
          </div>
        </div>

        {emailExists ? (
          <div className="text-sm bg-accent-light rounded-lg px-4 py-3">
            {t('signup_form_email_exists')}{' '}
            <Link
              className="text-accent underline font-bold"
              href={`/login${signupQuery}`}
            >
              {t('login_title')}
            </Link>
          </div>
        ) : (
          (localError || authError) && (
            <ErrorMessage error={localError || authError} />
          )
        )}

        <Checkbox
          className="!mb-0"
          id="emailConsent"
          isChecked={isEmailConsent}
          onChange={() => setIsEmailConsent(!isEmailConsent)}
        >
          <span className="text-sm text-gray-500 font-normal">
            {t('signup_form_email_consent')}
          </span>
        </Checkbox>

        <TurnstileWidget
          action="signup"
          {...createTurnstileHandlers(setTurnstileToken)}
        />

        <Button isEnabled={canCreateAccount} isLoading={isSignupLoading}>
          {t('signup_form_create')}
        </Button>
      </form>

      {process.env.NEXT_PUBLIC_FIREBASE_CONFIG && (
        <>
          <Divider label={t('or')} />
          <GoogleButton
            isLoading={isGoogleLoading}
            isEnabled={isTurnstileSubmitEnabled(turnstileToken)}
            onClick={authUserWithGoogle}
          />
        </>
      )}

      <p className="text-center text-sm text-gray-500 border-t border-gray-100 pt-5">
        {t('signup_form_have_account')}{' '}
        <Link
          data-testid="login-link"
          className="text-accent font-medium underline underline-offset-2 hover:no-underline"
          href={`/login${signupQuery}`}
        >
          {t('login_title')}
        </Link>
      </p>
    </Card>
  );
};

export default SignupForm;
