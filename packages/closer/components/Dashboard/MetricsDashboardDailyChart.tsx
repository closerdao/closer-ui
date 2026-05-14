import { useMemo } from 'react';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { MetricsDailyTrendRow } from '../../types/metricsDashboard';
import { CHART_COLORS } from '../ui/Charts/chartColors';

type Props = {
  rows: MetricsDailyTrendRow[];
};

const MetricsDashboardDailyChart = ({ rows }: Props) => {
  const { data, categoryKeys } = useMemo(() => {
    const daySet = new Set<string>();
    const catSet = new Set<string>();
    const cell = new Map<string, number>();
    for (const r of rows) {
      const day = r?._id?.day;
      const cat = r?._id?.category;
      if (!day || !cat) continue;
      daySet.add(day);
      catSet.add(cat);
      const k = `${day}\u0000${cat}`;
      cell.set(k, (cell.get(k) ?? 0) + (Number(r.count) || 0));
    }
    const days = [...daySet].sort();
    const cats = [...catSet].sort();
    const dataInner = days.map((day) => {
      const row: Record<string, string | number> = { day };
      for (const c of cats) {
        row[c] = cell.get(`${day}\u0000${c}`) ?? 0;
      }
      return row;
    });
    return { data: dataInner, categoryKeys: cats };
  }, [rows]);

  if (!data.length || !categoryKeys.length) {
    return null;
  }

  return (
    <div className="w-full h-[280px] py-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip />
          <Legend />
          {categoryKeys.map((c, i) => (
            <Line
              key={c}
              type="monotone"
              dataKey={c}
              name={c}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsDashboardDailyChart;
