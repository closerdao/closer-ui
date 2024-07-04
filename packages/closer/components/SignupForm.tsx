import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FormEvent, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { event as gaEvent } from 'nextjs-google-analytics';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../constants';
import { useAuth } from '../contexts/auth';
import { getRedirectUrl } from '../utils/auth.helpers';
import { __, isInputValid } from '../utils/helpers';
import GoogleButton from './GoogleButton';
import { Button, Card, Checkbox, ErrorMessage, Input } from './ui';
import Heading from './ui/Heading';

interface Props {
  app: string | undefined;
}

const SignupForm = ({ app }: Props) => {
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

  const [application, setApplication] = useState({
    screenname: '',
    phone: '',
    email: '',
    password: '',
    fields: {},
    source: typeof window !== 'undefined' && window.location.href,
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

  const updateApplication = (update: any) => {
    setApplication((prevState) => ({ ...prevState, ...update }));
  };

  const isSignupDisabled =
    !application.password ||
    !application.screenname ||
    !isInputValid(application.email, 'email');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!application.email) {
      return;
    }
    const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
    await signup({
      ...application,
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
        // label: 'success',
      });
    }
    try {
    } catch (error) {
      console.error('Error signing in with Google', error);
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
          />{' '}
        </div>
      )}
      {hasSignedUp && !error ? (
        <>
          <Heading level={2} className="my-4">
            {__('signup_success')}
          </Heading>
          <p>{__('signup_success_cta')}</p>
        </>
      ) : (
        <form className=" flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="hidden"
            name="backurl"
            value={decodeURIComponent((back as string) || '/')}
          />

          <Input
            label={__('signup_form_name')}
            placeholder={__('signup_form_name_placeholder')}
            value={application.screenname}
            onChange={(e) =>
              updateApplication({
                screenname: e.target.value,
              })
            }
          />
          <Input
            label={__('signup_form_email')}
            placeholder={__('signup_form_email_placeholder')}
            value={application.email}
            onChange={(e) =>
              updateApplication({
                email: e.target.value,
              })
            }
          />
          <Input
            type="password"
            placeholder={__('signup_form_password_placeholder')}
            label={__('signup_form_password')}
            value={application.password}
            onChange={(e) =>
              updateApplication({
                password: e.target.value,
              })
            }
          />
          <Checkbox
            className="my-4"
            id="emailConsent"
            isChecked={isEmailConsent}
            onChange={() => setIsEmailConsent(!isEmailConsent)}
          >
            {__('signup_form_email_consent')}
          </Checkbox>

          {error && <ErrorMessage error={error} />}
          <div className="w-full my-4 flex flex-col gap-6">
            <Button
              isEnabled={!isSignupDisabled && !isLoading && isEmailConsent}
              isLoading={isLoading}
            >
              {__('signup_form_create')}
            </Button>

            <GoogleButton
              isLoading={isGoogleLoading}
              onClick={authUserWithGoogle}
            />
          </div>
          <div className="text-center text-sm">
            {__('signup_form_have_account')}{' '}
              <Link
                data-testid="login-link"
              className="text-accent underline font-bold"
              href={`/login${signupQuery}`}
            >
              {__('login_title')}{' '}
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
};

export default SignupForm;
