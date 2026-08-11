import Link from 'next/link';

import { FC, ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import {
  VillageOnboardingStatus,
  VillageVerificationBadge,
} from '../../types/village';

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
  ink: 'text-[#10201A]',
  muted: 'text-[#5C6E64]',
  green: 'text-[#0FA968]',
  greenDeep: 'text-[#0B7A4C]',
  pageBg: 'bg-[#FCFDFB]',
  wash: 'bg-[#E2FAEE]',
  washSoft: 'bg-[#F3FCF7]',
  border: 'border-[#C2F0DA]',
  forest: 'bg-[#0E1E16]',
  card: 'bg-white border border-[#C2F0DA] rounded-[22px]',
  cardSm: 'bg-white border border-[#C2F0DA] rounded-[18px]',
};

/** Solid mint CTA — matches the homepage "Launch your community" button. */
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-[15px] bg-[#3EE08F] text-[#07351F] shadow-[0_6px_20px_rgba(62,224,143,0.35)] hover:bg-[#5BEBA4] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none';

/** Outlined counterpart for the secondary action in a pair. */
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-[15px] bg-white border border-[#C2F0DA] text-[#0B7A4C] hover:border-[#0FA968] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none';

/** Compact action used inside panels and list rows. */
export const btnSmall =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-[13.5px] bg-white border border-[#C2F0DA] text-[#0B7A4C] hover:border-[#0FA968] transition-colors disabled:opacity-50 disabled:pointer-events-none';

export const btnSmallPrimary =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-[13.5px] bg-[#3EE08F] text-[#07351F] hover:bg-[#5BEBA4] transition-colors disabled:opacity-50 disabled:pointer-events-none';

/**
 * `new-input` opts out of the legacy underline treatment in css/forms.css,
 * which otherwise outranks these utilities on typed fields (email, number…).
 */
export const inputClass =
  'new-input w-full rounded-xl border border-[#DCE7E1] bg-white px-4 py-3 text-[15px] text-[#10201A] placeholder:text-[#9BAAA2] focus:border-[#0FA968] focus:ring-2 focus:ring-[#3EE08F]/30 focus:outline-none transition-colors';

export const labelClass =
  'text-[13px] font-semibold text-[#10201A] tracking-[0.01em]';

export const Eyebrow: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <span
    className={`block text-xs font-bold uppercase tracking-[0.22em] text-[#0FA968] ${className}`}
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
    <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3 text-[#10201A]">
      {title}
      {accent ? (
        <>
          {' '}
          <em className="italic text-[#0FA968]">{accent}</em>
        </>
      ) : null}
    </h1>
    {intro ? (
      <p className="text-[17px] text-[#5C6E64] leading-relaxed mt-4">{intro}</p>
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
      <h2 className="font-serif text-2xl text-[#10201A] leading-tight">
        {title}
      </h2>
    ) : null}
    {description ? (
      <p className="text-[14.5px] text-[#5C6E64] mt-2 leading-relaxed">
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

type PillTone = 'mint' | 'neutral' | 'amber' | 'forest';

const pillTones: Record<PillTone, string> = {
  mint: 'bg-[#E2FAEE] text-[#0B7A4C] border-[#C2F0DA]',
  neutral: 'bg-[#F4F6F5] text-[#5C6E64] border-[#E3E8E5]',
  amber: 'bg-[#FDF4E3] text-[#8A6314] border-[#F1DFB8]',
  forest: 'bg-[#0E1E16] text-[#8EF0BE] border-[#0E1E16]',
};

export const Pill: FC<{
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}> = ({ children, tone = 'neutral', className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] ${pillTones[tone]} ${className}`}
  >
    {children}
  </span>
);

/** "Powered by Closer" marker — the strongest state a village can reach. */
export const CloserPill: FC<{ className?: string }> = ({ className = '' }) => (
  <Pill tone="forest" className={className}>
    <span className="w-1.5 h-1.5 rounded-full bg-[#3EE08F] animate-sparkle-dot" />
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

/**
 * The Tier 0 → Tier 1 path, collapsed to the five milestones a person can act
 * on. `intro_scheduled` and `deploying` are in-between states, so they resolve
 * to the milestone they are working toward.
 */
export const JOURNEY_STEPS = [
  'map_only',
  'pre_assessed',
  'subscribed',
  'deploy_requested',
  'live',
] as const;

const statusToStepIndex: Record<VillageOnboardingStatus, number> = {
  map_only: 0,
  pre_assessed: 1,
  intro_scheduled: 1,
  subscribed: 2,
  deploy_requested: 3,
  deploying: 3,
  live: 4,
};

export const getJourneyIndex = (status?: VillageOnboardingStatus): number =>
  statusToStepIndex[status || 'map_only'] ?? 0;

export const VillageStatusPill: FC<{
  status?: VillageOnboardingStatus;
  className?: string;
}> = ({ status, className = '' }) => {
  const t = useTranslations();
  const value = status || 'map_only';
  const tone: PillTone =
    value === 'live'
      ? 'forest'
      : value === 'deploy_requested' || value === 'deploying'
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

/**
 * Vertical milestone rail. It lives in a narrow sidebar, where a horizontal
 * stepper would wrap into an unreadable grid — stacking keeps every label on
 * one line and makes the connecting spine do the work of showing progress.
 */
export const JourneyTracker: FC<{
  status?: VillageOnboardingStatus;
  className?: string;
}> = ({ status, className = '' }) => {
  const t = useTranslations();
  const current = getJourneyIndex(status);

  return (
    <ol className={`flex flex-col ${className}`}>
      {JOURNEY_STEPS.map((step, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        const isLast = index === JOURNEY_STEPS.length - 1;
        return (
          <li key={step} className="flex gap-3">
            {/* marker + spine */}
            <div className="flex flex-col items-center flex-none">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                  isDone
                    ? 'bg-[#3EE08F] border-[#3EE08F] text-[#07351F]'
                    : isCurrent
                    ? 'bg-white border-[#0FA968] text-[#0FA968]'
                    : 'bg-white border-[#DCE7E1] text-[#9BAAA2]'
                }`}
              >
                {isDone ? '✓' : index + 1}
              </span>
              {!isLast ? (
                <span
                  className={`w-0.5 flex-1 min-h-[18px] my-1 rounded-full ${
                    isDone ? 'bg-[#3EE08F]' : 'bg-[#DCE7E1]'
                  }`}
                />
              ) : null}
            </div>
            <span
              className={`text-[13.5px] leading-tight font-semibold pt-1 ${
                isLast ? '' : 'pb-4'
              } ${
                isCurrent
                  ? 'text-[#0B7A4C]'
                  : isDone
                  ? 'text-[#10201A]'
                  : 'text-[#9BAAA2]'
              }`}
            >
              {t(`village_journey_${step}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export const EmptyState: FC<{
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: ReactNode };
  className?: string;
}> = ({ title, description, action, className = '' }) => (
  <div
    className={`rounded-[22px] border border-dashed border-[#C2F0DA] bg-[#F3FCF7] px-6 py-12 text-center ${className}`}
  >
    <p className="font-serif text-xl text-[#10201A]">{title}</p>
    {description ? (
      <p className="text-[14.5px] text-[#5C6E64] mt-2 max-w-md mx-auto">
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
    <div className={`${brand.pageBg} text-[#10201A] min-h-screen ${className}`}>
      <div className={`${measure} mx-auto px-6 py-14 md:py-20`}>{children}</div>
    </div>
  );
};
