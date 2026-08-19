import React from 'react';

import { useTranslations } from 'next-intl';

import { WEIGHT_COLORS } from './weightTheme';

interface WeightFormulaProps {
  includeStaked: boolean;
  presenceMultiplier: number;
  sweatMultiplier: number;
  onPresenceMultiplierChange: (value: number) => void;
  onSweatMultiplierChange: (value: number) => void;
}

const WeightFormula: React.FC<WeightFormulaProps> = ({
  includeStaked,
  presenceMultiplier,
  sweatMultiplier,
  onPresenceMultiplierChange,
  onSweatMultiplierChange,
}) => {
  const t = useTranslations();

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-4">
        <span className="mb-0.5 w-full font-mono text-[10.5px] uppercase tracking-wider text-gray-500">
          {t('governance_weight_formula_label')}
        </span>
        <span className="font-mono text-[15px] font-semibold text-accent">
          {t('governance_weight')}
        </span>
        <span className="font-mono text-gray-500">=</span>
        <span className="font-mono text-[15px] font-semibold text-gray-900">
          {t('governance_tdf_balance')}
        </span>
        {includeStaked && (
          <span
            className="-mr-1 font-mono font-semibold"
            style={{ color: WEIGHT_COLORS.staked }}
          >
            {t('governance_weight_plus_staked')}
          </span>
        )}
        <span className="font-mono text-gray-500">+</span>
        <span className="font-mono text-gray-500">(</span>
        <span
          className="font-mono text-[15px] font-semibold"
          style={{ color: WEIGHT_COLORS.presence }}
        >
          {t('governance_presence')}
        </span>
        <span className="font-mono text-gray-500">×</span>
        <input
          type="number"
          min={0}
          max={1000}
          step={0.5}
          value={presenceMultiplier}
          onChange={(event) =>
            onPresenceMultiplierChange(Number(event.target.value))
          }
          aria-label={t('governance_weight_presence_multiplier_label')}
          className="w-[68px] rounded-lg border border-gray-200 bg-neutral-light px-1.5 py-1 text-center font-mono text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          style={{ color: WEIGHT_COLORS.presence }}
        />
        <span className="font-mono text-gray-500">)</span>
        <span className="font-mono text-gray-500">+</span>
        <span className="font-mono text-gray-500">(</span>
        <span
          className="font-mono text-[15px] font-semibold"
          style={{ color: WEIGHT_COLORS.sweat }}
        >
          {t('governance_sweat')}
        </span>
        <span className="font-mono text-gray-500">×</span>
        <input
          type="number"
          min={0}
          max={1000}
          step={0.5}
          value={sweatMultiplier}
          onChange={(event) =>
            onSweatMultiplierChange(Number(event.target.value))
          }
          aria-label={t('governance_weight_sweat_multiplier_label')}
          className="w-[68px] rounded-lg border border-gray-200 bg-neutral-light px-1.5 py-1 text-center font-mono text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          style={{ color: WEIGHT_COLORS.sweat }}
        />
        <span className="font-mono text-gray-500">)</span>
      </div>
      <p className="mt-2 max-w-[74ch] px-0.5 text-xs text-gray-500">
        {t('governance_weight_formula_hint')}
      </p>
    </div>
  );
};

export default WeightFormula;
