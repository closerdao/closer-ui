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
    1: 'font-black text-3xl md:text-6xl uppercase',
    2: 'font-black text-3xl md:text-6xl uppercase',
    3: 'text-2xl md:text-4xl font-black uppercase',
    4: 'md:text-lg font-bold uppercase',
  } as Record<number, string>;

  return (
    <HeadingTag className={`${styleMap[level]} ${className}`}>
      {children}
    </HeadingTag>
  );
};

export default Heading;
