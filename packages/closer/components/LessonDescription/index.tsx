import React, { FC, useEffect, useState } from 'react';

import { Lesson } from '../../types/lesson';

interface Props {
  lesson: Lesson;
  isVolunteer?: boolean;
}

const LessonDescription: FC<Props> = ({ lesson }) => {
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);

  // This useEffect is needed to fix next js hydration issue
  useEffect(() => {
    setInitialRenderComplete(true);
  }, []);

  return (
    <section className="mb-6 flex flex-col gap-6">
      {initialRenderComplete && (
        <p
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: lesson.description }}
        />
      )}
    </section>
  );
};

export default LessonDescription;
