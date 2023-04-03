import React from 'react';

import Spinner from '../Spinner';

interface ButtonProps {
  children: React.ReactNode;
  clickHandler?: (() => void) | (() => Promise<void>);
  infoText?: string | React.ReactNode;
  className?: string;
  type?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

const Button = ({
  children,
  clickHandler,
  infoText,
  className,
  type = 'primary',
  disabled,
  loading,
}: ButtonProps) => {
  return (
    <div>
      <button
        onClick={clickHandler}
        disabled={disabled}
        className={` 
        border-2 border-primary flex justify-center w-full text-lg rounded-full uppercase tracking-wide p-2 mt-[10px] 
        ${type === 'primary' && !disabled && 'bg-primary text-white'}
        ${
          type === 'secondary' &&
          'bg-white  text-primary '
        }
        ${disabled && 'bg-white border-2 text-light border-light'}
        ${className}`}
      >
        {loading && <Spinner />}
        {children}
      </button>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </div>
  );
};

export default Button;
