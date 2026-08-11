import Head from 'next/head';

import { FC } from 'react';

import { getFaviconLinks } from '../../utils/favicon';

interface Props {
  /** `general.favicon` from the app config — an upload URL or a favicon id. */
  favicon?: string;
}

/**
 * Every app renders its own `<Head>` in `_app.tsx`, so the tab icon has to be
 * mounted there rather than in `AppHead`. Next merges `<Head>` instances and
 * dedupes by `key`, so this can sit alongside the app's own head block.
 *
 * The static `/favicon.ico` stays first: it answers the bare `GET /favicon.ico`
 * browsers issue before parsing any HTML, and it is what a community that never
 * sets a favicon keeps showing. Never point these at the header logo — a wide
 * logo is unreadable at 16px.
 */
export const FaviconLinks: FC<Props> = ({ favicon }) => {
  const links = getFaviconLinks(favicon, process.env.NEXT_PUBLIC_CDN_URL);

  return (
    <Head>
      <link
        key="favicon-static"
        rel="shortcut icon"
        type="image/x-icon"
        href="/favicon.ico"
      />
      {links?.kind === 'file' && (
        <link
          key="favicon-png"
          rel="icon"
          type="image/png"
          href={links.png}
        />
      )}
      {links?.kind === 'file' && (
        <link key="favicon-apple" rel="apple-touch-icon" href={links.png} />
      )}
      {links?.kind === 'id' && (
        <link
          key="favicon-generated-ico"
          rel="icon"
          type="image/x-icon"
          href={links.ico}
        />
      )}
      {links?.kind === 'id' && (
        <link
          key="favicon-32"
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={links.png32}
        />
      )}
      {links?.kind === 'id' && (
        <link
          key="favicon-192"
          rel="icon"
          type="image/png"
          sizes="192x192"
          href={links.png192}
        />
      )}
      {links?.kind === 'id' && (
        <link
          key="favicon-apple"
          rel="apple-touch-icon"
          sizes="180x180"
          href={links.png180}
        />
      )}
    </Head>
  );
};

export default FaviconLinks;
