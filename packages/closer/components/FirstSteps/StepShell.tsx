import Link from 'next/link';

import { FC, ReactNode } from 'react';

import { Check, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FirstStepDefinition } from '../../constants/firstSteps';
import { ErrorMessage, Heading } from '../ui';

/**
 * The frame every step shares: what this step is, why it matters, and the
 * step's own content.
 *
 * Keeping the chrome here rather than in each step means the eight steps read
 * as one flow, and a step component only has to know about its own fields. The
 * onward controls live in `StepNavBar`, pinned to the bottom of the viewport by
 * the page rather than sitting at the end of the content.
 */
export interface StepShellProps {
  step: FirstStepDefinition;
  isDone: boolean;
  isSkipped: boolean;
  /** Shown above the content when a save fails. */
  error?: string | null;
  children: ReactNode;
}

const StepShell: FC<StepShellProps> = ({
  step,
  isDone,
  isSkipped,
  error,
  children,
}) => {
  const t = useTranslations();

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Heading level={1} className="text-4xl">
            {t(step.titleKey)}
          </Heading>

          {isDone && (
            <span
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent-light px-3 py-1 text-sm"
              data-testid="first-steps-done-badge"
            >
              <Check size={14} /> {t('first_steps_status_done')}
            </span>
          )}
          {!isDone && isSkipped && (
            <span
              className="whitespace-nowrap rounded-full bg-neutral px-3 py-1 text-sm"
              data-testid="first-steps-skipped-badge"
            >
              {t('first_steps_status_skipped')}
            </span>
          )}
        </div>

        <p className="text-xl text-foreground/80">{step.blurb}</p>

        <div className="rounded-lg bg-neutral p-5 text-sm leading-relaxed">
          <p className="mb-1.5 font-bold">{t('first_steps_why_heading')}</p>
          <p>{step.why}</p>
        </div>
      </header>

      {error && <ErrorMessage error={error} />}

      <div className="flex flex-col gap-8">{children}</div>

      {step.deepLink && (
        <Link
          href={step.deepLink.href}
          className="flex w-fit items-center gap-1.5 text-sm underline"
        >
          {t(step.deepLink.labelKey)}
          <ExternalLink size={14} />
        </Link>
      )}
    </section>
  );
};

export default StepShell;
