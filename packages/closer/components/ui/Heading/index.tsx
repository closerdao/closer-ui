import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  display?: boolean;
  hasBorder?: boolean;
}

const Heading = ({ level = 1, children, className, display, hasBorder }: HeadingProps) => {
  const HeadingTag = ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) =>
    React.createElement(`h${level}`, props, children);

  const styleMap = {
    1: `text-3xl ${display?'uppercase md-6xl font-black':'font-bold'}`,
    2: `text-2xl ${display?'uppercase md-5xl font-black':'font-bold'}`,
    3: `text-xl ${display?'uppercase md-4xl font-black':'font-bold'}`,
    4: `text-lg ${display?'uppercase md-3xl font-bold':'font-bold'}`,
  } as Record<number, string>;

  return (
    <HeadingTag className={`${styleMap[level]} ${hasBorder ? 'border-b border-divider pb-2.5 leading-9 mt-12  mb-6' : ''} ${className}`}>
      {display?'YES':'NO'} {children}
    </HeadingTag>
  );
};

export default Heading;
