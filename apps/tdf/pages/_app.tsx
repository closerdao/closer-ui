import { AppProps } from 'next/app';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Script from 'next/script';

import { useEffect, useState } from 'react';
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
  GeneralConfig,
  PlatformProvider,
  WalletProvider,
  __,
  api,
  blockchainConfig,
} from 'closer';
import { configDescription } from 'closer/config';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import 'closer/public/styles.css';
import { prepareGeneralConfig } from 'closer/utils/app.helpers';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import appConfig from '../config';

interface AppOwnProps extends AppProps {
  configGeneral: any;
}

export function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  const library = new Web3Provider(provider);
  return library;
}

const MyApp = ({ Component, pageProps }: AppOwnProps) => {
  const defaultGeneralConfig = configDescription.find(
    (config) => config.slug === 'general',
  )?.value;

  const router = useRouter();
  const { query } = router;
  const referral = query.referral;

  const [generalConfig, setGeneralConfig] = useState<GeneralConfig | null>(
    null,
  );
  const config = generalConfig
    ? prepareGeneralConfig(generalConfig)
    : prepareGeneralConfig(defaultGeneralConfig);
  const { FACEBOOK_PIXEL_ID } = config || {};

  useEffect(() => {
    if (referral) {
      localStorage.setItem(REFERRAL_ID_LOCAL_STORAGE_KEY, referral as string);
    }
  }, [referral]);

  useEffect(() => {
    (async () => {
      try {
        const generalConfigRes = await api.get('config/general').catch(() => {
          return;
        });
        setGeneralConfig(generalConfigRes?.data.results.value);
      } catch (err) {
        setGeneralConfig(null);
        return;
      }
    })();
  }, []);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
      </Head>

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

      {/* TDF specific chatbot widget */}
      <Script
        id="gptconfig"
        dangerouslySetInnerHTML={{
          __html: `window.GPTTConfig = {
              uuid: "a9d70d04c6b64f328acd966ad87e4fb4",
            };`,
        }}
      />
      <Script src="https://app.gpt-trainer.com/widget-asset.min.js" defer />

      <ConfigProvider
        config={{
          ...config,
          ...blockchainConfig,
          ...appConfig,
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

      {/* TODO: create cookie consent page with property-specific parameters #357  */}
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
