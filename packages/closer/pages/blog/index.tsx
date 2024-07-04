import Head from 'next/head';
import Link from 'next/link';

import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api, { formatSearch } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

interface Props {
  articles: any[];
  generalConfig: GeneralConfig;
  error?: string;
}

const Search = ({ error, articles, generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Head>
        <title>{`${t('generic_search')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="main-content w-full max-w-6xl">
        <Heading className="mb-4">{PLATFORM_NAME} Blog</Heading>
        {isAuthenticated && (
          <div className="mb-4">
            <Link href="/blog/create" className="btn-primary">
              Write Article
            </Link>
          </div>
        )}
        <section className="grid md:grid-cols-2 gap-8">
          {error ? (
            <div className="validation-error">{error}</div>
          ) : articles ? (
            articles.map((article) => {
              return (
                <div className="card" key={article._id}>
                  <Link
                    as={`/blog/${article.slug}`}
                    href="/blog/[slug]"
                    role="button"
                  >
                    <h3 className="title">{article.title}</h3>
                    {article.summary && (
                      <p className="summary">{article.summary}</p>
                    )}
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="Loading">{t('generic_loading')}</div>
          )}
        </section>
      </main>
    </>
  );
};

Search.getInitialProps = async (context: NextPageContext) => {
  const search = formatSearch({ category: { $ne: 'home page' } });
  try {
    const [tags, articles, generalRes, messages] = await Promise.all([
      api.get('/distinct/article/tags?limit=20'),
      api.get(`/article?limit=100&sort_by=-created&where=${search}`),
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;

    return {
      tags: tags.data?.results.slice(0, 30),
      articles: articles.data?.results,
      generalConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      generalConfig: null,
      messages: null,
    };
  }
};

export default Search;
