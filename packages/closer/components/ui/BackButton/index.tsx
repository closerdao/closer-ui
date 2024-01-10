import React from 'react';

interface BackButtonProps {
  children: React.ReactNode;
  handleClick: () => void;
}

const BackButton = ({ children, handleClick }: BackButtonProps) => {
  return (
    <button onClick={handleClick} className="py-4">
      {children}
    </button>
  );
};

export default BackButton;
