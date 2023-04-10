import Head from 'next/head';
import { useRouter } from 'next/router';

import { FC } from 'react';

import { useConfig } from '../../hooks/useConfig';
import { theme } from '../../tailwind.config';

export const AppHead: FC = () => {
  const router = useRouter();
  const { DEFAULT_TITLE, FB_DOMAIN_VERIFICATION, SEMANTIC_URL } =
    useConfig() || {};

  return (
    <Head>
      <title>{DEFAULT_TITLE}</title>
      <meta charSet="utf-8" />
      <meta name="description" content="" />
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
          content={String(FB_DOMAIN_VERIFICATION)}
        />
      )}
      <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
    </Head>
  );
};
