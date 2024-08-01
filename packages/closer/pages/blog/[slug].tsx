import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  FacebookIcon,
  FacebookShareButton,
  TwitterShareButton,
  XIcon,
} from 'react-share';

import RelatedArticles from '../../components/RelatedArticles';
import { Button, Card, LinkButton } from '../../components/ui';
import Heading from '../../components/ui/Heading';

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

interface Props {
  article: Article;
  error?: string;
  author: Author;
  relatedArticles: ArticleWithAuthorInfo[];
}

const ArticlePage = ({ article, author, error, relatedArticles }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');
  const isModerator = user?.roles.includes('moderator');

  const fullImageUrl =
    article &&
    article.photo &&
    (!article.photo.startsWith('http')
      ? `${cdn}${article.photo}-max-lg.jpg`
      : article.photo);

  const handleDeleteArticle = async () => {
    try {
      await api.delete(`/article/${article?._id}`);
      router.push('/blog');
    } catch (err) {
      console.log(parseMessageFromError(err));
    }
  };

  if (!article) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{article.title}</title>
        {article.summary && (
          <meta name="description" content={article.summary} />
        )}
        <meta property="og:title" content={article.title} />
        <meta property="og:type" content="article" />
        {article.summary && (
          <meta property="og:description" content={article.summary} />
        )}
        {fullImageUrl && (
          <meta key="og:image" property="og:image" content={fullImageUrl} />
        )}
        {fullImageUrl && (
          <meta
            key="twitter:image"
            name="twitter:image"
            content={fullImageUrl}
          />
        )}
      </Head>
      <main className="w-full flex flex-col items-center gap-12">
        <section className="flex flex-col items-center  mb-6 max-w-[600px] gap-12">
          <div>
            <Link href="/blog">◀️ {t('blog_title')}</Link>
          </div>

          <div className="w-full ">
            {article.category && (
              <Heading
                level={2}
                className="text-md uppercase mb-4  text-center"
              >
                {article.category}
              </Heading>
            )}

            <Heading level={1} className="text-4xl text-center">
              {article.title}
            </Heading>
          </div>
          {(user?._id === article?.createdBy || isAdmin || isModerator) && (
            <div className="flex gap-2">
              <Link href={`/blog/edit/${article.slug}`} className="btn-primary">
                Edit
              </Link>

              <Button
                isFullWidth={false}
                size="small"
                onClick={handleDeleteArticle}
                className="btn-primary"
              >
                Delete
              </Button>
            </div>
          )}
        </section>

        {article?.photo && (
          <section className="pl-8 pr-4 flex flex-col items-center gap-10 -ml-4 w-[calc(100vw+16px)] pb-12 max-w-5xl">
            <div className="h-[280px] sm:h-[400px] md:h-[600px] w-full">
              <Image
                className="object-cover h-full w-full "
                src={fullImageUrl || ''}
                alt={article?.title || ''}
                width={400}
                height={300}
              />
            </div>
          </section>
        )}

        <section className="flex flex-col items-center  mb-6 max-w-[600px] gap-20 pb-20">
          <div className="flex flex-col gap-10 ">
            {author && (
              <div className="flex justify-between items-center  w-full">
                <div className="flex gap-4 items-center">
                  <Link href={author?._id ? `/members/${author._id}` : '#'}>
                    {author?.photo ? (
                      <Image
                        className="rounded-full min-w-[50px] min-h-[50px]"
                        src={`${cdn}${author.photo}-profile-sm.jpg`}
                        alt={author.screenname || ''}
                        width={50}
                        height={50}
                      />
                    ) : (
                      <div className="rounded-full overflow-hidden">
                        <FaUser className="text-neutral w-[50px] h-[50px] " />
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-col text-left">
                    <p>
                      <Link
                        className="text-accent font-normal text-lg no-underline normal-case"
                        href={author?._id ? `/members/${author?._id}` : '#'}
                      >
                        {author.screenname}
                      </Link>
                    </p>
                    <p className="font-normal normal-case">
                      {dayjs(article?.updated).format('MMMM DD, YYYY')} &middot;{' '}
                      {estimateReadingTime(article?.html)} {t('blog_min_read')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div
              className="rich-text article limit-width padding-right"
              dangerouslySetInnerHTML={{ __html: article?.html || '' }}
            />
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className=" w-full flex gap-2 items-center flex-wrap">
              <Heading level={3} className="text-md font-normal">
                {t('blog_tags')}
              </Heading>
              {article.tags.map((tag: string) => (
                <Link
                  key={tag}
                  as={`/blog/search/${tag}`}
                  href="/blog/search/[keyword]"
                  className="rounded-full bg-accent-light px-3 py-1 text-accent"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <Card className="w-full flex flex-row items-center gap-3">
            <FacebookShareButton
              url={
                process.env.NEXT_PUBLIC_PLATFORM_URL + '/blog/' + article?.slug
              }
              className="flex gap-3 items-center w-1/2"
            >
              <FacebookIcon size={32} round={true} />
              {t('blog_share_on_facebook')}
            </FacebookShareButton>

            <TwitterShareButton
              title={article?.title}
              url={
                process.env.NEXT_PUBLIC_PLATFORM_URL + '/blog/' + article?.slug
              }
              related={['@tdfinyourdreams']}
              className="flex gap-3 items-center w-1/2"
            >
              <XIcon size={32} round={true} />
              {t('blog_share_on_x')}
            </TwitterShareButton>
          </Card>

          {author && (
            <div className="flex justify-between items-center  w-full">
              <div className="flex gap-4 ">
                <Link href={author?._id ? `/members/${author._id}` : '#'}>
                  {author?.photo ? (
                    <Image
                      className="rounded-full  min-w-[50px] min-h-[50px]"
                      src={`${cdn}${author.photo}-profile-sm.jpg`}
                      alt={author.screenname || ''}
                      width={50}
                      height={50}
                    />
                  ) : (
                    <div className="rounded-full overflow-hidden">
                      <FaUser className="text-neutral w-[50px] h-[50px] " />
                    </div>
                  )}
                </Link>

                <div className="flex flex-col text-left">
                  <p>
                    <Link
                      className="text-accent font-normal text-lg no-underline normal-case"
                      href={author?._id ? `/members/${author?._id}` : '#'}
                    >
                      {author.screenname}
                    </Link>
                  </p>
                  <p className="font-normal normal-case">{author.about}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="px-8 flex flex-col items-center gap-10 bg-gray-700 -ml-4 w-[calc(100vw+16px)] pb-12">
          <div className="max-w-[900px] py-20">
            <div className="flex flex-col gap-8 items-center">
              {(isAdmin || isModerator) && (
                <div className="mb-4">
                  <LinkButton
                    size="small"
                    href="/blog/create"
                    className="bg-white text-black border-0 w-[200px]"
                  >
                    {t('blog_write_article')}
                  </LinkButton>
                </div>
              )}
              <Heading level={3} className="text-white text-3xl">
                {t('blog_what_to_read_next')}
              </Heading>
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
    const slug =
      (req && req.url && req.url.replace('/blog/', '')) ||
      (query && query.slug);

    const [articleRes, messages] = await Promise.all([
      api.get(`/article/${slug}`).catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const article = articleRes?.data?.results;
    const authorId = article.createdBy;

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
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default ArticlePage;
