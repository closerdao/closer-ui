import React from 'react';

interface BackButtonProps {
  children: React.ReactNode;
  clickHandler: () => void;
}

const BackButton = ({ children, clickHandler }: BackButtonProps) => {
  return <button onClick={clickHandler} className="py-4">{children}</button>;
};

export default BackButton;
