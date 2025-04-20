import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FormEvent, useContext, useEffect, useState } from 'react';

import GoogleButton from '../../components/GoogleButton';
import { Card, ErrorMessage, Heading, Input } from '../../components/ui';
import Button from '../../components/ui/Button';
import Switcher from '../../components/ui/Switcher';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import { useAuth } from '../../contexts/auth';
import { WalletDispatch, WalletState } from '../../contexts/wallet';
import api from '../../utils/api';
import { getRedirectUrl } from '../../utils/auth.helpers';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

const loginOptions =
  process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true'
    ? ['Email', 'Wallet']
    : null;

const Login = () => {
  const t = useTranslations();
  const { injected } = useContext(WalletState);
  const { signMessage } = useContext(WalletDispatch);

  const router = useRouter();
  const {
    isAuthenticated,
    user,
    login,
    setAuthentification,
    error,
    isLoading,
    hasSignedUp,
    isGoogleLoading,
    authGoogle,
  } = useAuth();
  const { back, source, start, end, adults, useTokens, eventId, volunteerId } =
    router.query || {};

  const redirectTo = (url: string) => {
    router.push(url);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isWeb3Loading, setWeb3Loading] = useState(false);
  const [isLoginWithWallet, setisLoginWithWallet] = useState(false);
  const [selectedSwitcherOption, setSelectedSwitcherOption] = useState('Email');
  const [web3Error, setWeb3Error] = useState(null);

  if (isAuthenticated && !hasSignedUp) {
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

  const redirectToSettings = () => {
    if (source) {
      router.push(
        `${decodeURIComponent(back as string)}&source=${source}` || '/settings',
      );
      return;
    }
    router.push(back ? `${decodeURIComponent(back as string)}` : '/settings');
  };

  useEffect(() => {
    if (selectedSwitcherOption === 'Wallet') {
      setisLoginWithWallet(true);
    } else {
      setisLoginWithWallet(false);
    }
  }, [selectedSwitcherOption]);

  useEffect(() => {
    if (isAuthenticated && hasSignedUp) {
      redirectToSettings();
    }
  }, [isAuthenticated, hasSignedUp, back]);

  useEffect(() => {
    const localEmail = localStorage.getItem('email');
    if (localEmail) {
      setEmail(localEmail);
    }
  }, []);

  const signInWithWallet = async (walletAddress: string) => {
    setWeb3Error(null);
    setWeb3Loading(true);
    try {
      const {
        data: { nonce },
      } = await api.post('/auth/web3/pre-sign', { walletAddress });
      const message = `Signing in with code ${nonce}`;
      const signedMessage = await signMessage(message, walletAddress);
      if (signedMessage) {
        const {
          data: { access_token: token, results: user },
        } = await api.post('/auth/web3/login', {
          signedMessage,
          walletAddress,
          message,
        });
        setAuthentification(user, token);
      }
    } catch (e: any) {
      if (e.response?.status === 401) {
        setWeb3Error(e.response.data.error);
        return;
      }
      console.error(e);
    } finally {
      setWeb3Loading(false);
    }
  };

  const walletConnectAndSignInFlow = async (event: FormEvent) => {
    event.preventDefault();
    setWeb3Error(null);
    try {
      const activated = await injected.activate();
      if (activated?.account) {
        signInWithWallet(activated.account);
      }
    } catch (error) {
      setWeb3Error(parseMessageFromError(error));
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await login({ email, password });
  };

  const authUserWithGoogle = async () => {
    const authRes = await authGoogle();
    if (authRes.result === 'signup') {
      gaEvent('sign_up', {
        category: 'signing',
        // label: 'success',
      });
    }
  };

  return (
    <>
      <Head>
        <title>{t('login_title')}</title>
      </Head>
      <main className="flex flex-col items-center">
        <section className="min-w-prose w-[280px] sm:w-96 flex flex-col gap-8 py-20">
          <Heading
            level={1}
            className="uppercase text-5xl sm:text-6xl font-extrabold"
          >
            {t('login_title')}
          </Heading>

          {back && (
            <p>
              {t('log_in_redirect_message')}{' '}
              <strong>
                {typeof back === 'string' &&
                  back.substring(back[0] === '/' ? 1 : 0).substring(0, 40)}
              </strong>
              {back.length > 40 && '...'} {t('log_in_redirect_message_page')}
            </p>
          )}

          {process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true' && (
            <Switcher
              options={loginOptions}
              selectedOption={selectedSwitcherOption}
              setSelectedOption={setSelectedSwitcherOption}
            />
          )}

          <Card className="w-full pb-12">
            {!isLoginWithWallet ? (
              <div>
                <form
                  onSubmit={onSubmit}
                  className="w-full flex flex-col gap-6"
                >
                  <Input
                    label={t('login_email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                  />
                  <Input
                    label={t('login_password')}
                    value={password}
                    type="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                  />

                  {error && <ErrorMessage error={error} />}

                  <div className="flex flex-col justify-between items-center gap-4 sm:flex-row">
                    <div className="flex flex-col gap-4 w-full sm:flex-row py-6">
                      <Button
                        isEnabled={!isWeb3Loading && !isLoading}
                        isLoading={isLoading}
                      >
                        {t('login_submit')}
                      </Button>
                    </div>
                  </div>
                </form>

                {process.env.NEXT_PUBLIC_FIREBASE_CONFIG && (
                  <GoogleButton
                    isLoading={isGoogleLoading}
                    onClick={authUserWithGoogle}
                  />
                )}
              </div>
            ) : (
              <div>
                {web3Error && <ErrorMessage error={web3Error} />}
                <Button
                  isEnabled={!isWeb3Loading && !isLoading}
                  isLoading={isWeb3Loading}
                  className="btn-primary"
                  onClick={walletConnectAndSignInFlow}
                >
                  {t('blockchain_sign_in_with_wallet')}
                </Button>
              </div>
            )}
          </Card>
          <div className="text-center text-sm">
            {t('login_no_account')}{' '}
            <Link
              className="text-accent underline font-bold"
              href={`/signup${
                back ? `?back=${encodeURIComponent(back as string)}` : ''
              }`}
            >
              {t('signup_form_create')}
            </Link>
            <Link
              href="/login/forgot-password"
              as="/login/forgot-password"
              className="block text-accent underline font-bold my-2"
            >
              {t('login_link_forgotten_password')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

Login.getInitialProps = async (context: NextPageContext) => {
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

export default Login;
