import React from 'react';

import { useTranslations } from 'next-intl';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';

import { WeightPieSegment } from '../../../utils/governanceWeight.helpers';
import {
  CONCENTRATION_REST_COLOR,
  CONCENTRATION_SLICE_COLORS,
} from './weightTheme';

interface ConcentrationChartProps {
  segments: WeightPieSegment[];
  majorityCount: number;
}

const colorForIndex = (index: number, total: number) =>
  index < CONCENTRATION_SLICE_COLORS.length && index < total - 1
    ? CONCENTRATION_SLICE_COLORS[index]
    : CONCENTRATION_REST_COLOR;

const ConcentrationChart: React.FC<ConcentrationChartProps> = ({
  segments,
  majorityCount,
}) => {
  const t = useTranslations();
  if (!segments.length) return null;

  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[200px_1fr]">
      <div className="relative mx-auto h-[200px] w-[200px]">
        <PieChart width={200} height={200}>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="name"
            cx={100}
            cy={100}
            innerRadius={54}
            outerRadius={92}
            stroke="none"
          >
            {segments.map((segment, index) => (
              <Cell
                key={segment.name}
                fill={colorForIndex(index, segments.length)}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
          />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center font-mono">
          <span className="text-2xl font-semibold text-gray-900">
            {majorityCount}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-gray-500">
            {t('governance_weight_hold_majority')}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
        {segments.map((segment, index) => (
          <div
            key={segment.name}
            className="flex items-center gap-2 py-0.5 font-mono text-[11px] text-gray-500"
          >
            <i
              className="h-[9px] w-[9px] flex-none rounded-sm"
              style={{
                backgroundColor: colorForIndex(index, segments.length),
              }}
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
    </div>
  );
};

export default ConcentrationChart;
