import React from 'react';

import Heading from '../Heading';

interface HeadingRowProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

const HeadingRow = ({ children, className, level }: HeadingRowProps) => {
  return (
    <div className="border-solid border-b pb-2 border-neutral-200 mb-4">
      <Heading
        className={`${className} flex justify-start items-center`}
        level={level}
      >
        {children}
      </Heading>
    </div>
  );
};

HeadingRow.defaultProps = {
  className: '',
  level: 2,
};

export default HeadingRow;
