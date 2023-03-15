import { AppProps } from 'next/app';

import { FC } from 'react';

import { ErrorBoundary } from '@/components';
import { Layout } from '@/components';

import {
  ExternalProvider,
  JsonRpcFetchFunc,
  Web3Provider,
} from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';
import { AuthProvider, PlatformProvider, WalletProvider } from 'closer';
// import '../styles/index.css';
import 'closer/public/styles.css';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import config from '../config';

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
    const library = new Web3Provider(provider);
    return library;
  }
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PlatformProvider>
          <Web3ReactProvider getLibrary={getLibrary}>
            <WalletProvider>
              <Layout>
                <GoogleAnalytics trackPageViews />
                <Component {...pageProps} config={config} />
              </Layout>
            </WalletProvider>
          </Web3ReactProvider>
        </PlatformProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default MyApp;
