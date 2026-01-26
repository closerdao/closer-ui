import Head from 'next/head';

import { FormEvent, useState } from 'react';

import TurnstileWidget from '../../components/TurnstileWidget';
import { Button, ErrorMessage, Input } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import api from '../../utils/api';
import { loadLocaleData } from '../../utils/locale.helpers';

const ForgotPasswordScreen = () => {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isResetCompleted, setIsResetCompleted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const requestPasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reset-password', { email, recaptchaToken: turnstileToken });
      setIsResetCompleted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <>
      <Head>
        <title>{t('login_forgot_password_title')}</title>
      </Head>

      <main className="w-full flex justify-center py-20">
        <section className="w-96">
          {isResetCompleted ? (
            <div>
              <Heading level={1} className="mb-4">
                {t('login_forgot_password_subtitle')}
              </Heading>
              <p>{t('login_forgot_password_cta')}</p>
            </div>
          ) : (
            <form
              className="flex flex-col gap-6"
              onSubmit={requestPasswordReset}
            >
              <Input
                label={t('login_forgot_password_email')}
                placeholder={t('signup_form_email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && <ErrorMessage error={error} />}

              <TurnstileWidget
                action="forgot_password"
                onVerify={setTurnstileToken}
              />

              <Button isEnabled={!!turnstileToken}>{t('login_forgot_password_submit')}</Button>
            </form>
          )}
        </section>
      </main>
    </>
  );
};

ForgotPasswordScreen.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default ForgotPasswordScreen;
