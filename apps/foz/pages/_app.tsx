import App, { AppContext, AppProps } from 'next/app';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Script from 'next/script';

import { useEffect } from 'react';
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
  api,
  blockchainConfig,
} from 'closer';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import 'closer/public/styles.css';
import { prepareGeneralConfig } from 'closer/utils/app.helpers';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import appConfig from '../config';

interface AppOwnProps extends AppProps {
  configGeneral: any;
  enabledConfigs: string[];
}

export function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  const library = new Web3Provider(provider);
  return library;
}

const MyApp = ({
  Component,
  pageProps,
  configGeneral,
  enabledConfigs,
}: AppOwnProps) => {
  const config = prepareGeneralConfig(configGeneral);

  const { FACEBOOK_PIXEL_ID } = config || {};
  const router = useRouter();
  const { query } = router;
  const referral = query.referral;

  useEffect(() => {
    if (referral) {
      localStorage.setItem(REFERRAL_ID_LOCAL_STORAGE_KEY, referral as string);
    }
  }, [referral]);

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

      <ConfigProvider
        config={{
          ...config,
          ...blockchainConfig,
          ...appConfig,
          enabledConfigs,
        }}
      >
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
          color: '#000000',
          background: '#ffffff',
          fontSize: '13px',
          border: '1px solid #000000',
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

// This disables ASO everywhere https://nextjs.org/docs/pages/building-your-application/rendering/automatic-static-optimization
// TODO in the future: either migrate to App directory or do SSR data fetching on each page that uses general configs
MyApp.getInitialProps = async (context: AppContext) => {
  const ctx = await App.getInitialProps(context);
  const allConfigs = await api.get('/config');

  const configGeneral = allConfigs.data.results.find(
    (config: any) => config.slug === 'general',
  ).value;

  const enabledConfigs = allConfigs.data.results
    .filter((config: any) => config.value.enabled)
    .map((config: any) => config.slug);

  return {
    ...ctx,
    configGeneral,
    enabledConfigs,
  };
};

export default MyApp;
