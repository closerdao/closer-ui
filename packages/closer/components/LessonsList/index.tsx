import React from 'react';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

import { __ } from '../../utils/helpers';
import LessonCard from '../LessonCard';

dayjs.extend(advancedFormat);

interface Props {
  lessons: any;
}

const LessonsList = ({ lessons }: Props) => {
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
          <p className="italic">{__('learn_no_lessons_found')}</p>
        </div>
      )}
    </div>
  );
};

export default LessonsList;
