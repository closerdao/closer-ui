import Head from 'next/head';
import Link from 'next/link';

import { useState } from 'react';

import LessonDescription from '../../../components/LessonDescription';
import LessonVideo from '../../../components/LessonVideo';
import Tag from '../../../components/Tag';
import { Card, ErrorMessage, LinkButton } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import IconLocked from '../../../components/ui/IconLocked';
import IconPlay from '../../../components/ui/IconPlay';

import { NextApiRequest } from 'next';
import { ParsedUrlQuery } from 'querystring';

import PageNotFound from '../../404';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import { Lesson } from '../../../types/lesson';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

interface Props {
  lesson: Lesson;
  lessonCreator: User;
  error?: string;
}

const LessonPage = ({ lesson, lessonCreator, error }: Props) => {
  const { user } = useAuth();

  const canViewLessons = Boolean(
    user && (user?.subscription?.plan || !lesson.paid),
  );

  const [isVideoPreview, setIsVideoPreview] = useState(
    Boolean(lesson.previewVideo),
  );
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const handleShowPreview = () => {
    setIsVideoPreview(true);
    setIsVideoLoading(true);
  };
  const handleShowFullVideo = () => {
    setIsVideoPreview(false);
    setIsVideoLoading(true);
  };

  if (!lesson) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{lesson.title}</title>
        <meta name="description" content={lesson.summary} />
        <meta property="og:type" content="lesson" />
      </Head>

      <div className="w-full flex items-center flex-col gap-4">
        <section className="w-full flex justify-center max-w-4xl flex-wrap">
          <Link
            href="/learn/category/all"
            className="hover:text-accent w-full my-4"
          >
            &lt; {__('learn_all_courses')}
          </Link>
          <div className="w-full relative">
            <LessonVideo
              videoUrl={
                isVideoPreview && lesson.previewVideo
                  ? lesson.previewVideo
                  : lesson.fullVideo
              }
              isUnlocked={canViewLessons || isVideoPreview}
              setIsVideoLoading={setIsVideoLoading}
              isVideoLoading={isVideoLoading}
            />

            {(user?._id === lesson.createdBy ||
              user?.roles.includes('admin')) && (
              <div className="absolute right-0 top-0 p-8 flex flex-col gap-4">
                <LinkButton
                  size="small"
                  href={lesson.slug && `/learn/${lesson.slug}/edit`}
                  className="bg-accent text-white rounded-full px-4 py-2 text-center uppercase text-sm"
                >
                  {__('learn_edit_lesson_hading')}
                </LinkButton>
              </div>
            )}
          </div>
        </section>

        <section className=" w-full flex justify-center">
          <div className="max-w-4xl w-full ">
            <div className="w-full py-2">
              <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex items-center text-sm uppercase font-bold gap-1">
                  <div>
                    {__('learn_lesson_category')}: {lesson.category}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className=" w-full flex justify-center min-h-[400px] ">
          <div className="max-w-4xl w-full">
            <div className="flex-col-reverse sm:flex-row static flex items-start justify-between gap-6 w-full">
              <div className="flex flex-col gap-10 w-full sm:w-2/3">
                <div>
                  <Heading level={1} className="md:text-4xl mt-2 font-bold">
                    {lesson.title}
                  </Heading>
                </div>

                {error && <ErrorMessage error={error} />}

                <div>
                  {lesson.description && <LessonDescription lesson={lesson} />}
                </div>
              </div>
              <div className="h-auto static sm:sticky bottom-0 left-0  sm:top-[100px] w-full sm:w-[250px]">
                <Card className="bg-white border border-gray-100 gap-6">
                  <Heading level={2}>{__('learn_lessons_heading')}</Heading>
                  <div className="flex flex-col">
                    {lesson.previewVideo && (
                      <button
                        onClick={handleShowPreview}
                        disabled={isVideoPreview}
                        className={`flex gap-2 py-1 px-2 rounded-md ${
                          isVideoPreview
                            ? 'bg-accent-light font-bold'
                            : 'bg-transparent font-normal'
                        }`}
                      >
                        <div className="border-accent border rounded-full flex justify-center items-center w-[21px] h-[21px]">
                          <IconPlay />
                        </div>
                        {__('learn_introduction_heading')}
                      </button>
                    )}

                    {lesson.fullVideo && (
                      <button
                        onClick={handleShowFullVideo}
                        disabled={!isVideoPreview}
                        className={`flex gap-2 py-1 px-2 rounded-md ${
                          !isVideoPreview
                            ? 'bg-accent-light font-bold'
                            : 'bg-transparent font-normal'
                        }`}
                      >
                        {canViewLessons ? (
                          <div className="border-accent border rounded-full flex justify-center items-center w-[21px] h-[21px]">
                            <IconPlay />
                          </div>
                        ) : (
                          <div className=" flex justify-center items-center w-[21px] h-[21px]">
                            <IconLocked />
                          </div>
                        )}
                        {__('learn_full_lesson_heading')}
                      </button>
                    )}
                  </div>

                  {!canViewLessons && lesson.fullVideo && (
                    <LinkButton href="/subscriptions">
                      {__('learn_get_access_button')}
                    </LinkButton>
                  )}

                  <Heading className="uppercase text-md" level={3}>
                    {__('learn_tags_heading')}
                  </Heading>

                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag: string) => {
                      return <Tag key={tag}>{tag}</Tag>;
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

LessonPage.getInitialProps = async ({
  req,
  query,
}: {
  req: NextApiRequest;
  query: ParsedUrlQuery;
}) => {
  try {
    const {
      data: { results: lesson },
    } = await api.get(`/lesson/${query.slug}`, {
      headers: req?.cookies?.access_token && {
        Authorization: `Bearer ${req?.cookies?.access_token}`,
      },
    });
    const lessonCreatorId = lesson.createdBy;
    const {
      data: { results: lessonCreator },
    } = await api.get(`/user/${lessonCreatorId}`, {
      headers: req?.cookies?.access_token && {
        Authorization: `Bearer ${req?.cookies?.access_token}`,
      },
    });

    return { lesson, lessonCreator };
  } catch (err: unknown) {
    return {
      error: parseMessageFromError(err),
      lesson: null,
      lessonCreator: null,
    };
  }
};

export default LessonPage;
