import Image from 'next/image';
import Link from 'next/link';

import { User } from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { DEFAULT_BLOG_IMAGE_ID } from '../../constants';
import { ArticleWithAuthorInfo } from '../../types/blog';
import { cdn } from '../../utils/api';
import { estimateReadingTime, getCleanString } from '../../utils/blog.utils';

interface Props {
  relatedArticles: ArticleWithAuthorInfo[];
}

const RelatedArticles = ({ relatedArticles }: Props) => {
  const t = useTranslations();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {relatedArticles.map((article) => {
        const imageUrl =
          article.photo && !article.photo.startsWith('http')
            ? `${cdn}${article?.photo}-post-md.jpg`
            : article.photo;
        return (
          <article key={article.slug} className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <Link
              href={`/blog/${article.slug}`}
              className="block"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
                {imageUrl ? (
                  <Image
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    src={imageUrl || ''}
                    alt={article?.title}
                    width={400}
                    height={250}
                  />
                ) : (
                  <Image
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    src={`${cdn}${DEFAULT_BLOG_IMAGE_ID}-max-lg.jpg`}
                    alt={article?.title}
                    width={400}
                    height={250}
                  />
                )}
              </div>
            </Link>
            <div className="flex flex-col flex-1 p-5">
              <Link
                href={`/blog/${article.slug}`}
                className="block mb-3"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-accent transition-colors line-clamp-2">
                  {article?.title}
                </h3>
              </Link>

              <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                {getCleanString(article?.html).substring(0, 120)}...
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <Link
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
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="text-gray-400 w-4 h-4" />
                    </div>
                  )}
                </Link>
                <div className="flex-1 text-xs text-gray-500">
                  <p className="font-medium text-gray-700">
                    {article?.authorInfo?.screenname}
                  </p>
                  <p>
                    {dayjs(article?.updated).format('MMM D, YYYY')} · {estimateReadingTime(article?.html)} {t('blog_min_read')}
                  </p>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default RelatedArticles;
