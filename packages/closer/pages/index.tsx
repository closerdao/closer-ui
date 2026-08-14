import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import { useTranslations } from 'next-intl';
import { event } from 'nextjs-google-analytics';

import Heading from '../components/ui/Heading';
import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';
import { GeneralConfig } from '../types';
import type { PageDoc } from '../types/page';
import { getCachedConfig } from '../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../utils/common';
import { resolveStandardOrDbPage } from '../utils/standardPages';
import { CustomPageView } from './customPageView';

interface Props {
  generalConfig: GeneralConfig | null;
  page: PageDoc | null;
  error?: string;
}

const HOME_PAGE_SLUG = '/';

/**
 * Shown until the platform has a home page worth rendering — the `/` standard
 * page is editable in the page editor, so this is only the very first impression.
 */
const WelcomeHome = ({ generalConfig }: { generalConfig: GeneralConfig | null }) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const { isAuthenticated } = useAuth();
  const platformName =
    generalConfig?.platformName || defaultConfig?.platformName || '';
  const tagline = defaultConfig?.DEFAULT_TITLE || '';

  return (
    <>
      <Head>
        <title>{platformName}</title>
        <meta name="description" content={t('home_meta_description')} />
        <meta property="og:title" content={platformName} />
        <meta property="og:description" content={t('home_meta_description')} />
        <meta property="og:type" content="website" />
      </Head>
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <Heading
          display
          level={1}
          className="text-5xl sm:text-7xl font-normal leading-none"
        >
          {t('home_welcome_title', { var: platformName })}
        </Heading>
        {tagline ? <p className="mt-6 text-xl sm:text-2xl">{tagline}</p> : null}
        {!isAuthenticated && (
          <Link
            href="/signup"
            id="cta-signup"
            className="btn-primary mt-10 rounded-full px-6 py-3 text-xl sm:px-8 sm:py-4 sm:text-2xl"
            onClick={() =>
              event('click', { category: 'HomePage', label: 'Signup' })
            }
          >
            {t('home_cta_button')}
          </Link>
        )}
      </main>
    </>
  );
};

const Index = ({ generalConfig, page, error }: Props) => {
  if (!page || !page.sections?.length) {
    return <WelcomeHome generalConfig={generalConfig} />;
  }
  return <CustomPageView page={page} error={error} />;
};

Index.getInitialProps = async (): Promise<Props> => {
  const generalConfig =
    (getCachedConfig('general') as unknown as GeneralConfig) ?? null;
  try {
    const page = await resolveStandardOrDbPage(HOME_PAGE_SLUG);
    return { generalConfig, page };
  } catch (err: unknown) {
    return { generalConfig, page: null, error: parseMessageFromError(err) };
  }
};

export default Index;
