import Head from 'next/head';
import { useRouter } from 'next/router';

import Footer from '../components/Footer';
import Navigation from '../components/Navigation';

import { Web3Provider } from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';

import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  FB_DOMAIN_VERIFICATION,
  SEMANTIC_URL,
} from '../config';
// import {
//   BLOCKCHAIN_DAO_TOKEN,
//   BLOCKCHAIN_NETWORK_ID,
//   BLOCKCHAIN_STABLE_COIN,
// } from '../config_blockchain';
import { AuthProvider } from '../contexts/auth';
import { BookingProvider } from '../contexts/booking/';
import { PlatformProvider } from '../contexts/platform';
import { WalletProvider } from '../contexts/wallet/';
import '../public/styles.css';
import { theme } from '../tailwind.config';

const Application = ({ Component, pageProps }) => {
  const router = useRouter();
  const query = router.query;
  if (query?.ref && typeof localStorage !== 'undefined') {
    localStorage.setItem('referrer', query.ref);
  }

  function getLibrary(provider) {
    const library = new Web3Provider(provider);
    return library;
  }

  // const tokensToWatch = {
  //   [BLOCKCHAIN_NETWORK_ID]: [BLOCKCHAIN_DAO_TOKEN, BLOCKCHAIN_STABLE_COIN],
  // };

  return (
    <div className="App">
      <Head>
        <title>{DEFAULT_TITLE}</title>
        <meta charSet="utf-8" />
        <meta name="description" content={DEFAULT_DESCRIPTION} />
        <meta name="og:url" content={`${SEMANTIC_URL}${router.asPath}`} />
        <meta property="og:type" content="article" />
        <meta
          name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0"
        />
        <meta name="theme-color" content={theme.extend.colors.primary} />
        <meta httpEquiv="content-language" content="en-us" />
        {FB_DOMAIN_VERIFICATION && (
          <meta
            name="facebook-domain-verification"
            content={FB_DOMAIN_VERIFICATION}
          />
        )}
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>
      <AuthProvider>
        <PlatformProvider>
          <Web3ReactProvider getLibrary={getLibrary}>
            <WalletProvider>
              <BookingProvider>
                <Navigation />
                <Component {...pageProps} />
              </BookingProvider>
            </WalletProvider>
          </Web3ReactProvider>
        </PlatformProvider>
      </AuthProvider>
      <Footer />
    </div>
  );
};

export default Application;
