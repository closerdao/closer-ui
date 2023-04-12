import React from 'react';

import Spinner from '../Spinner';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (() => void) | (() => Promise<void>);
  infoText?: string | React.ReactNode;
  className?: string;
  type?: 'primary' | 'secondary';
  isEnabled?: boolean;
  isLoading?: boolean;
}

const Button = ({
  children,
  onClick,
  infoText,
  className,
  type = 'primary',
  isEnabled = true,
  isLoading,
}: ButtonProps) => {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={!isEnabled}
        className={` 
        border-2 flex justify-center w-full text-lg rounded-full uppercase tracking-wide p-2  
        ${
          type === 'primary' && isEnabled
            ? 'bg-primary text-white border-transparent'
            : ''
        }
        ${type === 'secondary' ? 'bg-white  text-primary border-primary ' : ''}
        ${!isEnabled ? 'bg-neutral border-2 text-light border-light' : ''}
        ${className || ''}
        `}
      >
        <div className='mt-[7px] mr-1.5'>{isLoading && <Spinner />}</div>
        {children}
      </button>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </div>
  );
};

export default Button;
