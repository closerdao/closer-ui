import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

const Heading = ({ level = 1, children, className }: HeadingProps) => {
  const HeadingTag = ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) =>
    React.createElement(`h${level}`, props, children);

  const styleMap = {
    1: 'font-extrabold text-[32px]',
    2: 'border-b border-divider pb-2.5 text-2xl leading-9 font-bold',
    3: 'text-xl pb-2.5',
  } as Record<number, string>;

  return (
    <HeadingTag className={`w-full ${styleMap[level]} ${className}`}>
      {children}
    </HeadingTag>
  );
};

export default Heading;
