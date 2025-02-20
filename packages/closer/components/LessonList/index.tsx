import { useTranslations } from 'next-intl';

import { Lesson } from '../../types/lesson';
import IconLocked from '../ui/IconLocked';
import IconPlay from '../ui/IconPlay';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

interface LessonListProps {
  lesson: Lesson;
  currentLessonId: string;
  isVideoPreview: boolean;
  canViewLessons: boolean;
  onShowPreview: () => void;
  onShowFullVideo: () => void;
  onShowLesson: (lessonId: string) => void;
  isLegacyFullAccessLesson: boolean;
}

const LessonList = ({
  currentLessonId,
  lesson,
  isVideoPreview,
  canViewLessons,
  onShowPreview,
  onShowFullVideo,
  onShowLesson,
  isLegacyFullAccessLesson,
}: LessonListProps) => {
  const t = useTranslations();

  const doesHaveLessons =
    lesson.modules &&
    lesson.modules.some((module) => module.lessons.length > 0);

  if (!doesHaveLessons) return null;

  return (
    <section className="flex flex-col gap-2">
      {lesson.previewVideo ? (
        <button
          onClick={onShowPreview}
          disabled={isVideoPreview}
          className={`flex gap-2 py-1 px-2 rounded-md hover:bg-accent-light ${
            isVideoPreview
              ? 'bg-accent-light font-normal'
              : 'bg-transparent font-normal'
          }`}
        >
          <div className="border-accent border rounded-full flex justify-center items-center w-[21px] h-[21px]">
            <IconPlay />
          </div>
          <span className="font-normal text-sm">
            {t('learn_introduction_heading')}
          </span>
        </button>
      ) : null}

      {lesson.fullVideo ? (
        <button
          onClick={onShowFullVideo}
          disabled={!isVideoPreview}
          className={` flex gap-2 py-1 px-2 rounded-md ${
            !isVideoPreview
              ? 'bg-accent-light font-normal'
              : 'bg-transparent font-normal'
          }`}
        >
          {canViewLessons ? (
            <div className="border-accent border rounded-full flex justify-center items-center w-[21px] h-[21px]">
              <IconPlay />
            </div>
          ) : (
            <div className="flex justify-center items-center w-[21px] h-[21px]">
              <IconLocked />
            </div>
          )}
          <span className="font-normal text-sm">
            {t('learn_full_lesson_heading')}
          </span>
        </button>
      ) : null}

      {lesson?.modules?.length && lesson?.modules?.length > 0 && !isLegacyFullAccessLesson ? (
        <div className="font-normal ">
          <Accordion
            type="single"
            collapsible
            defaultValue="module-0"
            className="space-y-2"
          >
            {lesson.modules.map((module, index) => (
              <AccordionItem
                key={module.title}
                value={`module-${index}`}
                className="space-y-2"
              >
                <AccordionTrigger>
                  <p className="font-normal text-black">{module.title}</p>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2">
                    {module.lessons.map((lesson) => (
                      <button
                        key={lesson._id}
                        onClick={() => onShowLesson(lesson._id)}
                        className={`cursor-pointer font-normal flex gap-2 py-1 px-2 rounded-md hover:bg-accent-light transition-colors ${
                          currentLessonId === lesson._id
                            ? 'bg-accent-light'
                            : ''
                        }`}
                      >
                        {canViewLessons || lesson.isFree ? (
                          <div className="border-accent border rounded-full flex justify-center items-center w-[21px] h-[21px]">
                            <IconPlay />
                          </div>
                        ) : (
                          <div className="flex justify-center items-center w-[21px] h-[21px]">
                            <IconLocked />
                          </div>
                        )}
                        <span className="text-sm text-left">
                          {lesson?.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : null}
    </section>
  );
};

export default LessonList;
