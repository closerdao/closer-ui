import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FormEvent, useContext, useEffect, useState } from 'react';

import { Card, ErrorMessage, Heading, Input } from '../../components/ui';
import Button from '../../components/ui/Button';
import Switcher from '../../components/ui/Switcher';

import { useAuth } from '../../contexts/auth';
import { WalletDispatch, WalletState } from '../../contexts/wallet';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const loginOptions =
  process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true'
    ? ['Email', 'Wallet']
    : null;

const Login = () => {
  const { injected } = useContext(WalletState);
  const { signMessage } = useContext(WalletDispatch);

  const router = useRouter();

  const redirectBack = router.query?.back
    ? decodeURIComponent(
        new URLSearchParams(router.query as unknown as string).get('back') ||
          '',
      ).replace('back=', '')
    : '/';

  const { isAuthenticated, login, setAuthentification, error, setError } =
    useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isWeb3Loading, setWeb3Loading] = useState(false);
  const [isLoginWithWallet, setisLoginWithWallet] = useState(false);
  const [selectedSwitcherOption, setSelectedSwitcherOption] = useState('Email');

  if (isAuthenticated) {
    router.push(redirectBack);
  }

  useEffect(() => {
    if (selectedSwitcherOption === 'Wallet') {
      setisLoginWithWallet(true);
    } else {
      setisLoginWithWallet(false);
    }
  }, [selectedSwitcherOption]);

  const signInWithWallet = async (walletAddress: string) => {
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
        setError(e.response.data.error);
        return;
      }
      console.error(e);
    } finally {
      setWeb3Loading(false);
    }
  };

  const walletConnectAndSignInFlow = async (event: FormEvent) => {
    event.preventDefault();
    const activated = await injected.activate();
    if (activated?.account) {
      signInWithWallet(activated.account);
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
        <title>{__('login_title')}</title>
      </Head>
      <main className="flex flex-col items-center">
        <section className="min-w-prose w-96 flex flex-col gap-8 py-20">
          <Heading
            level={1}
            className="uppercase text-5xl sm:text-6xl font-extrabold"
          >
            {__('login_title')}
          </Heading>

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
                  label={__('login_email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                />
                <Input
                  label={__('login_password')}
                  value={password}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                />

                {error && <ErrorMessage error={error} />}

                <div className="flex flex-col justify-between items-center gap-4 sm:flex-row">
                  <div className="flex flex-col gap-4 w-full sm:flex-row py-6">
                    <Button isLoading={isLoading}>{__('login_submit')}</Button>
                  </div>
                </div>
              </form>
            ) : (
              <Button
                isEnabled={!isWeb3Loading}
                isLoading={isWeb3Loading}
                className="btn-primary"
                onClick={walletConnectAndSignInFlow}
              >
                {__('blockchain_sign_in_with_wallet')}
              </Button>
            )}
          </Card>
          <div className="text-center text-sm">
            {__('login_no_account')}{' '}
            <Link className="text-accent underline font-bold" href="/signup">
              {__('signup_form_create')}
            </Link>
            <Link
              href="/login/forgot-password"
              as="/login/forgot-password"
              className="block text-accent underline font-bold my-2"
            >
              {__('login_link_forgotten_password')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default Login;
