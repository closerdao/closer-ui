import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';

import { useEffect, useState } from 'react';

import { ErrorBoundary, Layout } from '@/components';

import AcceptCookies from 'closer/components/AcceptCookies';
import { PromptGetInTouchProvider } from 'closer/components/PromptGetInTouchContext';

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
import { prepareGeneralConfig } from 'closer/utils/app.helpers';
import { NextIntlClientProvider } from 'next-intl';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import appConfig from '../config';
import '../styles/index.css';


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type Chain } from 'viem';
import { WagmiProvider, createConfig, http } from 'wagmi';

// Define OP Sepolia chain details
const opSepolia = {
  id: 11155420,
  name: 'OP Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.optimism.io'] },
    public: { http: ['https://sepolia.optimism.io'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia-optimistic.etherscan.io' },
  },
  testnet: true,
} as const satisfies Chain;

const chains = [opSepolia] as const; // Use OP Sepolia, assert as const for tuple type

// Updated getERPCTransport to use the chain's default RPC if Inverter RPC is not specifically needed for OP Sepolia
// Or, if Inverter provides an RPC for OP Sepolia, that could be used.
// For now, using the public OP Sepolia RPC.
const getERPCTransport = (chain: Chain) => {
  // Prefer Inverter RPC if available and configured for this chainId
  // For OP Sepolia, let's use its public RPC directly as per user instructions
  if (chain.id === opSepolia.id) {
    return http(chain.rpcUrls.default.http[0], { timeout: 10000 });
  }
  // Fallback or other chains (though we only have opSepolia in `chains` array now)
  return http(`https://rpc.inverter.network/main/evm/${chain.id}`, {
    timeout: 10000,
  });
};

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
    chains,
    multiInjectedProviderDiscovery: false,
    transports: {
        [opSepolia.id]: getERPCTransport(opSepolia),
    },
    ssr: true, 
    cacheTime: 5000, 
  })



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

  const [config, setConfig] = useState<any>(
    prepareGeneralConfig(defaultGeneralConfig),
  );

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
        setConfig(prepareGeneralConfig(generalConfigRes?.data.results.value));
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
          ...appConfig,
        }}
      >
        <ErrorBoundary>
          <NextIntlClientProvider
            locale={router.locale || 'en'}
            messages={pageProps.messages || {}}
            timeZone={config?.timeZone || appConfig.DEFAULT_TIMEZONE}
          >
            <AuthProvider>
            <PromptGetInTouchProvider>
              <PlatformProvider>
                <Web3ReactProvider getLibrary={getLibrary}>
                  <WalletProvider>
                        <QueryClientProvider client={queryClient}>
                          <WagmiProvider config={wagmiConfig} reconnectOnMount>
                            <Layout>
                                <GoogleAnalytics trackPageViews />
                                

                              <Component {...pageProps} config={config} />
                            </Layout>
                        </WagmiProvider>
                    </QueryClientProvider>
                    {/* TODO: create cookie consent page with property-specific parameters #357  */}
                    <AcceptCookies />
                  </WalletProvider>
                </Web3ReactProvider>
              </PlatformProvider>
              </PromptGetInTouchProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </ConfigProvider>
    </>
  );
};

export default MyApp;
