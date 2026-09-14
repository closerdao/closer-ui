import { FC } from 'react';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FirstStepDefinition, FirstStepId } from '../../constants/firstSteps';
import { Button } from '../ui';

/**
 * The way onwards, pinned to the bottom of the viewport.
 *
 * On a full-screen flow the controls have to stay put: a step whose form runs
 * past the fold would otherwise hide its own Next button, and somebody would
 * have to scroll to the end of every step to find out there was nothing left to
 * fill in.
 */
export interface StepNavBarProps {
  step: FirstStepDefinition;
  isSkipped: boolean;
  previousId: FirstStepId | null;
  nextId: FirstStepId | null;
  onNavigate: (id: FirstStepId) => void;
  onToggleSkip: (id: FirstStepId) => void;
}

const StepNavBar: FC<StepNavBarProps> = ({
  step,
  isSkipped,
  previousId,
  nextId,
  onNavigate,
  onToggleSkip,
}) => {
  const t = useTranslations();

  return (
    <nav className="sticky bottom-0 border-t border-neutral-dark bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          {previousId && (
            <Button
              variant="secondary"
              size="small"
              isFullWidth={false}
              onClick={() => onNavigate(previousId)}
            >
              <span className="flex items-center gap-1.5">
                <ArrowLeft size={16} /> {t('first_steps_back')}
              </span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!step.required && (
            <button
              type="button"
              className="text-sm underline"
              onClick={() => onToggleSkip(step.id)}
            >
              {isSkipped ? t('first_steps_unskip') : t('first_steps_skip')}
            </button>
          )}
          {nextId && (
            <Button
              size="small"
              isFullWidth={false}
              onClick={() => onNavigate(nextId)}
            >
              <span className="flex items-center gap-1.5">
                {t('first_steps_next')} <ArrowRight size={16} />
              </span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default StepNavBar;
