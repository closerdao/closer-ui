import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';

import { useEffect, useRef, useState } from 'react';

import { ErrorBoundary, Layout } from '@/components';

import AcceptCookies from 'closer/components/AcceptCookies';

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
  api,
  blockchainConfig,
} from 'closer';
import { configDescription } from 'closer/config';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import { NewsletterProvider } from 'closer/contexts/newsletter';
import { prepareGeneralConfig } from 'closer/utils/app.helpers';
import { NextIntlClientProvider } from 'next-intl';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import appConfig from '../config';
import rbacDefaultConfig from 'closer/constants/rbac';
import '../styles/index.css';

interface AppOwnProps extends AppProps {
  configGeneral: any;
}

export function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  const library = new Web3Provider(provider);
  return library;
}

const prepareDefaultConfig = () => {
  const general =
    configDescription.find((config) => config.slug === 'general')?.value ?? {};
  const transformedObject = Object.entries(general).reduce(
    (acc, [key, value]) => {
      return { ...acc, [key]: '' };
    },
    {},
  );
  return transformedObject;
};

const MyApp = ({ Component, pageProps }: AppOwnProps) => {
  const defaultGeneralConfig = prepareDefaultConfig();
  const router = useRouter();
  const { query } = router;
  const referral = query.referral;
  const mountedRef = useRef(false);
  const [config, setConfig] = useState<any>(
    prepareGeneralConfig(defaultGeneralConfig),
  );
  const [rbacConfig, setRBACConfig] = useState<any>(
    rbacDefaultConfig,
  );
  const [isLocalhost, setIsLocalhost] = useState(true); // Default to true to prevent initial flash
  const [isEnvironmentChecked, setIsEnvironmentChecked] = useState(false);




  const { FACEBOOK_PIXEL_ID } = config || {};

  useEffect(() => {
    if (referral) {
      localStorage.setItem(REFERRAL_ID_LOCAL_STORAGE_KEY, referral as string);
    }
  }, [referral]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;

      const isRunningLocally =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1');

      setIsLocalhost(isRunningLocally);
      setIsEnvironmentChecked(true);
    }

    (async () => {
      try {
        const [generalConfigRes, rbacConfigRes] = await Promise.all([
          api.get('config/general'),
          api.get('config/rbac')
        ]).catch(() => []);
        setConfig(prepareGeneralConfig(generalConfigRes?.data.results.value));
        setRBACConfig(rbacConfigRes?.data.results.value);
      } catch (err) {
        console.error(err);
        return;
      }
    })();
  }, []);

  const shouldShowWidget = !isLocalhost && isEnvironmentChecked;

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
      {shouldShowWidget && (
        <>
          <Script
            id="gptconfig"
            dangerouslySetInnerHTML={{
              __html: `window.GPTTConfig = {
                uuid: "a9d70d04c6b64f328acd966ad87e4fb4",
              };`,
            }}
          />
          <Script src="https://app.gpt-trainer.com/widget-asset.min.js" defer />
        </>
      )}

      <ConfigProvider
        config={{
          ...config,
          ...blockchainConfig,
          ...appConfig,
          rbacConfig
        }}
      >
        <ErrorBoundary>
          <NextIntlClientProvider
            locale={router.locale || 'en'}
            messages={pageProps.messages || {}}
            timeZone={config?.timeZone || appConfig.DEFAULT_TIMEZONE}
            onError={(error) => {
              console.error('Error in NextIntlClientProvider', error);
            }}
          >
            <AuthProvider>
              <PlatformProvider>
                <Web3ReactProvider getLibrary={getLibrary}>
                  <WalletProvider>
                    <Layout>
                      <GoogleAnalytics trackPageViews />
                      <NewsletterProvider>
                        <Component {...pageProps} config={config} />
                      </NewsletterProvider>
                    </Layout>
                    {/* TODO: create cookie consent page with property-specific parameters #357  */}
                    <AcceptCookies />
                  </WalletProvider>
                </Web3ReactProvider>
              </PlatformProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </ConfigProvider>
    </>
  );
};

export default MyApp;
