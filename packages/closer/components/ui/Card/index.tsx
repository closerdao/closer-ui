import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={`rounded-md shadow-[0_2px_8px_0px_rgba(0,0,0,0.15)] p-[16px] mb-[48px]  flex flex-col justify-between gap-4 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
