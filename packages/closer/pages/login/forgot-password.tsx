import Head from 'next/head';

import { FormEvent, useState } from 'react';

import { Button, ErrorMessage, Input } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isResetCompleted, setIsResetCompleted] = useState(false);

  const requestPasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reset-password', { email });
      setIsResetCompleted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <>
      <Head>
        <title>{__('login_forgot_password_title')}</title>
      </Head>

      <main className="w-full flex justify-center py-20">
        <section className="w-96">
          {isResetCompleted ? (
            <div>
              <Heading level={1} className="mb-4">
                {__('login_forgot_password_subtitle')}
              </Heading>
              <p>{__('login_forgot_password_cta', email)}</p>
            </div>
          ) : (
            <form
              className="flex flex-col gap-6"
              onSubmit={requestPasswordReset}
            >
              <Input
                label={__('login_forgot_password_email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && <ErrorMessage error={error} />}

              <Button>{__('login_forgot_password_submit')}</Button>
            </form>
          )}
        </section>
      </main>
    </>
  );
};

export default ForgotPasswordScreen;
