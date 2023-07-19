import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useState } from 'react';

import { Button, ErrorMessage, Input } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const SetPasswordScreen = () => {
  const router = useRouter();
  const { completeRegistration, updatePassword, isAuthenticated, error } =
    useAuth();
  const [password, setPassword] = useState('');
  const [screenname, setName] = useState('');
  const [actionCompleted, setActionCompleted] = useState(false);
  let tokenContent: {
    screenname?: string;
    email?: string;
  } = {};

  if (router.query.signup_token) {
    try {
      const signupToken = router.query.signup_token as string;
      tokenContent = JSON.parse(
        Buffer.from(signupToken.split('.')[1], 'base64').toString('utf-8'),
      );
    } catch (err) {
      console.log('Failed to parse token:', err);
    }
  }

  return (
    <>
      <Head>
        <title>{__('login_set_password_title')}</title>
      </Head>

      <main className="w-full flex justify-center py-20">
        <section className="w-96">
          {isAuthenticated && router.query.signup_token ? (
            <div className="">{__('login_set_password_signout')}</div>
          ) : actionCompleted ? (
            <div className="flex flex-col gap-6">
              <p>{__('login_set_password_success')}</p>
              <Link
                href="/login"
                className="block text-center bg-accent rounded-full px-6 py-3 text-white uppercase"
              >
                {__('login_set_password_link')}
              </Link>
            </div>
          ) : router.query.signup_token || router.query.reset_token ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (router.query.reset_token) {
                  updatePassword(
                    router.query.reset_token as string,
                    password,
                    () => setActionCompleted(true),
                  );
                } else if (router.query.signup_token) {
                  completeRegistration(
                    router.query.signup_token as string,
                    {
                      password,
                      screenname,
                    },
                    () => router.push('/'),
                  );
                }
              }}
              className="flex flex-col gap-6"
            >
              <Heading className="mb-8">
                {__('login_set_password_registration')}
              </Heading>

              <div className="flex flex-col gap-4">
                {tokenContent && tokenContent.email && (
                  <p className="mb-4">
                    <i>
                      {__('login_set_password_registration_email')}{' '}
                      <b>{tokenContent.email}</b>.
                    </i>
                  </p>
                )}
                {tokenContent &&
                  !tokenContent.screenname &&
                  router.query.signup_token && (
                    <>
                      <Input
                        label={__('login_set_password_registration_name')}
                        value={screenname}
                        onChange={(e) => setName(e.target.value)}
                        placeholder=""
                      />
                    </>
                  )}
                <div>
                  <Input
                    label={__('login_set_password_registration_password')}
                    value={password}
                    type="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                  />
                </div>
              </div>
              {error && <ErrorMessage error={error} />}
              <Button>{__('login_set_password_registration')}</Button>
            </form>
          ) : (
            <div className="card">
              {__('login_set_password_registration_error')}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default SetPasswordScreen;
