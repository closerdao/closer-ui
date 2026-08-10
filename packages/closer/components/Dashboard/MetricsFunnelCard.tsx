type FunnelStep = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  steps: FunnelStep[];
  barFrom: string;
  barTo: string;
  badge?: string;
  badgeTitle?: string;
};

function formatCount(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString();
}

const MetricsFunnelCard = ({
  title,
  steps,
  barFrom,
  barTo,
  badge,
  badgeTitle,
}: Props) => {
  const max = Math.max(1, ...steps.map((s) => s.value));

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="relative px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 bg-gradient-to-r from-gray-50/90 to-white">
        <div
          className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
          style={{
            background: `linear-gradient(180deg, ${barFrom}, ${barTo})`,
          }}
        />
        <h4 className="text-base font-semibold text-gray-900 tracking-tight pl-3">
          {title}
        </h4>
        {badge ? (
          <span
            title={badgeTitle}
            className="text-xs font-semibold tabular-nums text-gray-700 shrink-0 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200/80"
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-4 flex flex-col gap-3.5">
        {steps.map((step, i) => {
          const pct = Math.min(100, (100 * step.value) / max);
          return (
            <div key={`${step.label}-${i}`} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2 min-w-0">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide truncate">
                  {step.label}
                </span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                  {formatCount(step.value)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden ring-1 ring-inset ring-gray-100/80">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${barFrom}, ${barTo})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsFunnelCard;
