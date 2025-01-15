import { FC, useEffect, useState } from 'react';

interface Props {
  fullText: string | undefined;
}

const LessonDescription: FC<Props> = ({ fullText }) => {
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);

  // This useEffect is needed to fix next js hydration issue
  useEffect(() => {
    setInitialRenderComplete(true);
  }, []);

  return (
    <section className="mb-6 flex flex-col gap-6">
      {initialRenderComplete && fullText && (
        <p
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: fullText }}
        />
      )}
    </section>
  );
};

export default LessonDescription;
