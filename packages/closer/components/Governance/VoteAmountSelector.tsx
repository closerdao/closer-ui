import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import GovernanceConfetti, { ConfettiOrigin } from './GovernanceConfetti';

interface VoteAmountSelectorProps {
  /** Voting weight still available to spend on this proposal. */
  totalWeight: number;
  value: number;
  onChange: (value: number) => void;
  /** Weight the user has already committed to this proposal, if any. */
  alreadyCastWeight?: number;
}

// Keep in sync with the ::-webkit-slider-thumb size below — the confetti origin
// is derived from it, so a mismatch shifts the burst off the handle.
const THUMB_SIZE = 20;

const roundWeight = (value: number) => parseFloat(value.toFixed(2));

const VoteAmountSelector = ({
  totalWeight,
  value,
  onChange,
  alreadyCastWeight = 0,
}: VoteAmountSelectorProps) => {
  const t = useTranslations();
  const sliderRef = useRef<HTMLInputElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiIntensity, setConfettiIntensity] = useState(0.2);
  const [confettiOrigin, setConfettiOrigin] = useState<ConfettiOrigin | null>(
    null,
  );
  const maxWeight = Math.max(roundWeight(totalWeight), 0);
  const step = maxWeight <= 10 ? 0.1 : maxWeight <= 100 ? 1 : 5;

  const getThumbOrigin = (nextValue: number): ConfettiOrigin | null => {
    const slider = sliderRef.current;

    if (!slider) {
      return null;
    }

    const rect = slider.getBoundingClientRect();
    const fraction =
      maxWeight > 0 ? Math.min(1, Math.max(0, nextValue / maxWeight)) : 0;
    const travel = Math.max(0, rect.width - THUMB_SIZE);

    return {
      x: rect.left + THUMB_SIZE / 2 + fraction * travel,
      y: rect.top + rect.height / 2,
    };
  };

  const handleChange = (nextValue: number) => {
    const clampedValue = roundWeight(
      Math.min(maxWeight, Math.max(0, nextValue)),
    );

    if (clampedValue > value) {
      setConfettiOrigin(getThumbOrigin(clampedValue));
      setConfettiIntensity(
        maxWeight > 0 ? Math.min(1, clampedValue / maxWeight) : 0.2,
      );
      setShowConfetti(true);
    }

    onChange(clampedValue);
  };

  return (
    <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-4">
      <GovernanceConfetti
        active={showConfetti}
        intensity={confettiIntensity}
        variant="vote"
        durationMs={1400}
        origin={confettiOrigin}
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
            {alreadyCastWeight > 0 && (
              <p className="text-xs text-gray-500">
                {t('governance_vote_amount_already_cast', {
                  cast: alreadyCastWeight.toFixed(2),
                })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-gray-900">
              {value.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">{t('governance_votes')}</p>
          </div>
        </div>

        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={maxWeight}
          step={step}
          value={value}
          aria-label={t('governance_vote_amount_label')}
          onChange={(event) => handleChange(parseFloat(event.target.value))}
          className="governance-vote-slider w-full cursor-pointer"
        />

        {value === 0 && (
          <p className="-mt-2 text-xs text-gray-500">
            {t('governance_vote_amount_drag_hint')}
          </p>
        )}

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

      <style jsx global>{`
        .governance-vote-slider {
          -webkit-appearance: none;
          appearance: none;
          height: ${THUMB_SIZE}px;
          background: transparent;
        }
        .governance-vote-slider::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 9999px;
          background: #e5e7eb;
        }
        .governance-vote-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: ${THUMB_SIZE}px;
          height: ${THUMB_SIZE}px;
          margin-top: ${(8 - THUMB_SIZE) / 2}px;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          background: #111827;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .governance-vote-slider::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
          background: #e5e7eb;
        }
        .governance-vote-slider::-moz-range-thumb {
          width: ${THUMB_SIZE - 4}px;
          height: ${THUMB_SIZE - 4}px;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          background: #111827;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default VoteAmountSelector;
