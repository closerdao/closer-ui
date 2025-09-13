import { memo } from 'react';

interface FunnelStats {
  count: string | number | undefined | null;
  percentage: number;
}

interface FunnelBarProps {
  label: string;
  stats: FunnelStats;
  color?: string;
}

const FunnelBar = memo(
  ({ label, stats, color = 'bg-blue-500' }: FunnelBarProps) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-gray-900">{stats?.count || 0}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {stats?.percentage || 0}%
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(stats?.percentage || 0, 100)}%` }}
        />
      </div>
    </div>
  ),
);

FunnelBar.displayName = 'FunnelBar';

export default FunnelBar;
