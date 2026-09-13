import Link from 'next/link';
import { useRouter } from 'next/router';

import { FC, ReactNode, useContext } from 'react';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useVillageFunnel } from '../../hooks/useVillageFunnel';
import {
  VILLAGE_FUNNEL_STEPS,
  VillageFunnelFacts,
  VillageFunnelStep,
  getVillageFunnelPrompt,
  getVillageFunnelSteps,
} from '../../utils/villageFunnel';
import { PromptGetInTouchContext } from '../PromptGetInTouchContext';
import { btnPrimary } from './index';

/**
 * One look for the five-step self-checkout, shared by every surface it crosses:
 * the application modals, /signup, /subscriptions, /village/launch and the
 * village page. The steps themselves live in `utils/villageFunnel`.
 *
 * Two tones, because the funnel starts inside app-themed modals and ends on the
 * closer.earth village pages, which use their own fixed green palette rather
 * than the configured accent.
 */
export type FunnelTone = 'brand' | 'accent';

const tones: Record<
  FunnelTone,
  {
    done: string;
    current: string;
    pending: string;
    label: string;
    hint: string;
    eyebrow: string;
    line: string;
    lineIdle: string;
    card: string;
    button: string;
  }
> = {
  brand: {
    done: 'bg-accent text-accent-foreground border-accent',
    current: 'bg-accent-light text-accent-text border-accent',
    pending: 'bg-background text-foreground/50 border-neutral-dark',
    label: 'text-foreground',
    hint: 'text-foreground/70',
    eyebrow: 'text-accent-text',
    line: 'bg-accent',
    lineIdle: 'bg-neutral-dark',
    card: 'bg-background border border-accent-medium',
    button: btnPrimary,
  },
  accent: {
    done: 'bg-accent text-accent-foreground border-accent',
    current: 'bg-accent-light text-accent border-accent',
    pending: 'bg-dominant text-neutral-dark border-neutral',
    label: '',
    hint: 'opacity-70',
    eyebrow: 'text-accent',
    line: 'bg-accent',
    lineIdle: 'bg-neutral',
    card: 'bg-dominant border border-neutral',
    button:
      'inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-[15px] bg-accent text-accent-foreground hover:opacity-90 transition-opacity',
  },
};

const Marker: FC<{
  tone: FunnelTone;
  state: 'done' | 'current' | 'pending';
  children: ReactNode;
  className?: string;
}> = ({ tone, state, children, className = '' }) => (
  <span
    className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-[11px] font-bold ${tones[tone][state]} ${className}`}
  >
    {state === 'done' ? <Check className="w-3.5 h-3.5" /> : children}
  </span>
);

const Progress: FC<{ tone: FunnelTone; step: number; total: number }> = ({
  tone,
  step,
  total,
}) => {
  const t = useTranslations();
  return (
    <span
      className={`block text-xs font-bold uppercase tracking-[0.22em] ${tones[tone].eyebrow}`}
    >
      {t('village_funnel_progress', { step, total })}
    </span>
  );
};

/**
 * The steps themselves. `list` stacks them with hints — what a modal or a
 * narrow sidebar wants. `rail` lays them out horizontally with short labels, for
 * the top of a full page.
 *
 * `steps` narrows the list: platforms without villages (every app but
 * closer.earth) stop the story at the subscription.
 */
export const VillageFunnelSteps: FC<{
  facts: VillageFunnelFacts;
  steps?: readonly VillageFunnelStep[];
  variant?: 'list' | 'rail';
  tone?: FunnelTone;
  className?: string;
}> = ({
  facts,
  steps = VILLAGE_FUNNEL_STEPS,
  variant = 'list',
  tone = 'brand',
  className = '',
}) => {
  const t = useTranslations();
  const palette = tones[tone];
  const shown = getVillageFunnelSteps(facts).filter((state) =>
    steps.includes(state.step),
  );

  const stateOf = (state: (typeof shown)[number]) =>
    state.isDone ? 'done' : state.isCurrent ? 'current' : 'pending';

  if (variant === 'rail') {
    return (
      <ol className={`flex items-start ${className}`}>
        {shown.map((state, position) => {
          const kind = stateOf(state);
          return (
            <li
              key={state.step}
              className={`flex-1 min-w-0 flex flex-col items-center text-center ${
                kind === 'pending' ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center w-full">
                {/* The rails on either side of the marker draw the spine; the
                    outer halves of the first and last node stay blank so the
                    line does not run off the ends. */}
                <span
                  className={`h-0.5 flex-1 rounded-full ${
                    position === 0
                      ? 'bg-transparent'
                      : state.isDone || state.isCurrent
                      ? palette.line
                      : palette.lineIdle
                  }`}
                />
                <Marker tone={tone} state={kind}>
                  {state.index + 1}
                </Marker>
                <span
                  className={`h-0.5 flex-1 rounded-full ${
                    position === shown.length - 1
                      ? 'bg-transparent'
                      : state.isDone
                      ? palette.line
                      : palette.lineIdle
                  }`}
                />
              </div>
              <span
                className={`mt-2 px-1 text-[12px] sm:text-[12.5px] font-semibold leading-tight ${
                  kind === 'current' ? palette.eyebrow : palette.label
                }`}
              >
                {t(`village_funnel_short_${state.step}`)}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={`flex flex-col gap-4 ${className}`}>
      {shown.map((state) => {
        const kind = stateOf(state);
        return (
          <li
            key={state.step}
            className={`flex gap-3 items-start ${
              kind === 'pending' ? 'opacity-50' : ''
            }`}
          >
            <Marker tone={tone} state={kind} className="mt-0.5">
              {state.index + 1}
            </Marker>
            <span className="flex flex-col text-left">
              <span className={`text-sm font-medium ${palette.label}`}>
                {t(
                  state.isDone
                    ? `village_funnel_step_${state.step}_done`
                    : `village_funnel_step_${state.step}`,
                )}
              </span>
              {/* A finished step has nothing left to explain. */}
              {!state.isDone ? (
                <span className={`text-xs mt-0.5 ${palette.hint}`}>
                  {t(`village_funnel_step_${state.step}_hint`)}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

/**
 * The single call to action for whatever step comes next. Renders nothing once
 * the village is live — there is no sixth step to send anyone to.
 *
 * `onNavigate` is how a modal closes itself on the way out; without it the CTA
 * is a plain link, which is what a page wants.
 */
export const VillageFunnelCta: FC<{
  facts: VillageFunnelFacts;
  steps?: readonly VillageFunnelStep[];
  tone?: FunnelTone;
  onNavigate?: () => void;
  className?: string;
}> = ({
  facts,
  steps = VILLAGE_FUNNEL_STEPS,
  tone = 'brand',
  onNavigate,
  className = '',
}) => {
  const t = useTranslations();
  const router = useRouter();
  // Always mounted by _app; the default context value makes this a no-op when
  // it is not.
  const { setIsOpen } = useContext(PromptGetInTouchContext);
  const prompt = getVillageFunnelPrompt(facts);

  if (!prompt || !steps.includes(prompt.step)) return null;

  const className_ = `${tones[tone].button} ${className}`;
  const label = t(`village_funnel_cta_${prompt.step}`);
  const { href } = prompt;

  if (!href) {
    return (
      <button
        type="button"
        className={className_}
        onClick={() => {
          onNavigate?.();
          setIsOpen(true);
        }}
      >
        {label}
      </button>
    );
  }

  if (onNavigate) {
    return (
      <button
        type="button"
        className={className_}
        onClick={() => {
          onNavigate();
          router.push(href);
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={className_}>
      {label}
    </Link>
  );
};

/**
 * "You are here" for the top of a funnel page. Draws nothing for a visitor who
 * never entered the funnel, so /signup and /subscriptions stay ordinary pages
 * for everybody else.
 */
export const VillageFunnelBanner: FC<{
  tone?: FunnelTone;
  className?: string;
}> = ({ tone = 'accent', className = '' }) => {
  const { facts, isInFunnel } = useVillageFunnel();
  const prompt = getVillageFunnelPrompt(facts);

  if (!isInFunnel || !prompt) return null;

  return (
    <div className={`${tones[tone].card} rounded-[18px] p-5 ${className}`}>
      <Progress
        tone={tone}
        step={prompt.index + 1}
        total={VILLAGE_FUNNEL_STEPS.length}
      />
      <VillageFunnelSteps
        facts={facts}
        variant="rail"
        tone={tone}
        className="mt-4"
      />
    </div>
  );
};

/**
 * The hand-off card: where you are, what is next, and the button that gets you
 * there. Used where a step has just finished and the funnel has to carry the
 * person into the following one.
 */
export const VillageFunnelPrompt: FC<{
  facts: VillageFunnelFacts;
  steps?: readonly VillageFunnelStep[];
  tone?: FunnelTone;
  showSteps?: boolean;
  onNavigate?: () => void;
  className?: string;
}> = ({
  facts,
  steps = VILLAGE_FUNNEL_STEPS,
  tone = 'brand',
  showSteps = false,
  onNavigate,
  className = '',
}) => {
  const t = useTranslations();
  const palette = tones[tone];
  const prompt = getVillageFunnelPrompt(facts);

  if (!prompt || !steps.includes(prompt.step)) return null;

  return (
    <div className={`${palette.card} rounded-[18px] p-5 md:p-6 ${className}`}>
      <Progress tone={tone} step={prompt.index + 1} total={steps.length} />
      <p className={`text-[17px] font-semibold mt-2 ${palette.label}`}>
        {t(`village_funnel_step_${prompt.step}`)}
      </p>
      <p className={`text-sm mt-1 ${palette.hint}`}>
        {t(`village_funnel_step_${prompt.step}_hint`)}
      </p>
      {showSteps ? (
        <VillageFunnelSteps
          facts={facts}
          steps={steps}
          variant="rail"
          tone={tone}
          className="my-5"
        />
      ) : null}
      <VillageFunnelCta
        facts={facts}
        steps={steps}
        tone={tone}
        onNavigate={onNavigate}
        className={showSteps ? '' : 'mt-5'}
      />
    </div>
  );
};

export default VillageFunnelSteps;
