import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FormEvent, useEffect, useState } from 'react';

import { event as gaEvent } from 'nextjs-google-analytics';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../constants';
import { useAuth } from '../contexts/auth';
import { parseMessageFromError } from '../utils/common';
import { __, isInputValid } from '../utils/helpers';
import { Button, Card, Checkbox, ErrorMessage, Input } from './ui';
import Heading from './ui/Heading';

const SignupForm = () => {
  const router = useRouter();
  const { back, source } = router.query || {};
  const { signup, isAuthenticated, error, setError } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [application, setApplication] = useState({
    screenname: '',
    phone: '',
    email: '',
    password: '',
    fields: {},
    source: typeof window !== 'undefined' && window.location.href,
  });

  const [isEmailConsent, setIsEmailConsent] = useState(true);
  const handleSubmit = async (e: FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    setError(null);
    if (!application.email) {
      setError('Please enter a valid email.');
      return;
    }

    try {
      const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
      const response = await signup({
        ...application,
        ...(referredBy && { referredBy }),
      });

      if (response && response._id) {
        setSubmitted(true);
        gaEvent('sign_up', {
          category: 'signing',
          label: 'success',
        });
      } else {
        console.log('Invalid response', response);
      }
    } catch (err: unknown) {
      setError(parseMessageFromError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const redirect = () => {
    if (source) {
      router.push(
        `${decodeURIComponent(back as string)}&source=${source}` || '/settings',
      );
      return;
    }
    router.push(
      `${decodeURIComponent(back as string)}&back=${back}` || '/settings',
    );
  };

  useEffect(() => {
    if (isAuthenticated) {
      redirect();
    }
    if (submitted && back && !error) {
      setTimeout(() => {
        redirect();
      }, 2000);
    }
  }, [isAuthenticated, submitted, back]);

  const updateApplication = (update: any) => {
    setError(null);
    setApplication((prevState) => ({ ...prevState, ...update }));
  };

  const isSignupDisabled =
    !application.password ||
    !application.screenname ||
    !isInputValid(application.email, 'email');

  return (
    <Card className="pb-8 relative mt-[200px] md:mt-0">
      <div className="absolute top-[-202px] h-[200px] overflow-hidden w-[90%]">
        <Image
          className="mx-auto"
          alt="e"
          src="/images/subscriptions/explorer.png"
          width={200}
          height={354}
        />{' '}
      </div>
      {submitted && !error ? (
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
            value={application.screenname}
            onChange={(e) =>
              updateApplication({
                screenname: e.target.value,
              })
            }
          />
          <Input
            label={__('signup_form_email')}
            placeholder={__('signup_form_email')}
            value={application.email}
            onChange={(e) =>
              updateApplication({
                email: e.target.value,
              })
            }
          />
          <Input
            type="password"
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
          <div className="w-full my-4">
            <Button
              isEnabled={!isSignupDisabled && !isLoading && isEmailConsent}
              isLoading={isLoading}
            >
              {__('signup_form_create')}
            </Button>
          </div>
          <div className="text-center text-sm">
            {__('signup_form_have_account')}{' '}
            <Link className="text-accent underline font-bold" href="/login">
              {__('login_title')}{' '}
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
};

export default SignupForm;
