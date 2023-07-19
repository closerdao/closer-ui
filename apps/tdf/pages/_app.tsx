import { AppProps } from 'next/app';
import Link from 'next/link';
import Script from 'next/script';

import { FC } from 'react';
import CookieConsent from 'react-cookie-consent';

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
  __,
  blockchainConfig,
} from 'closer';
import 'closer/public/styles.css';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import config from '../config';

export function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  const library = new Web3Provider(provider);
  return library;
}

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  const { FACEBOOK_PIXEL_ID } = config || {};

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
      <CookieConsent
        buttonText={__('cookie_consent_button')}
        expires={365}
        style={{ background: '#ffffff', borderTop: '1px solid #F3F4F6' }}
        buttonStyle={{
          borderRadius: '20px',
          padding: '5px 15px 5px 15px',
          color: '#FE4FB7',
          background: '#ffffff',
          fontSize: '13px',
          border: '1px solid #FE4FB7',
        }}
      >
        <div className="text-black text-sm">
          {__('cookie_consent_text')}{' '}
          <Link className="underline" href="/pdf/TDF-Cookies.pdf">
            {__('cookie_consent_text_link')}
          </Link>
        </div>
      </CookieConsent>
    </>
  );
};

export default MyApp;
