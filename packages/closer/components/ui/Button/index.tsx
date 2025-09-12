import React, { FormEvent } from 'react';

import { VariantProps, cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

import Spinner from '../Spinner';

// Blueprint for design system
// Button component has following props directly related to styling:
// - color
// - size (default=medium)
// - isEnabled (default=true)
// - isLoading
// - isFullWidth (default=true)
// - isInline
// type is legacy prop and should be replaced by new props. Before we remove type, we should add empty={true} to new buttons to override default styles

const buttonStyles = cva(
  // 'px-4 border-2 border-accent flex justify-center text-lg rounded-full uppercase tracking-wide ',
  'whitespace-nowrap px-4 border-2 flex justify-center items-center text-lg rounded-full uppercase tracking-wide hover:scale-105 duration-150 ',
  {
    variants: {
      color: {
        accent:
          'bg-accent border-accent text-white hover:enabled:bg-accent-dark hover:enabled:border-accent-dark', // default pink button
        'dominant-accent':
          'bg-dominant border-accent text-accent hover:enabled:bg-accent-light', //white with pink border
        // 'dominant-complimentary': 'bg-dominant text-complimentary border-complimentary hover:bg-neutral', //white with black text
        // 'complimentary': 'bg-complimentary text-white hover:bg-complimentary-light', // black with white text
      },
      size: {
        small: 'text-sm min-h-[32px]',
        medium: 'text-md min-h-[44px]',
        large: 'text-xl min-h-[48px]',
      },
      isFullWidth: {
        true: 'w-full',
        // temporary override until we update all buttons:
        false: '!w-auto',
      },
      variant: {
        primary: 'w-full py-2 bg-accent border-accent text-white',
        secondary: 'w-full enabled:bg-white border-accent text-accent py-2 ',
        instantSave:
          'w-auto absolute right-2 top-[45px] text-md pl-4 pr-5 py-0.5 bg-accent text-white',
        inline:
          '!w-auto !inline border-accent text-md pl-4 pr-5 py-1.5 bg-accent text-white',
        empty: '', // remove empty prop after all buttons are refactored
        default: 'py-2 h-12 ',
      }, //deprecate type, because it does not relate directly to design system

      isEnabled: {
        true: '',
        false: 'bg-neutral border-disabled !text-disabled',
      },
    },

    defaultVariants: {
      variant: 'primary',
      isEnabled: true,
      isFullWidth: true,
      // color: 'accent',
      size: 'medium',
    },
  },
);

interface ButtonProps extends VariantProps<typeof buttonStyles> {
  children: React.ReactNode;
  onClick?: (() => void) | (() => Promise<void>) | ((event: FormEvent) => void);
  infoText?: string | React.ReactNode;
  className?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'instantSave' | 'inline';
  isEnabled?: boolean;
  isLoading?: boolean;
  size?: 'small' | 'medium' | 'large';
  dataTestid?: string;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({
  children,
  onClick,
  infoText,
  className,
  variant = 'primary',
  title,
  isEnabled = true,
  isLoading,
  color,
  isFullWidth,
  size,
  dataTestid,
  type,
}: ButtonProps) => {
  return (
    <>
      <button
        {...(dataTestid && { 'data-testid': dataTestid })}
        onClick={onClick}
        disabled={!isEnabled || isLoading}
        title={title}
        type={type}
        className={` 
        ${twMerge(
          buttonStyles({ variant, color, isFullWidth, size, isEnabled }),
          className,
        )}
        `}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            {' '}
            <Spinner /> {children}
          </div>
        ) : (
          children
        )}
      </button>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </>
  );
};

export default Button;
