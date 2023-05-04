import React from 'react';

import Spinner from '../Spinner';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (() => void) | (() => Promise<void>);
  infoText?: string | React.ReactNode;
  className?: string;
  type?: 'primary' | 'secondary' | 'instantSave' | 'inline';
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
        border-2 bg-accent border-accent  border-light flex justify-center text-lg rounded-full uppercase tracking-wide p-2  
        ${type === 'primary' ? 'w-full' : ''}
        ${
          type === 'secondary'
            ? 'w-full bg-white text-accent border-accent '
            : ''
        }
        ${type === 'inline' ? 'w-auto text-md pl-4 pr-5 py-1.5' : ''}
        ${
          type === 'instantSave'
            ? 'w-auto absolute right-2 top-[45px] text-md pl-4 pr-5 py-0.5'
            : ''
        }
        
        ${
          !isEnabled
            ? 'bg-neutral text-disabled-dark border-2 text-light border-disabled-dark'
            : 'text-white bg-accent'
        }
        ${className || ''}
        `}
      >
        <div className="mt-[7px] mr-1.5">{isLoading && <Spinner />}</div>
        {children}
      </button>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </div>
  );
};

export default Button;
