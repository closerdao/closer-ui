import { type VariantProps, cva } from 'class-variance-authority';
import type { ElementType, ReactNode } from 'react';

import { twMerge } from 'tailwind-merge';

export const bookingSurfaceVariants = cva('outline-none', {
  variants: {
    tone: {
      elevated:
        'rounded-3xl bg-neutral-light shadow-[0_26px_70px_-36px_rgba(15,23,42,0.28)]',
      inset:
        'rounded-2xl bg-white/95 shadow-[inset_0_2px_10px_rgba(15,23,42,0.05)] backdrop-blur-sm',
      soft: 'rounded-2xl bg-muted/50 backdrop-blur-md',
      promote:
        'rounded-3xl border-l-[6px] border-accent bg-accent-light/85 shadow-[0_22px_60px_-32px_rgba(236,72,153,0.18)]',
      banner: 'rounded-2xl bg-accent text-white shadow-lg shadow-accent/30',
      panelTransparent: 'rounded-2xl bg-white/75 shadow-sm backdrop-blur-sm',
    },
    padding: {
      none: '',
      sm: 'p-3 md:p-4',
      md: 'p-4 md:p-5',
      lg: 'p-5 md:p-8',
    },
  },
  defaultVariants: {
    tone: 'elevated',
    padding: 'md',
  },
});

export type BookingSurfaceProps = VariantProps<typeof bookingSurfaceVariants> & {
  as?: ElementType;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>;

export default function BookingSurface({
  as: Comp = 'section',
  tone,
  padding,
  className,
  children,
  ...rest
}: BookingSurfaceProps) {
  return (
    <Comp
      className={twMerge(bookingSurfaceVariants({ tone, padding }), className)}
      {...(rest as object)}
    >
      {children}
    </Comp>
  );
}

export function BookingSectionEyebrow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={twMerge(
        'text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  );
}

export function BookingSurfaceDivider({ className }: { className?: string }) {
  return <div className={twMerge('h-px w-full bg-foreground/[0.08]', className)} />;
}
