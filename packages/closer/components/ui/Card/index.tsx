import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={`rounded-md shadow-xl p-4 flex flex-col justify-between gap-4 ${className || ''}`}
    >
      {children}
    </div>
  );
};

export default Card;
