import Head from 'next/head';

import { NextPageContext } from 'next';

import CustomSectionComponent from '../components/custom-pages/CustomSectionComponent';

import type { PageDoc, PageSection } from '../types/page';
import api, { formatSearch } from '../utils/api';
import { parseMessageFromError } from '../utils/common';
import PageNotFound from './not-found';

interface Props {
  page: PageDoc | null;
  error?: string;
}

const RESERVED_SLUGS = new Set([
  '_next',
  'api',
  'static',
  'images',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

const CustomPagePage = ({ page, error }: Props) => {
  if (!page) {
    return <PageNotFound error={error} />;
  }

  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || '';
  const normalizedSlug = page.slug?.startsWith('/')
    ? page.slug
    : `/${page.slug ?? ''}`;
  const canonical = `${platformUrl}${normalizedSlug}`;
  const description = page.description ?? '';
  const ogImage = page.ogImage ?? '';
  const sections = page.sections ?? [];

  return (
    <>
      <Head>
        <title>{page.title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <meta property="og:title" content={page.title} />
        <meta property="og:type" content="website" />
        {description ? (
          <meta property="og:description" content={description} />
        ) : null}
        {ogImage ? (
          <meta key="og:image" property="og:image" content={ogImage} />
        ) : null}
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        {description ? (
          <meta name="twitter:description" content={description} />
        ) : null}
        {ogImage ? (
          <meta key="twitter:image" name="twitter:image" content={ogImage} />
        ) : null}
        <link rel="canonical" href={canonical} />
      </Head>
      <main className="w-full">
        {sections.map((section: PageSection, index: number) => (
          <CustomSectionComponent
            key={section._id ?? section._localId ?? `${section.type}-${index}`}
            type={section.type}
            data={section.data}
          />
        ))}
      </main>
    </>
  );
};

CustomPagePage.getInitialProps = async (context: NextPageContext) => {
  const { query, res } = context;
  const rawSlug = Array.isArray(query.slug) ? query.slug[0] : query.slug;

  if (!rawSlug || RESERVED_SLUGS.has(String(rawSlug))) {
    if (res) res.statusCode = 404;
    return { page: null };
  }

  const normalized = String(rawSlug).replace(/^\/+/, '').trim();
  if (!normalized) {
    if (res) res.statusCode = 404;
    return { page: null };
  }

  const slug = `/${normalized}`;

  try {
    const apiRes = await api.get('/page', {
      params: {
        where: formatSearch({ slug }),
        limit: 1,
      },
    });
    const results = apiRes?.data?.results;
    const page =
      Array.isArray(results) && results[0]
        ? (results[0] as PageDoc)
        : null;

    if (!page && res) res.statusCode = 404;

    return { page };
  } catch (err: unknown) {
    if (res) res.statusCode = 404;
    return { page: null, error: parseMessageFromError(err) };
  }
};

export default CustomPagePage;
