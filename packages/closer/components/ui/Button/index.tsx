import React from 'react';

import Spinner from '../Spinner';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  infoText?: string | React.ReactNode;
  className?: string;
  type?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

const Button = ({
  children,
  onClick,
  infoText,
  className,
  type = 'primary',
  disabled,
  loading,
}: ButtonProps) => {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={` 
        border-2 flex justify-center w-full text-lg rounded-full uppercase tracking-wide p-2 mt-[10px] 
        ${
          type === 'primary' &&
          !disabled &&
          'bg-accent text-white border-accent '
        }
        ${type === 'secondary' && 'bg-white  text-accent border-accent '}
        ${disabled && 'bg-neutral border-2 text-light border-light'}
        ${className}
        `}
      >
        {loading && <Spinner />}
        {children}
      </button>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </div>
  );
};

export default Button;
