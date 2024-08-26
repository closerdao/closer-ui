import Image from 'next/image';
import Link from 'next/link';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { DEFAULT_BLOG_IMAGE_ID } from '../../constants';
import { ArticleWithAuthorInfo } from '../../types/blog';
import { cdn } from '../../utils/api';
import { estimateReadingTime, getCleanString } from '../../utils/blog.utils';
import { Heading, LinkButton } from '../ui';

interface Props {
  relatedArticles: ArticleWithAuthorInfo[];
}

const RelatedArticles = ({ relatedArticles }: Props) => {
  const t = useTranslations();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14 gap-y-[100px] pt-20 pb-0">
      {relatedArticles.map((article) => {
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
                      {estimateReadingTime(article?.html)} {t('blog_min_read')}
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
  );
};

export default RelatedArticles;
