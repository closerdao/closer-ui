import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={`${twMerge('rounded-md shadow-xl p-4 flex flex-col justify-between gap-4', className || '')}`}
    >
      {children}
    </div>
  );
};

export default Card;
