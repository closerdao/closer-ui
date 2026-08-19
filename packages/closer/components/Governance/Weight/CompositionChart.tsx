import React from 'react';

import { useTranslations } from 'next-intl';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';

import { COMPOSITION_COLORS } from './weightTheme';

interface CompositionChartProps {
  totalTdf: bigint;
  totalPresence: bigint;
  totalSweat: bigint;
  totalWeight: bigint;
  includeStaked: boolean;
  presenceMultiplier: number;
  sweatMultiplier: number;
}

const toFraction = (value: bigint, total: bigint) =>
  total === 0n ? 0 : Number((value * 1000000n) / total) / 1000000;

const CompositionChart: React.FC<CompositionChartProps> = ({
  totalTdf,
  totalPresence,
  totalSweat,
  totalWeight,
  includeStaked,
  presenceMultiplier,
  sweatMultiplier,
}) => {
  const t = useTranslations();
  if (totalWeight === 0n) return null;

  const segments = [
    {
      name: includeStaked
        ? t('governance_weight_source_tdf_staked')
        : t('governance_weight_source_tdf'),
      color: COMPOSITION_COLORS.tdf,
      fraction: toFraction(totalTdf, totalWeight),
    },
    {
      name: t('governance_presence'),
      color: COMPOSITION_COLORS.presence,
      fraction: toFraction(totalPresence, totalWeight),
    },
    {
      name: t('governance_sweat'),
      color: COMPOSITION_COLORS.sweat,
      fraction: toFraction(totalSweat, totalWeight),
    },
  ];

  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[200px_1fr]">
      <div className="mx-auto h-[200px] w-[200px]">
        <PieChart width={200} height={200}>
          <Pie
            data={segments}
            dataKey="fraction"
            nameKey="name"
            cx={100}
            cy={100}
            outerRadius={92}
            stroke="none"
          >
            {segments.map((segment) => (
              <Cell key={segment.name} fill={segment.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
          />
        </PieChart>
      </div>
      <div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
          {segments.map((segment) => (
            <div
              key={segment.name}
              className="flex items-center gap-2 py-0.5 font-mono text-[11px] text-gray-500"
            >
              <i
                className="h-[9px] w-[9px] flex-none rounded-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className="flex-1 truncate text-gray-900">
                {segment.name}
              </span>
              <span className="font-semibold text-gray-900">
                {(segment.fraction * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-[11px] text-gray-500">
          {t('governance_weight_composition_note', {
            presence: presenceMultiplier,
            sweat: sweatMultiplier,
          })}
        </p>
      </div>
    </div>
  );
};

export default CompositionChart;
