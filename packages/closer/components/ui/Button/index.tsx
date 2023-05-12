import React from 'react';

import { VariantProps, cva } from 'class-variance-authority';

import Spinner from '../Spinner';

const buttonStyles = cva(
  'px-4 border-2 border-accent flex justify-center text-lg rounded-full uppercase tracking-wide ',
  {
    variants: {
      type: {
        primary: 'h-12 w-full',
        secondary: 'w-full bg-white text-accent',
        instantSave:
          'w-auto h-9 absolute right-2 top-[45px] text-md pl-4 pr-5 py-0.5',
        inline: ' text-md pl-4 pr-5 py-1.5',
        default: 'py-2 h-12',
      },
      isEnabled: {
        true: 'text-white bg-accent bg-accent ',
        false: 'bg-neutral text-disabled text-light border-disabled',
      },
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
  isEnabled,
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
        <div className="mt-[7px] mr-1.5">{isLoading && <Spinner />}</div>
        {children}
      </button>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </div>
  );
};

export default Button;
