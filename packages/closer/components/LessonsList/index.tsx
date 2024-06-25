import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { useTranslations } from 'next-intl';

import LessonCard from '../LessonCard';

dayjs.extend(advancedFormat);

interface Props {
  lessons: any;
}

const LessonsList = ({ lessons }: Props) => {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-12">
      {lessons ? (
        <div className="flex flex-col sm:flex-row gap-[20px] flex-wrap items-stretch">
          {lessons.map((lesson: any) => (
            <LessonCard key={lesson.get('_id')} lesson={lesson.toJSON()} />
          ))}
        </div>
      ) : (
        <div className="w-full h-full text-center p-12">
          <p className="italic">{t('learn_no_lessons_found')}</p>
        </div>
      )}
    </div>
  );
};

export default LessonsList;
