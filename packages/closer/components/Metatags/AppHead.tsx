import Head from 'next/head';
import { useRouter } from 'next/router';

import { FC } from 'react';

import { useConfig } from '../../hooks/useConfig';
import { theme } from '../../tailwind.config';

export const AppHead: FC = () => {
  const router = useRouter();
  const { DEFAULT_TITLE, FB_DOMAIN_VERIFICATION, SEMANTIC_URL, PLATFORM_NAME, LOGO_HEADER } =
    useConfig() || {};

  const fullUrl = `${SEMANTIC_URL}${router.asPath}`;
  const defaultDescription = 'The operating system for regenerative communities. Manage guests, spaces, events and resources through one intuitive platform designed specifically for land-based projects.';
  const ogImage = LOGO_HEADER ? `${SEMANTIC_URL}${LOGO_HEADER}` : `${SEMANTIC_URL}/images/logo.png`;

  return (
    <Head>
      <title>{DEFAULT_TITLE}</title>
      <meta charSet="utf-8" />
      <meta name="description" content={defaultDescription} />
      <meta name="keywords" content="regenerative communities, community management, booking system, event management, DAO, decentralized governance, ecovillage, intentional community" />
      <meta name="author" content={PLATFORM_NAME || 'Closer'} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />
      
      <meta property="og:title" content={DEFAULT_TITLE} />
      <meta property="og:description" content={defaultDescription} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={PLATFORM_NAME || 'Closer'} />
      <meta property="og:locale" content="en_US" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={DEFAULT_TITLE} />
      <meta name="twitter:description" content={defaultDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      <meta
        name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0"
      />
      <meta name="theme-color" content={theme.extend.colors.primary} />
      <meta httpEquiv="content-language" content="en-us" />
      {FB_DOMAIN_VERIFICATION && (
        <meta
          name="facebook-domain-verification"
          content={String(FB_DOMAIN_VERIFICATION)}
        />
      )}
      <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      {LOGO_HEADER && (
        <>
          <link rel="icon" type="image/png" href={LOGO_HEADER} />
          <link rel="apple-touch-icon" href={LOGO_HEADER} />
        </>
      )}
    </Head>
  );
};
