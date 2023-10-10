import { AppProps } from 'next/app';
import { useRouter } from 'next/router';

import { FC } from 'react';

import '../public/styles.css';

const Application: FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();
  const query = router.query;
  if (query?.ref && typeof localStorage !== 'undefined') {
    localStorage.setItem('referrer', query?.ref as string);
  }

  return (
    <Component {...pageProps} />

  );
};

export default Application;
