import Head from 'next/head';

import { FC } from 'react';

import { getGoogleFontsUrl, resolveFontStack } from '../../theming';

interface Props {
  /**
   * The `theming` config bucket. Apps pass the build-time snapshot value, so
   * this renders identically on the server and the client.
   */
  theming?: Record<string, unknown> | null;
}

/**
 * The runtime half of theming. Colours reach the browser as compiled Tailwind
 * classes and need nothing here, but a configured font does: the family has to
 * be fetched, and the shared `Heading` component carries no font class of its
 * own, so a heading font would never apply without an explicit rule.
 *
 * Mounted next to `FaviconLinks` in each app's `_app.tsx`, for the same reason
 * — Next merges `<Head>` instances and dedupes by `key`.
 */
export const ThemeStyles: FC<Props> = ({ theming }) => {
  const fontsUrl = getGoogleFontsUrl(theming as any);
  const headingStack = resolveFontStack(
    (theming as { fontFamilyHeading?: string })?.fontFamilyHeading,
  );

  const headingCss = headingStack
    ? `h1,h2,h3,h4,h5,h6{font-family:${headingStack
        .map((family) => (family.includes(' ') ? `'${family}'` : family))
        .join(',')};}`
    : null;

  if (!fontsUrl && !headingCss) return null;

  return (
    <Head>
      {fontsUrl ? (
        <link
          key="theme-fonts-preconnect"
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      ) : null}
      {fontsUrl ? (
        <link key="theme-fonts" rel="stylesheet" href={fontsUrl} />
      ) : null}
      {headingCss ? (
        <style
          key="theme-heading-font"
          dangerouslySetInnerHTML={{ __html: headingCss }}
        />
      ) : null}
    </Head>
  );
};

export default ThemeStyles;
