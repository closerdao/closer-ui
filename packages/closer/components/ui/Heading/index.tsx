import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

const Heading = ({ level, children, className }: HeadingProps) => {
  const HeadingTag = ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) =>
    React.createElement(`h${level}`, props, children);

  return (
    <HeadingTag
      className={`mb-[24px] w-full ${
        level === 2 && 'border-b border-divider pb-[10px] mb-[30px]'
      }   ${className}`}
    >
      {children}
    </HeadingTag>
  );
};

export default Heading;
