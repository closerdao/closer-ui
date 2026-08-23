import Head from 'next/head';

import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import CustomSectionComponent from '../components/custom-pages/CustomSectionComponent';
import type { PageDoc, PageSection } from '../types/page';
import { resolveBlockText } from '../utils/blockI18n';
import { parseMessageFromError } from '../utils/common';
import {
  localizePageForVisitor,
  resolveStandardOrDbPage,
} from '../utils/standardPages';
import PageNotFound from './not-found';

export interface Props {
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
  'legacy',
]);

export const loadCustomPageProps = async (
  context: NextPageContext,
  fixedSlug?: string,
): Promise<Props> => {
  const { query, res } = context;
  const rawSlug = fixedSlug
    ? String(fixedSlug).replace(/^\/+/, '').trim()
    : Array.isArray(query.slug)
      ? query.slug[0]
      : query.slug;

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
    const page = await resolveStandardOrDbPage(slug);
    if (!page && res) res.statusCode = 404;
    return { page };
  } catch (err: unknown) {
    if (res) res.statusCode = 404;
    return { page: null, error: parseMessageFromError(err) };
  }
};

export const CustomPageView = ({ page: rawPage, error }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  if (!rawPage) {
    return <PageNotFound error={error} />;
  }

  // Visitors always see the published copy, translated for their locale when
  // the page has been published with that locale.
  const page = localizePageForVisitor(
    rawPage,
    router?.locale,
    router?.defaultLocale,
  );

  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || '';
  const normalizedSlug = page.slug?.startsWith('/')
    ? page.slug
    : `/${page.slug ?? ''}`;
  const canonical = `${platformUrl}${normalizedSlug}`;
  const title = resolveBlockText(page.title ?? '', t);
  const description = resolveBlockText(page.description ?? '', t);
  const ogImage = page.ogImage ?? '';
  const sections = page.sections ?? [];

  return (
    <>
      <Head>
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        {description ? (
          <meta property="og:description" content={description} />
        ) : null}
        {ogImage ? (
          <meta key="og:image" property="og:image" content={ogImage} />
        ) : null}
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
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

export const createFixedSlugCustomPage = (slug: string) => {
  const FixedSlugCustomPage = ({ page, error }: Props) => (
    <CustomPageView page={page} error={error} />
  );

  FixedSlugCustomPage.getInitialProps = async (context: NextPageContext) =>
    loadCustomPageProps(context, slug);

  return FixedSlugCustomPage;
};
