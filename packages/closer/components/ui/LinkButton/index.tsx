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
        primary:
          'w-full py-2 px-4 bg-accent border-accent text-white text-center [&_span]:block [&_span]:max-w-full [&_span]:text-[length:var(--dynamic-font-size,inherit)]',
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
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  target?: string;
  rel?: string;
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
  rel,
}: ButtonProps) => {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // React.useEffect(() => {
  //   const adjustFontSize = () => {
  //     if (textRef.current && containerRef.current) {
  //       const container = containerRef.current;
  //       const text = textRef.current;
  //       const containerWidth = container.clientWidth - 22; // Account for px-2

  //       // Reset to default size first
  //       text.style.removeProperty('--dynamic-font-size');

  //       // Only adjust if text is actually overflowing
  //       if (text.scrollWidth > containerWidth) {
  //         const currentSize = parseFloat(
  //           window.getComputedStyle(text).fontSize,
  //         );
  //         let fontSize = currentSize;

  //         while (text.scrollWidth > containerWidth && fontSize > 8) {
  //           fontSize -= 0.5;
  //           text.style.setProperty('--dynamic-font-size', `${fontSize}px`);
  //         }
  //       }
  //     }
  //   };

  //   adjustFontSize();
  //   window.addEventListener('resize', adjustFontSize);
  //   return () => window.removeEventListener('resize', adjustFontSize);
  // }, [children]);

  return (
    <>
      <div ref={containerRef} className="relative">
        <Link
          href={href || ''}
          className={twMerge(
            buttonStyles({ variant, color, isFullWidth, size, isEnabled }),
            className,
          )}
          onClick={onClick}
          target={target}
          rel={rel}
        >
          <span ref={textRef}>{children}</span>
        </Link>
      </div>
      {infoText && <div className="text-sm text-center pt-2">{infoText}</div>}
    </>
  );
};

export default LinkButton;
