import Link from 'next/link';

import { FC } from 'react';

import { Lesson } from '../../types/lesson';
import { cdn } from '../../utils/api';
import { Card, Heading } from '../ui';
import IconPlay from '../ui/IconPlay';

const MAX_SUMMARY_CHARS = 150;

interface Props {
  lesson: Lesson;
  className?: string;
}

const LessonCard: FC<Props> = ({ lesson, className }) => {
  const { photo, summary, title, slug } = lesson || {};
  const summaryTruncated = `${summary?.substring(0, MAX_SUMMARY_CHARS)}${
    summary?.length > MAX_SUMMARY_CHARS ? '...' : ''
  }`;

  const linkHref = `/learn/${slug}`;

  return (
    <div className="w-full sm:w-[calc(50%-10px)]">
      <Card
        className={`h-full gap-0 shadow-lg p-0 overflow-hidden justify-start ${
          className ? className : ''
        }`}
      >
        <div className="h-[200px]">
          <Link href={linkHref}>
            {photo ? (
              <div className="relative group object-cover h-full w-full">
                <img
                  className="object-cover h-full w-full"
                  src={`${cdn}${photo}-place-lg.jpg`}
                  alt={title}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconPlay className="w-12 h-12" />
                </div>
              </div>
            ) : (
              ''
            )}
          </Link>
        </div>
        <div className="pt-3 pb-6 pr-4 pl-4 flex flex-col gap-2">
          <Link href={linkHref} className="hover:text-accent">
            <Heading level={3}>{title}</Heading>
          </Link>
          <p className="text-sm">{summaryTruncated}</p>
        </div>
      </Card>
    </div>
  );
};

export default LessonCard;
