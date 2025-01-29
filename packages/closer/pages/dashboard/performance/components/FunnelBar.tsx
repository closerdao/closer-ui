import { memo } from 'react';

interface FunnelStats {
  count: string | number;
  percentage: number;
}

interface FunnelBarProps {
  label: string;
  stats: FunnelStats;
  color?: string;
}

const FunnelBar = memo(
  ({ label, stats, color = 'bg-accent-light' }: FunnelBarProps) => (
    <div className="relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">{label}</span>
        <div className="text-sm ">
          <span className="font-medium">{stats.count}</span>
          <span className="mx-1">-</span>
          <span>{stats.percentage}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${stats.percentage}%`, maxWidth: '100%' }}
        />
      </div>
    </div>
  ),
);

FunnelBar.displayName = 'FunnelBar';

export default FunnelBar;
