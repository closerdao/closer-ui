import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  clickHandler?: () => void;
}

const Button = ({ children, clickHandler }: ButtonProps) => {
  return (
    <button
      onClick={clickHandler}
      className="bg-primary text-white w-full rounded-full  uppercase tracking-wider p-2.5 mt-[10px]"
    >
      {children}
    </button>
  );
};

export default Button;
