import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { LinkButton } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { DEFAULT_BLOG_IMAGE_ID } from '../../../constants';
import { Article, Author } from '../../../types/blog';
import api, { cdn, formatSearch } from '../../../utils/api';
import { estimateReadingTime, getCleanString } from '../../../utils/blog.utils';
import { parseMessageFromError } from '../../../utils/common';
import { capitalizeFirstLetter } from '../../../utils/learn.helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  articles: any[];
  error?: string;
  keyword: string;
  tags: string[];
  authors: Author[];
}

const Search = ({ articles, error, keyword, tags, authors }: Props) => {
  const t = useTranslations();

  const articlesWithAuthorInfo = articles.map((article) => {
    const author = authors.find((author) => author._id === article.createdBy);
    return {
      ...article,
      authorInfo: {
        screenname: author?.screenname,
        photo: author?.photo,
        _id: author?._id,
      },
    };
  });

  return (
    <>
      <Head>
        <title>{keyword}</title>
      </Head>
      <main className="w-full flex flex-col items-center gap-6">
        <section className="flex w-full items-center max-w-[900px] ">
          <div>
            <Link href="/blog" className="uppercase text-accent font-bold">
              ◀️ {t('blog_title')}
            </Link>
          </div>
        </section>

        <section className="px-8 flex flex-col items-center gap-10 bg-complimentary-light -ml-4 w-[calc(100vw+16px)] pb-12">
          <div className="max-w-[900px] py-20">
            <div className="flex flex-col gap-3 items-center">
              <Heading level={3} className="text-white text-3xl">
                {capitalizeFirstLetter(decodeURIComponent(keyword)) || 'Search'}
              </Heading>
              <p className=" text-white">
                {t('blog_found')} {articles.length} {t('blog_article')}
                {articles.length !== 1 && 's'} {t('blog_about')}{' '}
                <i>{keyword}</i>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14 gap-y-[100px] pt-20 pb-0">
              {articlesWithAuthorInfo.map((article) => {
                const imageUrl =
                  article.photo && !article.photo.startsWith('http')
                    ? `${cdn}${article?.photo}-post-md.jpg`
                    : article.photo;
                return (
                  <div key={article.slug} className="flex flex-col gap-4">
                    <Link
                      className="text-white uppercase no-underline tracking-wide hover:text-accent"
                      href={`/blog/${article.slug}`}
                    >
                      <div className="h-[140px] w-full rounded-md overflow-hidden shadow-md">
                        {imageUrl ? (
                          <Image
                            className="object-cover h-full w-full "
                            src={imageUrl || ''}
                            alt={article?.title}
                            width={200}
                            height={140}
                          />
                        ) : (
                          <div className="bg-accent-alt w-full h-full">
                            <Image
                              className="object-cover h-full w-full "
                              src={`${cdn}${DEFAULT_BLOG_IMAGE_ID}-max-lg.jpg`}
                              alt={article?.title}
                              width={400}
                              height={300}
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex flex-col gap-6 justify-between h-full ">
                      <Heading level={3} className=" text-md">
                        <Link
                          className="text-white uppercase no-underline tracking-wide hover:text-accent"
                          href={`/blog/${article.slug}`}
                        >
                          {article?.title}
                        </Link>
                      </Heading>

                      <p
                        className="text-transparent bg-clip-text"
                        style={{
                          backgroundImage:
                            'linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 1))',
                        }}
                      >
                        {getCleanString(article?.html).substring(0, 160)}...
                      </p>

                      <div className="flex gap-2 items-center pt-6">
                        <div className="flex-grow flex gap-2">
                          <Link
                            className="text-accent font-normal text-lg no-underline normal-case"
                            href={
                              article?.authorInfo?._id
                                ? `/members/${article?.authorInfo?._id}`
                                : '#'
                            }
                          >
                            {article?.authorInfo?.photo ? (
                              <Image
                                className="rounded-full"
                                src={`${cdn}${article.authorInfo.photo}-profile-sm.jpg`}
                                alt={article?.authorInfo?.screenname || ''}
                                width={35}
                                height={35}
                              />
                            ) : (
                              <div className="rounded-full overflow-hidden">
                                <FaUser className="text-neutral w-[35px] h-[35px] " />
                              </div>
                            )}
                          </Link>
                          <div className="flex flex-col text-left text-white text-sm">
                            <p className="font-normal">
                              {dayjs(article?.updated).format('MMM DD, YYYY')}
                            </p>
                            <p>
                              {estimateReadingTime(article?.html)}{' '}
                              {t('blog_min_read')}
                            </p>
                          </div>
                        </div>
                        <LinkButton
                          size="small"
                          isFullWidth={false}
                          href={`/blog/${article.slug}`}
                          className="bg-white "
                          type="secondary"
                        >
                          {t('blog_read_more')}
                        </LinkButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-6 pb-20">
          <Heading level={2}>{t('search_keyword_related')}</Heading>
          <div className=" w-full flex gap-2 items-center flex-wrap">
            {tags ? (
              tags.map((tag) => (
                <Link
                  key={tag}
                  as={`/blog/search/${tag}`}
                  href="/blog/search/[keyword]"
                  className="rounded-full bg-accent-light px-3 py-1 text-accent no-underline"
                >
                  {tag}
                </Link>
              ))
            ) : (
              <span className="Loading">{t('generic_loading')}</span>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

Search.getInitialProps = async (context: NextPageContext) => {
  try {
    const { query, req } = context;
    const rawKeyword =
      (req && req.url && req.url.replace('/blog/search/', '')) ||
      (query && query.keyword);
    const keyword =
      typeof decodeURIComponent !== 'undefined'
        ? decodeURIComponent(rawKeyword as string)
        : rawKeyword;
    const search = formatSearch({ tags: { $elemMatch: { $eq: keyword } } });
    const [tags, articles, messages] = await Promise.all([
      api.get(`/distinct/article/tags?where=${search}`),
      api.get(`/article?where=${search}&limit=50`),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const authorIds = articles?.data?.results.map(
      (article: Article) => article.createdBy,
    );

    const authorsRes = await api.get(
      `/user?where=${formatSearch({ _id: { $in: authorIds } })}`,
    );

    const authors = authorsRes.data?.results;

    return {
      keyword,
      tags: tags?.data?.results,
      articles: articles?.data?.results,
      authors,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      messages: null,
    };
  }
};

export default Search;
