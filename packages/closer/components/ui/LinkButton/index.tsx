import Link from 'next/link';

import React from 'react';

import { VariantProps, cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const buttonStyles = cva(
  'whitespace-nowrap px-4 border-2 flex justify-center items-center text-lg rounded-full uppercase tracking-wide',
  {
    variants: {
      color: {
        accent:
          'bg-accent border-accent text-white hover:enabled:bg-accent-dark hover:enabled:border-accent-dark', // default pink button
        'dominant-accent':
          'bg-dominant border-accent text-accent hover:enabled:bg-accent-light', //white with pink border
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
        default: 'py-2 h-12',
      },

      isEnabled: {
        true: '',
        false: 'bg-neutral border-disabled !text-disabled',
      },
    },

    defaultVariants: {
      variant: 'primary',
      isEnabled: true,
      isFullWidth: true,
      size: 'medium',
    },
  },
);

interface ButtonProps extends VariantProps<typeof buttonStyles> {
  children: React.ReactNode;
  infoText?: string | React.ReactNode;
  className?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'instantSave' | 'inline';
  size?: 'small' | 'medium' | 'large';
  href?: string;
  onClick?: () => void;
  target?: string;
}

const LinkButton = ({
  href,
  children,
  infoText,
  className,
  variant = 'primary',
  isEnabled = true,
  color,
  isFullWidth,
  size,
  onClick,
  target,
}: ButtonProps) => {
  return (
    <>
      <Link
        href={href || ''}
        className={` 
        ${twMerge(
          buttonStyles({ variant, color, isFullWidth, size, isEnabled }),
          className,
          'font-accent'
        )}
        `}
        onClick={onClick}
        target={target}
        rel="noopener noreferrer"
      >
        {children}
      </Link>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </>
  );
};

export default LinkButton;
