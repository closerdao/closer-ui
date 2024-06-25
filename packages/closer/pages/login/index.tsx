import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FormEvent, useContext, useEffect, useState } from 'react';

import { Card, ErrorMessage, Heading, Input } from '../../components/ui';
import Button from '../../components/ui/Button';
import Switcher from '../../components/ui/Switcher';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { WalletDispatch, WalletState } from '../../contexts/wallet';
import api from '../../utils/api';
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
  const { back, source, start, end, adults, useTokens, eventId, volunteerId } =
    router.query || {};

  const redirect = (hasSubscription: boolean) => {
    const dateFormat = 'YYYY-MM-DD';
    if (!source && !back) {
      redirectTo('/');
      return;
    }
    if (!source && back && start && end && adults) {
      redirectTo(
        `${back}?start=${dayjs(start as string).format(dateFormat)}&end=${dayjs(
          end as string,
        ).format(dateFormat)}&adults=${adults}&useTokens=${useTokens}${
          volunteerId ? `&volunteerId=${volunteerId}` : ''
        }${eventId ? `&eventId=${eventId}` : ''}`,
      );
      return;
    }
    if (!source && back) {
      redirectTo(`${back}`);
      return;
    }

    if (hasSubscription && source) {
      redirectTo(source as string);
      return;
    }
    if (!hasSubscription && source !== 'undefined') {
      const redirectUrl = back
        ? `${decodeURIComponent(back as string).replace('back=', '')}&source=${(
            source as string
          ).replace('&source=', '')}`
        : '/';
      redirectTo(redirectUrl);
      return;
    }
  };

  const redirectTo = (url: string) => {
    router.push(url);
  };

  const { isAuthenticated, user, login, setAuthentification, error, setError } =
    useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isWeb3Loading, setWeb3Loading] = useState(false);
  const [isLoginWithWallet, setisLoginWithWallet] = useState(false);
  const [selectedSwitcherOption, setSelectedSwitcherOption] = useState('Email');
  const [web3Error, setWeb3Error] = useState(null);

  if (isAuthenticated) {
    if (user && user?.subscription?.plan) {
      redirect(true);
    } else {
      redirect(false);
    }
  }

  useEffect(() => {
    if (selectedSwitcherOption === 'Wallet') {
      setisLoginWithWallet(true);
    } else {
      setisLoginWithWallet(false);
    }
  }, [selectedSwitcherOption]);

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
    setLoading(true);
    setError('');
    await login(email, password);
    setLoading(false);
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

          <Card className="w-full">
            {!isLoginWithWallet ? (
              <form onSubmit={onSubmit} className="w-full flex flex-col gap-6">
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
