import Link from 'next/link';
import { FC } from 'react';

import { useTranslations } from 'next-intl';

interface Props {
  progress: number;
  total: number;
  icon?: string;
  stepIds?: string[];
  stepHrefs?: (string | null)[];
}

const Progress: FC<Props> = ({
  progress,
  total,
  icon,
  stepIds,
  stepHrefs,
}) => {
  const t = useTranslations();

  const getStepLabel = (stepId: string) => {
    const key = `bookings_progress_step_${stepId}` as 'bookings_progress_step_dates';
    return t(key);
  };

  return (
    <div className="w-full mt-2 mb-6">
      {stepIds && stepIds.length === total && (
        <div className="flex w-full gap-1">
          {stepIds.map((stepId, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < progress;
            const isCurrent = stepNum === progress;
            const href = stepHrefs?.[i];
            const isClickable = Boolean(href && isCompleted);
            const label = getStepLabel(stepId);

            const pillClass = `flex items-center justify-center rounded-full px-2 py-2 min-h-[2.25rem] min-w-0 w-full overflow-hidden ${
              isCurrent
                ? 'bg-accent text-black'
                : isCompleted
                  ? 'bg-accent/25 text-foreground'
                  : 'bg-neutral-dark/90 text-foreground'
            } ${isClickable ? 'cursor-pointer hover:opacity-90' : ''}`;

            const labelSpan = (
              <span className="min-w-0 truncate block text-center text-sm font-medium">
                {label}
              </span>
            );

            if (isClickable && href) {
              return (
                <Link
                  key={stepId}
                  href={href}
                  className="flex-1 min-w-0 flex"
                  title={label}
                >
                  <span className={pillClass}>{labelSpan}</span>
                </Link>
              );
            }
            return (
              <span
                key={stepId}
                className="flex-1 min-w-0 flex"
                title={label}
              >
                <span className={pillClass}>{labelSpan}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Progress;
