import React from 'react';

import Heading from '../Heading';

interface HeadingRowProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

const HeadingRow = ({ children, className, level = 2 }: HeadingRowProps) => {
  const sizeClass =
    level === 2 ? 'text-lg md:text-2xl' : level === 3 ? 'text-base md:text-xl' : '';
  return (
    <div className="border-solid border-b pb-2 border-neutral-200 mb-4">
      <Heading
        className={`${sizeClass} ${className} flex justify-start items-center`}
        level={level}
      >
        {children}
      </Heading>
    </div>
  );
};

export default HeadingRow;
