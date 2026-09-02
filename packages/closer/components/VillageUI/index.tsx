import Link from 'next/link';

import { FC, ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import {
  VillageOnboardingStatus,
  VillageVerificationBadge,
} from '../../types/village';
import { VillageAccessReason } from '../../utils/village.utils';

/**
 * Shared presentation layer for the Ambassador / Village surfaces.
 *
 * These pages are only mounted by apps/closer, so they follow the closer.earth
 * landing-page language rather than the generic per-app accent theme: Instrument
 * Serif display type, mint/forest greens, soft green-bordered cards. The palette
 * lives here (and not in a constants file) because Tailwind only scans
 * `pages/**` and `components/**` for class names.
 */
export const brand = {
  ink: 'text-foreground',
  muted: 'text-foreground/70',
  green: 'text-accent-text',
  greenDeep: 'text-accent-text',
  pageBg: 'bg-neutral-light',
  wash: 'bg-accent-light',
  washSoft: 'bg-accent-light/40',
  border: 'border-accent-medium',
  forest: 'bg-foreground',
  card: 'bg-background border border-accent-medium rounded-[22px]',
  cardSm: 'bg-background border border-accent-medium rounded-[18px]',
};

/** Solid mint CTA — matches the homepage "Launch your community" button. */
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-[15px] bg-accent text-accent-foreground shadow-[0_6px_20px_theme(colors.accent/35%)] hover:bg-accent-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none';

/** Outlined counterpart for the secondary action in a pair. */
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-[15px] bg-background border border-accent-medium text-accent-text hover:border-accent hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none';

/** Compact action used inside panels and list rows. */
export const btnSmall =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-[13.5px] bg-background border border-accent-medium text-accent-text hover:border-accent transition-colors disabled:opacity-50 disabled:pointer-events-none';

export const btnSmallPrimary =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-[13.5px] bg-accent text-accent-foreground hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:pointer-events-none';

/**
 * `new-input` opts out of the legacy underline treatment in css/forms.css,
 * which otherwise outranks these utilities on typed fields (email, number…).
 */
export const inputClass =
  'new-input w-full rounded-xl border border-neutral-dark bg-background px-4 py-3 text-[15px] text-foreground placeholder:text-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none transition-colors';

export const labelClass =
  'text-[13px] font-semibold text-foreground tracking-[0.01em]';

export const Eyebrow: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <span
    className={`block text-xs font-bold uppercase tracking-[0.22em] text-accent-text ${className}`}
  >
    {children}
  </span>
);

/**
 * Page-level header: eyebrow + serif display headline + supporting copy.
 * `accent` is rendered as the italic green clause the landing page uses.
 */
export const PageHeader: FC<{
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  align?: 'left' | 'center';
}> = ({ eyebrow, title, accent, intro, children, align = 'left' }) => (
  <header
    className={
      align === 'center' ? 'text-center max-w-2xl mx-auto' : 'max-w-3xl'
    }
  >
    {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
    <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3 text-foreground">
      {title}
      {accent ? (
        <>
          {' '}
          <em className="italic text-accent-text">{accent}</em>
        </>
      ) : null}
    </h1>
    {intro ? (
      <p className="text-[17px] text-foreground/70 leading-relaxed mt-4">{intro}</p>
    ) : null}
    {children ? <div className="mt-7">{children}</div> : null}
  </header>
);

export const Panel: FC<{
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}> = ({ title, eyebrow, description, children, className = '' }) => (
  <section className={`${brand.card} p-6 md:p-8 ${className}`}>
    {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
    {title ? (
      <h2 className="font-serif text-2xl text-foreground leading-tight">
        {title}
      </h2>
    ) : null}
    {description ? (
      <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
        {description}
      </p>
    ) : null}
    {children ? (
      <div className={title || description || eyebrow ? 'mt-5' : ''}>
        {children}
      </div>
    ) : null}
  </section>
);

type PillTone = 'mint' | 'neutral' | 'amber' | 'forest' | 'rose';

const pillTones: Record<PillTone, string> = {
  mint: 'bg-accent-light text-accent-text border-accent-medium',
  neutral: 'bg-neutral text-foreground/70 border-neutral-dark',
  amber: 'bg-[#FDF4E3] text-[#8A6314] border-[#F1DFB8]',
  forest: 'bg-foreground text-accent border-foreground',
  rose: 'bg-error/5 text-error border-error/30',
};

export const Pill: FC<{
  children: ReactNode;
  tone?: PillTone;
  className?: string;
  'data-testid'?: string;
}> = ({ children, tone = 'neutral', className = '', ...rest }) => (
  <span
    {...rest}
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] ${pillTones[tone]} ${className}`}
  >
    {children}
  </span>
);

/**
 * Names the hat the viewer is wearing on a village's internal panels —
 * admin, team, assigned ambassador or the person who filed the village.
 */
export const VillageAccessPill: FC<{
  reason?: VillageAccessReason | null;
  className?: string;
}> = ({ reason, className = '' }) => {
  const t = useTranslations();
  if (!reason) return null;
  return (
    <Pill
      tone="neutral"
      className={`normal-case tracking-normal ${className}`}
      data-testid="village-access-reason"
    >
      {t(`villages_access_reason_${reason}`)}
    </Pill>
  );
};

/** "Powered by Closer" marker — the strongest state a village can reach. */
export const CloserPill: FC<{ className?: string }> = ({ className = '' }) => (
  <Pill tone="forest" className={className}>
    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-sparkle-dot" />
    Closer
  </Pill>
);

const verificationTones: Record<VillageVerificationBadge, PillTone> = {
  unverified: 'neutral',
  pending: 'amber',
  verified: 'mint',
  resonant: 'mint',
};

export const VerificationPill: FC<{
  badge?: VillageVerificationBadge;
  className?: string;
}> = ({ badge, className = '' }) => {
  const t = useTranslations();
  if (!badge || badge === 'unverified') return null;
  return (
    <Pill tone={verificationTones[badge]} className={className}>
      {badge === 'resonant' ? '✦ ' : null}
      {t(`village_verification_${badge}`)}
    </Pill>
  );
};

export const VillageStatusPill: FC<{
  status?: VillageOnboardingStatus;
  className?: string;
}> = ({ status, className = '' }) => {
  const t = useTranslations();
  const value = status || 'map_only';
  const tone: PillTone =
    value === 'live'
      ? 'forest'
      : value === 'failed'
      ? 'rose'
      : value === 'deploy_requested' ||
        value === 'deploying' ||
        value === 'suspended'
      ? 'amber'
      : value === 'map_only'
      ? 'neutral'
      : 'mint';
  return (
    <Pill tone={tone} className={className}>
      {t(`village_status_${value}`)}
    </Pill>
  );
};

export const EmptyState: FC<{
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: ReactNode };
  className?: string;
}> = ({ title, description, action, className = '' }) => (
  <div
    className={`rounded-[22px] border border-dashed border-accent-medium bg-accent-light/40 px-6 py-12 text-center ${className}`}
  >
    <p className="font-serif text-xl text-foreground">{title}</p>
    {description ? (
      <p className="text-[14.5px] text-foreground/70 mt-2 max-w-md mx-auto">
        {description}
      </p>
    ) : null}
    {action ? (
      <Link href={action.href} className={`${btnPrimary} mt-6`}>
        {action.label}
      </Link>
    ) : null}
  </div>
);

/** Page wrapper: sets the off-white canvas and the shared content measure. */
export const PageShell: FC<{
  children: ReactNode;
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
}> = ({ children, width = 'default', className = '' }) => {
  const measure =
    width === 'narrow'
      ? 'max-w-3xl'
      : width === 'wide'
      ? 'max-w-6xl'
      : 'max-w-5xl';
  return (
    <div className={`${brand.pageBg} text-foreground min-h-screen ${className}`}>
      <div className={`${measure} mx-auto px-6 py-14 md:py-20`}>{children}</div>
    </div>
  );
};
