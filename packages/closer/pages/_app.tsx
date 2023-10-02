import { AppProps } from 'next/app';
import { useRouter } from 'next/router';

import { FC } from 'react';


import { ExternalProvider, Web3Provider } from '@ethersproject/providers';

import { closerConfig } from '../config';
import { blockchainConfig } from '../config_blockchain';
import { ConfigProvider } from '../contexts/config';
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
      <Component {...pageProps} />
      {/* <AuthProvider>
        <PlatformProvider>
          <Web3ReactProvider getLibrary={getLibrary}>
            <WalletProvider>
              <div className="h-100 w-100 static bg-[url('/images/backgrounds/light-green.svg')]">
                <AppHead />
                <Navigation />
                <Layout>
                  <Component {...pageProps} />
                </Layout>
                <Footer />
              </div>
            </WalletProvider>
          </Web3ReactProvider>
        </PlatformProvider>
      </AuthProvider> */}
    </ConfigProvider>
  );
};

export default Application;
