import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import GovernanceConfetti from './GovernanceConfetti';

interface VoteAmountSelectorProps {
  totalWeight: number;
  value: number;
  onChange: (value: number) => void;
}

const roundWeight = (value: number) => parseFloat(value.toFixed(2));

const VoteAmountSelector = ({
  totalWeight,
  value,
  onChange,
}: VoteAmountSelectorProps) => {
  const t = useTranslations();
  const previousValueRef = useRef(value);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiIntensity, setConfettiIntensity] = useState(0.2);
  const maxWeight = Math.max(roundWeight(totalWeight), 1);
  const step = maxWeight <= 10 ? 0.1 : maxWeight <= 100 ? 1 : 5;

  useEffect(() => {
    if (value > previousValueRef.current) {
      setConfettiIntensity(Math.min(1, value / maxWeight));
      setShowConfetti(true);
    }

    previousValueRef.current = value;
  }, [maxWeight, value]);

  const handleChange = (nextValue: number) => {
    const clampedValue = roundWeight(
      Math.min(maxWeight, Math.max(step, nextValue)),
    );
    onChange(clampedValue);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4">
      <GovernanceConfetti
        active={showConfetti}
        intensity={confettiIntensity}
        variant="vote"
        durationMs={1400}
        onComplete={() => setShowConfetti(false)}
      />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {t('governance_vote_amount_label')}
            </p>
            <p className="text-xs text-gray-500">
              {t('governance_vote_amount_available', {
                total: maxWeight.toFixed(2),
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-gray-900">
              {value.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">{t('governance_votes')}</p>
          </div>
        </div>

        <input
          type="range"
          min={step}
          max={maxWeight}
          step={step}
          value={value}
          onChange={(event) => handleChange(parseFloat(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-gray-900"
        />

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleChange(step)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            {t('governance_vote_amount_min')}
          </button>
          <button
            type="button"
            onClick={() => handleChange(maxWeight / 2)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            {t('governance_vote_amount_half')}
          </button>
          <button
            type="button"
            onClick={() => handleChange(maxWeight)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            {t('governance_vote_amount_max')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteAmountSelector;
