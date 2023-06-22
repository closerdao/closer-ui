import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';

import { FC, useEffect } from 'react';

import { ErrorBoundary, Layout } from '@/components';

import {
  ExternalProvider,
  JsonRpcFetchFunc,
  Web3Provider,
} from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';
import {
  AuthProvider,
  ConfigProvider,
  PlatformProvider,
  WalletProvider,
  blockchainConfig,
} from 'closer';
import 'closer/public/styles.css';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import config from '../config';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';

export function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  const library = new Web3Provider(provider);
  return library;
}

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  const { FACEBOOK_PIXEL_ID } = config || {};
  const router = useRouter();
  const { query } = router;
  const referral = query.referral;

  useEffect(() => {
    const currentReferralId = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
    if (!currentReferralId && referral) {
      localStorage.setItem(REFERRAL_ID_LOCAL_STORAGE_KEY, referral as string);
    }
  }, []);

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FACEBOOK_PIXEL_ID}');
fbq('track', 'PageView');
`,
        }}
      />

      <ConfigProvider config={{ ...config, ...blockchainConfig }}>
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
      </ConfigProvider>
    </>
  );
};

export default MyApp;
