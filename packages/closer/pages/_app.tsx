import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';

import { useEffect, useState } from 'react';
import 'react-image-lightbox/style.css';

import { PromptGetInTouchProvider } from '../components/PromptGetInTouchContext';

import {
  AuthProvider,
  ConfigProvider,
  PlatformProvider,
  api,
} from 'closer';
import { blockchainConfig } from '../config_blockchain';
import { configDescription } from 'closer/config';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import { NewsletterProvider } from '../contexts/newsletter';
import { prepareGeneralConfig } from 'closer/utils/app.helpers';
import { NextIntlClientProvider } from 'next-intl';
import { GoogleAnalytics } from 'nextjs-google-analytics';
import { WalletProvider } from '../contexts/wallet';

interface AppOwnProps extends AppProps {
  configGeneral: any;
}

const prepareDefaultConfig = () => {
  const general =
    configDescription.find((config) => config.slug === 'general')?.value ?? {};
  const transformedObject = Object.entries(general).reduce(
    (acc, [key]) => {
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

  const [config, setConfig] = useState<any>(
    prepareGeneralConfig(defaultGeneralConfig),
  );

  const { FACEBOOK_PIXEL_ID } = config || {};

  useEffect(() => {
    if (referral) {
      localStorage.setItem(REFERRAL_ID_LOCAL_STORAGE_KEY, referral as string);

      (async () => {
        try {
          await api.post('/metric', {
            event: 'referral-view',
            value: referral,
            number: 1,
            point: 1,
            category: 'engagement',
          });
        } catch (error) {
          console.error('Error tracking referral view:', error);
        }
      })();
    }
  }, [referral]);

  useEffect(() => {
    (async () => {
      try {
        const [generalConfigRes, rbacConfigRes] = await Promise.all([
          api.get('config/general').catch(() => null),
          api.get('config/rbac').catch(() => null),
        ]);

        const generalConfig = generalConfigRes?.data?.results?.value;
        const rbacConfig = rbacConfigRes?.data?.results?.value;

        setConfig(
          prepareGeneralConfig({
            ...generalConfig,
            rbacConfig: rbacConfig || {},
          }),
        );
      } catch (err) {
        console.error(err);
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

      <ConfigProvider
        config={{
          ...config,
          ...blockchainConfig,
        }}
      >
        <NextIntlClientProvider
          locale={router.locale || 'en'}
          messages={pageProps.messages || {}}
          timeZone={config.timeZone || 'Europe/Lisbon'}
        >
          <AuthProvider>
            <PlatformProvider>
              <WalletProvider>
                <GoogleAnalytics trackPageViews />
                <PromptGetInTouchProvider>
                  <NewsletterProvider>
                    <Component {...pageProps} config={config} />
                  </NewsletterProvider>
                </PromptGetInTouchProvider>
              </WalletProvider>
            </PlatformProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </ConfigProvider>
    </>
  );
};

export default MyApp;
