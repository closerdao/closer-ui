import Head from 'next/head';

import {
  CustomSections,
  getCachedConfig,
} from 'closer';
import type { GeneralConfig } from 'closer';
import type { Page } from 'closer/types/customPages';
import type { PageDoc } from 'closer/types/page';
import api, { formatSearch } from 'closer/utils/api';
import { parseMessageFromError } from 'closer/utils/common';

import { villageConfigDefaults } from '../config';
import { env } from '../env';

interface Props {
  generalConfig: GeneralConfig | null;
  page: PageDoc | null;
  error?: string;
}

const HOMEPAGE_SLUG = '/';

const toCustomSectionsPage = (page: PageDoc): Page => ({
  isHomePage: true,
  sections: page.sections ?? [],
});

const getVillageName = (generalConfig: GeneralConfig | null) =>
  generalConfig?.platformName ||
  generalConfig?.appName ||
  env.NEXT_PUBLIC_PLATFORM_NAME ||
  villageConfigDefaults.general.platformName;

const ComingSoon = ({
  generalConfig,
  error,
}: {
  generalConfig: GeneralConfig | null;
  error?: string;
}) => {
  const villageName = getVillageName(generalConfig);
  const contactEmail = generalConfig?.teamEmail;

  return (
    <>
      <Head>
        <title>{`${villageName} is coming soon`}</title>
        <meta
          name="description"
          content={`${villageName} is preparing its Closer village space.`}
        />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Coming soon
        </p>
        <h1 className="text-4xl font-semibold text-complimentary md:text-6xl">
          {villageName}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-complimentary-medium">
          This village is preparing its public home on Closer. Check back soon.
        </p>
        {contactEmail ? (
          <a
            className="mt-8 rounded-full bg-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
            href={`mailto:${contactEmail}`}
          >
            Contact the team
          </a>
        ) : null}
        {error ? (
          <p className="mt-8 max-w-xl text-sm text-complimentary-medium">
            Homepage content is not available yet.
          </p>
        ) : null}
      </main>
    </>
  );
};

const HomePage = ({ generalConfig, page, error }: Props) => {
  if (!page || !page.sections?.length) {
    return <ComingSoon generalConfig={generalConfig} error={error} />;
  }

  const villageName = getVillageName(generalConfig);
  const title = page.title || villageName;
  const description =
    page.description || `${villageName} is a village running on Closer.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={description} />
        {page.ogImage ? (
          <meta property="og:image" content={page.ogImage} />
        ) : null}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <CustomSections page={toCustomSectionsPage(page)} />
    </>
  );
};

HomePage.getInitialProps = async () => {
  const generalConfig = getCachedConfig('general');

  try {
    const apiRes = await api.get('/page', {
      params: {
        where: formatSearch({ slug: HOMEPAGE_SLUG }),
        limit: 1,
      },
    });
    const results = apiRes?.data?.results;
    const page =
      Array.isArray(results) && results[0]
        ? (results[0] as PageDoc)
        : null;

    return {
      generalConfig,
      page,
    };
  } catch (err: unknown) {
    return {
      generalConfig,
      page: null,
      error: parseMessageFromError(err),
    };
  }
};

export default HomePage;
