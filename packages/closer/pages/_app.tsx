import { AppProps } from 'next/app';
import { useRouter } from 'next/router';

import { FC } from 'react';

import Footer from '../components/Footer';
import Layout from '../components/Layout';
import Metatags from '../components/Metatags';
import Navigation from '../components/Navigation';

import { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';

import { closerConfig } from '../config';
import { blockchainConfig } from '../config_blockchain';
import { AuthProvider } from '../contexts/auth';
import { ConfigProvider } from '../contexts/config';
import { PlatformProvider } from '../contexts/platform';
import { WalletProvider } from '../contexts/wallet';
import '../public/styles.css';

const Application: FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();
  const query = router.query;
  if (query?.ref && typeof localStorage !== 'undefined') {
    localStorage.setItem('referrer', query?.ref as string);
  }

  function getLibrary(provider: ExternalProvider) {
    const library = new Web3Provider(provider);
    return library;
  }

  return (
    <ConfigProvider config={{ ...closerConfig, ...blockchainConfig }}>
      <AuthProvider>
        <PlatformProvider>
          <Web3ReactProvider getLibrary={getLibrary}>
            <WalletProvider>
              <Metatags />
              <Navigation />
              <Layout>
                <Component {...pageProps} />
              </Layout>
              <Footer />
            </WalletProvider>
          </Web3ReactProvider>
        </PlatformProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default Application;
