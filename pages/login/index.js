import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useState } from 'react';

import Layout from '../../components/Layout';

import { useAuth } from '../../contexts/auth';
import { useWallet } from '../../hooks/useWallet';

import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const Login = () => {
  const { account, signMessage, isWalletConnected, connectWallet } = useWallet()

  const router = useRouter();
  const { isAuthenticated, login, setAuthentification, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ shouldFollowUpOnConnectAndSign, setShouldFollowUpOnConnectAndSign ] = useState('')

  if (isAuthenticated && typeof window.location !== 'undefined') {
    // router.push('/');
    // For some reason, cache needs to get reset.
    window.location.href = decodeURIComponent(router.query.back || '/');
  }


  const executeRestOfSignInWithWallet = async() => {
    try {
      const { data: { nonce } } = await api.post('/auth/web3/pre-sign', { walletAddress: account });
      const message =  `Signing in with code ${nonce}`;
      const signedMessage = await signMessage(message)
      const {
        data: { access_token: token, results: user },
      } = await api.post('/auth/web3/login', {
        signedMessage,
        walletAddress: account,
        message
      });
      setAuthentification(user, token)
    } catch (error) {
      setError(error.message);
    }
  }

  const walletConnectAndSignInFlow = async () => {
    setShouldFollowUpOnConnectAndSign(true)
    if(!isWalletConnected){
      connectWallet()
    }else{
      executeRestOfSignInWithWallet()
    }
  }

  //The following goes on after the above connect and injected account are made available to use
  //There is probably a better way to connect, and then to wait for useWeb3React hook above to refresh account
  //And then synchronously continue
  useEffect(() => {
    if(shouldFollowUpOnConnectAndSign){
      executeRestOfSignInWithWallet()
      setShouldFollowUpOnConnectAndSign(false)
    }
  }, [account])

  return (
    <Layout>
      <Head>
        <title>{__('login_title')}</title>
      </Head>
      <div className="mural">
        <main className="main-content max-w-prose center intro">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login(email, password);
            }}
          >
            <div className="w-full mb-4">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                htmlFor="email"
              >
                {__('login_email')}
              </label>
              <input
                className="w-full"
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
                className="w-full"
                type="password"
                name="password"
                id="password"
                value={password}
                placeholder="*****"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="card-footer">
              <div className="flex flex-row justify-between items-end">
                <button type="submit" className="btn-primary">
                  {__('login_submit')}
                </button>
                <div>
                  <Link
                    href="/login/forgot-password"
                    as="/login/forgot-password"
                  >
                    <a>{__('login_link_forgot_password')}</a>
                  </Link>
                </div>
              </div>
            </div>
          </form>


          <hr className="my-4 mt-10" />
          <button type="submit" className="btn-primary"
          onClick={async () => {
            await walletConnectAndSignInFlow();
          }}>
            {__('blockchain_sign_in_with_wallet')}
          </button>
        </main>
      </div>
    </Layout>
  );
};

export default Login;
