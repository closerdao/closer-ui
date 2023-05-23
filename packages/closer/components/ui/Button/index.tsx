import React from 'react';

import Spinner from '../Spinner';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (() => void) | (() => Promise<void>);
  infoText?: string | React.ReactNode;
  className?: string;
  title?: string;
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
  title,
  isEnabled = true,
  isLoading,
}: ButtonProps) => {
  return (
    <>
      <button
        onClick={onClick}
        disabled={!isEnabled || isLoading}
        title={title}
        // flex justify-center 
        className={` 
        border-2 bg-accent border-accent border-light text-lg rounded-full uppercase tracking-wide py-1 px-3  
        ${
          type === 'secondary'
            ? 'bg-white text-accent border-accent '
            : ''
        }
        ${type === 'inline' ? 'w-auto text-md pl-4 pr-5 py-1.5' : ''}
        ${
          type === 'instantSave'
            ? 'w-auto absolute right-2 top-[45px] text-md pl-4 pr-5 py-0.5'
            : ''
        }
        
        ${
          !isEnabled || isLoading
            ? 'bg-neutral text-disabled-dark border-2 text-light border-disabled-dark'
            : 'text-white bg-accent'
        }
        ${className || ''}
        `}
      >
        {isLoading ?
          <Spinner />:
          children
        }
      </button>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </>
  )
};

export default Button;