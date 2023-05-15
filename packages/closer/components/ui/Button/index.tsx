import React from 'react';

import { VariantProps, cva } from 'class-variance-authority';

import Spinner from '../Spinner';

const buttonStyles = cva(
  'px-4 border-2 border-accent flex justify-center text-lg rounded-full uppercase tracking-wide ',
  {
    variants: {
      type: {
        primary: 'w-full py-2 bg-accent text-white hover:bg-white hover:text-accent',
        secondary: 'w-full bg-white text-accent py-2 hover:bg-accent hover:text-white ',
        instantSave:
          'w-auto absolute right-2 top-[45px] text-md pl-4 pr-5 py-0.5 bg-accent text-white',
        inline: ' text-md pl-4 pr-5 py-1.5 bg-accent text-white',
        default: 'py-2 h-12 ',
      },
      isEnabled: {
        true: '',
        false: 'bg-neutral border-disabled !text-disabled hover:bg-neutral',
      }
    },

    defaultVariants: {
      type: 'primary',
      isEnabled: true,
    },
  },
);

interface ButtonProps extends VariantProps<typeof buttonStyles> {
  children: React.ReactNode;
  onClick?: (() => void) | (() => Promise<void>);
  infoText?: string | React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const Button = ({
  children,
  onClick,
  infoText,
  className,
  type,
  isEnabled=true,
  isLoading,
}: ButtonProps) => {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={!isEnabled || isLoading}
        className={` 
         ${buttonStyles({ type, isEnabled })}
        ${className || ''}
        `}
      >
        {isLoading ?
          <Spinner />:
          children
        }
      </button>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </div>
  );
};

export default Button;
