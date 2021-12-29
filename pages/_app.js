import api, { formatSearch } from '../utils/api'
import Head from 'next/head'
import App from 'next/app'
import Router, { useRouter } from 'next/router';
import '../public/fonts/Satoshi.css';
import '../public/fonts/OpenSans.css';
import '../public/fonts/Gilroy.css';
import '../public/styles.css';
import { isSignedIn, setSession } from '../utils/auth';

const Application = ({ tags, query, signedIn, Component, pageProps, token, user }) => {
  const router = useRouter();

  if (query?.ref && typeof localStorage !== 'undefined') {
    localStorage.setItem('referrer', query.ref);
  }

  if (typeof token !== 'undefined') {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  }

  return (
    <div className="App bg-pink-50 text-blue-500 underline-offset-2">
      <Head>
        <title>Traditional Dream Factory | Regenerative coliving space in Alentejo, Portugal</title>
        <meta charSet="utf-8" />
        <noscript>
          <link href="/reset.css" rel="stylesheet" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link href="https://fonts.googleapis.com/css2?family=Prata&display=swap" rel="stylesheet" />
          <link href="/fonts/Avenir.css" rel="stylesheet" />
          <link href="/fonts/icons.css" rel="stylesheet" />
          <link href="/styles.css" rel="stylesheet" />
        </noscript>
        <meta name="description" content="Traditional Dream Factory is a creative coliving in rural Alentejo, Portugal with coworking, coliving, restaurant, cafe and cultural events." />
        <meta name="og:url" content={`https://traditionaldreamfactory.com${router.asPath}`} />
        <meta property="og:type" content="article" />
        <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0" />
        <meta name="theme-color" content="#4a21e8" />
        <meta property="og:image" content="https://traditionaldreamfactory.com/images/logo-sheep.png" />
        <meta httpEquiv="content-language" content="en-us"/>
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} query={ query } user={ user } signedIn={ signedIn } />
    </div>
  );
};

const redirects = {};

Application.getInitialProps = async (appContext) => {
  try {
    const token = setSession(appContext.ctx);
    const [appProps, user] = await Promise.all([
      App.getInitialProps(appContext),
      token && await api.get('/mine/user')
    ]);
    if (appContext.ctx?.res && redirects[appContext?.ctx?.req?.url]) {
      appContext.ctx.res.writeHead(301, { Location: redirects[appContext?.ctx?.req?.url] })
      appContext.ctx.res.end();
      return;
    }

    return {
      ...appProps,
      signedIn: !!token,
      token,
      user: user?.data?.results,
      query: appContext?.ctx?.query,
      tags: []
    };
  } catch (error) {
    return {
      error
    };
  }
}

export default Application;
