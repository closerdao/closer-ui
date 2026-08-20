import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { StatDelta, formatStatDelta } from '../../utils/dashboardStats.helpers';

interface Props {
  label: string;
  value: number | null;
  delta?: StatDelta | null;
  /** Rendered under the delta, e.g. "vs. previous month" or "all time". */
  hint?: string;
  isLoading?: boolean;
  formatValue: (value: number) => string;
}

const directionClasses = {
  up: 'text-green-700',
  down: 'text-red-600',
  flat: 'text-gray-500',
} as const;

const StatCard = ({
  label,
  value,
  delta,
  hint,
  isLoading = false,
  formatValue,
}: Props) => {
  const deltaLabel = delta ? formatStatDelta(delta) : null;
  const Arrow =
    delta?.direction === 'up'
      ? ArrowUpRight
      : delta?.direction === 'down'
      ? ArrowDownRight
      : Minus;

  return (
    <div className="bg-accent-light/30 rounded-lg p-3 text-center">
      {isLoading ? (
        <div
          className="h-7 mb-1 mx-auto w-2/3 rounded bg-gray-200 animate-pulse"
          role="status"
          aria-label={label}
        />
      ) : (
        <div className="text-lg sm:text-xl font-bold text-accent leading-7 mb-1">
          {formatValue(value ?? 0)}
        </div>
      )}

      <div className="text-xs text-gray-600">{label}</div>

      {!isLoading && (deltaLabel || hint) && (
        <div className="mt-1 flex flex-col items-center gap-0.5">
          {deltaLabel && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium ${
                directionClasses[delta?.direction ?? 'flat']
              }`}
            >
              <Arrow className="w-3 h-3" aria-hidden="true" />
              {deltaLabel}
            </span>
          )}
          {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
