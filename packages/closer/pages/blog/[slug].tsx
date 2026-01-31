import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import {
  FacebookShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from 'react-share';

import FeatureNotEnabled from '../../components/FeatureNotEnabled';
import RelatedArticles from '../../components/RelatedArticles';
import { LinkButton } from '../../components/ui';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { Article, ArticleWithAuthorInfo, Author } from '../../types/blog';
import api, { cdn, formatSearch } from '../../utils/api';
import { estimateReadingTime } from '../../utils/blog.utils';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface BlogConfig {
  enabled: boolean;
}

interface Props {
  article: Article;
  error?: string;
  author: Author;
  relatedArticles: ArticleWithAuthorInfo[];
  blogConfig: BlogConfig | null;
}

const ArticlePage = ({ article, author, error, relatedArticles, blogConfig }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isAdmin = user && user?.roles.includes('admin');
  const isContentCreator = user && user?.roles.includes('content-creator');

  const isBlogEnabled = blogConfig?.enabled !== false;

  const fullImageUrl =
    article &&
    article.photo &&
    (!article.photo.startsWith('http')
      ? `${cdn}${article.photo}-max-lg.jpg`
      : article.photo);

  if (!isBlogEnabled) {
    return <FeatureNotEnabled feature="blog" />;
  }

  if (!article) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{article.title}</title>
        {article.summary ? (
          <meta name="description" content={article.summary} />
        ) : (
          <meta name="description" content={`Read ${article.title} on ${process.env.NEXT_PUBLIC_PLATFORM_URL || 'Closer'}.`} />
        )}
        <meta name="keywords" content={`${article.category || ''}, ${article.tags?.join(', ') || ''}, regenerative communities`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:type" content="article" />
        {article.summary ? (
          <meta property="og:description" content={article.summary} />
        ) : (
          <meta property="og:description" content={`Read ${article.title} on ${process.env.NEXT_PUBLIC_PLATFORM_URL || 'Closer'}.`} />
        )}
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/blog/${article.slug}`} />
        {fullImageUrl && (
          <meta key="og:image" property="og:image" content={fullImageUrl} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        {article.summary && (
          <meta name="twitter:description" content={article.summary} />
        )}
        {fullImageUrl && (
          <meta
            key="twitter:image"
            name="twitter:image"
            content={fullImageUrl}
          />
        )}
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/blog/${article.slug}`} />
        {article.category && (
          <meta property="article:section" content={article.category} />
        )}
        {article.tags && article.tags.length > 0 && (
          article.tags.map((tag: string) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))
        )}
      </Head>
      <main className="w-full flex flex-col items-center overflow-x-hidden">
        <article className="w-full">
          <header className="w-full max-w-3xl mx-auto px-4 pt-8 pb-12">
            <div className="flex items-center justify-between mb-8">
              <Link 
                href="/blog" 
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
              >
                <span>←</span>
                <span>{t('blog_title')}</span>
              </Link>
              {(user?._id === article?.createdBy || isAdmin || isContentCreator) && (
                <Link 
                  href={`/blog/edit/${article.slug}`} 
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {t('blog_edit_article')}
                </Link>
              )}
            </div>

            {article.category && (
              <p className="text-sm font-medium text-accent uppercase tracking-widest mb-4">
                {article.category}
              </p>
            )}

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-8">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
              {author && (
                <>
                  <Link href={author?._id ? `/members/${author._id}` : '#'}>
                    {author?.photo ? (
                      <Image
                        className="rounded-full"
                        src={`${cdn}${author.photo}-profile-sm.jpg`}
                        alt={author.screenname || ''}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <FaUser className="text-gray-400 w-6 h-6" />
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-col">
                    <Link
                      className="font-medium text-gray-900 hover:text-accent transition-colors"
                      href={author?._id ? `/members/${author?._id}` : '#'}
                    >
                      {author.screenname}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {dayjs(article?.updated).format('MMMM D, YYYY')} · {estimateReadingTime(article?.html)} {t('blog_min_read')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </header>

          {article?.photo && (
            <figure className="w-full max-w-5xl mx-auto px-4 mb-12">
              <div className="aspect-[2/1] w-full rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  className="object-cover w-full h-full"
                  src={fullImageUrl || ''}
                  alt={article?.title || ''}
                  width={1200}
                  height={600}
                  priority
                />
              </div>
            </figure>
          )}

          <div className="w-full max-w-3xl mx-auto px-4 pb-16">
            <div
              className="article-content prose prose-lg md:prose-xl max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900
                prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600
                prose-img:rounded-xl prose-img:my-8
                prose-li:text-gray-700
                first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-gray-900"
              dangerouslySetInnerHTML={{ __html: article?.html || '' }}
            />

            {article.tags && article.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-12 pt-8 border-t border-gray-100">
                {article.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    as={`/blog/search/${tag}`}
                    href="/blog/search/[keyword]"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex justify-center gap-4 mt-12 pt-8 border-t border-gray-100">
              <FacebookShareButton url={process.env.NEXT_PUBLIC_PLATFORM_URL + '/blog/' + article?.slug}>
                <div className="w-11 h-11 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center transition-all duration-200">
                  <svg className="w-5 h-5 text-gray-600 hover:text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
              </FacebookShareButton>
              <TwitterShareButton title={article?.title} url={process.env.NEXT_PUBLIC_PLATFORM_URL + '/blog/' + article?.slug} related={['@tdfinyourdreams']}>
                <div className="w-11 h-11 rounded-full border border-gray-200 hover:border-gray-800 hover:bg-gray-100 flex items-center justify-center transition-all duration-200">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              </TwitterShareButton>
              <WhatsappShareButton title={article?.title} url={process.env.NEXT_PUBLIC_PLATFORM_URL + '/blog/' + article?.slug}>
                <div className="w-11 h-11 rounded-full border border-gray-200 hover:border-green-400 hover:bg-green-50 flex items-center justify-center transition-all duration-200">
                  <svg className="w-5 h-5 text-gray-600 hover:text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
              </WhatsappShareButton>
              <TelegramShareButton title={article?.title} url={process.env.NEXT_PUBLIC_PLATFORM_URL + '/blog/' + article?.slug}>
                <div className="w-11 h-11 rounded-full border border-gray-200 hover:border-sky-400 hover:bg-sky-50 flex items-center justify-center transition-all duration-200">
                  <svg className="w-5 h-5 text-gray-600 hover:text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
              </TelegramShareButton>
              <LinkedinShareButton title={article?.title} url={process.env.NEXT_PUBLIC_PLATFORM_URL + '/blog/' + article?.slug}>
                <div className="w-11 h-11 rounded-full border border-gray-200 hover:border-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all duration-200">
                  <svg className="w-5 h-5 text-gray-600 hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
              </LinkedinShareButton>
            </div>

            {author && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                  <Link href={author?._id ? `/members/${author._id}` : '#'} className="flex-shrink-0">
                    {author?.photo ? (
                      <Image
                        className="rounded-full"
                        src={`${cdn}${author.photo}-profile-sm.jpg`}
                        alt={author.screenname || ''}
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUser className="text-gray-400 w-8 h-8" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{t('blog_written_by')}</p>
                    <Link
                      className="text-lg font-semibold text-gray-900 hover:text-accent transition-colors"
                      href={author?._id ? `/members/${author?._id}` : '#'}
                    >
                      {author.screenname}
                    </Link>
                    {author.about && (
                      <p className="text-gray-600 mt-2 leading-relaxed">{author.about}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>

        <section className="w-full bg-gray-50 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">{t('blog_continue_reading')}</p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('blog_what_to_read_next')}
                </h2>
              </div>
              {(isAdmin || isContentCreator) && (
                <LinkButton
                  size="small"
                  href="/blog/create"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  {t('blog_write_article')}
                </LinkButton>
              )}
            </div>

            <RelatedArticles relatedArticles={relatedArticles} />
          </div>
        </section>
      </main>
    </>
  );
};

ArticlePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const { query, req } = context;
    const slug = req?.url?.replace('/blog/', '') || query?.slug;

    const [articleRes, blogRes, messages] = await Promise.all([
      api.get(`/article/${slug}`).catch(() => {
        return null;
      }),
      api.get('/config/blog').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const article = articleRes?.data?.results;
    const blogConfig = blogRes?.data?.results?.value;
    const authorId = article?.createdBy;

    const [relatedArticlesRes, authorRes] = await Promise.all([
      api
        .post('/articles/related', {
          id: article._id,
          category: article.category,
          tags: article.tags,
        })
        .catch(() => {
          return null;
        }),
      api
        .get(`/user?where=${formatSearch({ _id: { $eq: authorId } })}`)
        .catch(() => {
          return null;
        }),
    ]);

    const relatedArticles = relatedArticlesRes?.data?.results || [];

    return {
      article,
      author: authorRes?.data?.results[0] || null,
      relatedArticles,
      blogConfig,
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      blogConfig: null,
      messages: null,
    };
  }
};

export default ArticlePage;
