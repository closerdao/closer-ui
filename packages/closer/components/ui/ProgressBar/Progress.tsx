import Link from 'next/link';
import { FC } from 'react';

interface Props {
  progress: number;
  total: number;
  stepIds?: string[];
  stepHrefs?: (string | null)[];
}

const Progress: FC<Props> = ({
  progress,
  total,
  stepIds,
  stepHrefs,
}) => {
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

            const pillClass = `flex items-center justify-center rounded-full min-w-0 w-full overflow-hidden h-1 md:h-[0.35rem] ${
              isCurrent
                ? 'bg-accent text-black'
                : isCompleted
                  ? 'bg-accent/25 text-foreground'
                  : 'bg-neutral-dark/90 text-foreground'
            } ${isClickable ? 'cursor-pointer hover:opacity-90' : ''}`;

            if (isClickable && href) {
              return (
                <Link
                  key={stepId}
                  href={href}
                  className="flex-1 min-w-0 flex"
                >
                  <span className={pillClass} />
                </Link>
              );
            }
            return (
              <span
                key={stepId}
                className="flex-1 min-w-0 flex"
              >
                <span className={pillClass} />
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Progress;
