import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useContext, useState } from 'react';

import Layout from '../../components/Layout';

import { useAuth } from '../../contexts/auth';
import { WalletDispatch, WalletState } from '../../contexts/wallet';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const Login = () => {
  const { injected } = useContext(WalletState);
  const { signMessage } = useContext(WalletDispatch);

  const router = useRouter();
  const redirectBack = router.query?.back
    ? decodeURIComponent(router.query?.back)
    : '/';
  const { isAuthenticated, login, setAuthentification, error, setError } =
    useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    router.push(redirectBack);
  }

  const signInWithWallet = async (walletAddress) => {
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
    } catch (e) {
      if (e.response?.status === 401) {
        setError(e.response.data.error);
        return;
      }
      console.error(e);
    }
  };

  const walletConnectAndSignInFlow = async (event) => {
    event.preventDefault();
    const activated = await injected.activate();
    if (activated?.account) {
      signInWithWallet(activated.account);
    } else {
      console.log('no account activated');
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    login(email, password);
    setError('');
  };

  return (
    <Layout>
      <Head>
        <title>{__('login_title')}</title>
      </Head>
      <main className="main-content max-w-prose center intro flex flex-col justify-center flex-1">
        {error && <p className="text-primary my-4 text-center">{error}</p>}
        <form onSubmit={onSubmit}>
          <div className="w-full mb-4">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="email"
            >
              {__('login_email')}
            </label>
            <input
              className="w-full bg-transparent"
              type="email"
              name="email"
              id="email"
              value={email}
              placeholder="name@awesomeproject.co"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="w-full mb-4">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="password"
            >
              {__('login_password')}
            </label>
            <input
              className="w-full bg-transparent"
              type="password"
              name="password"
              id="password"
              value={password}
              placeholder="*****"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col justify-between items-center gap-4 sm:flex-row">
            <div className="flex flex-col gap-4 w-full sm:flex-row">
              <button type="submit" className="btn-primary w-full sm:w-auto">
                {__('login_submit')}
              </button>
              <button
                type="submit"
                className="btn-primary"
                onClick={walletConnectAndSignInFlow}
              >
                {__('blockchain_sign_in_with_wallet')}
              </button>
            </div>

            <Link href="/login/forgot-password" as="/login/forgot-password">
              <a className="whitespace-nowrap">
                {__('login_link_forgot_password')}
              </a>
            </Link>
          </div>
        </form>
      </main>
    </Layout>
  );
};

export default Login;
