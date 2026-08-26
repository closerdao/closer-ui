import { AlertTriangle } from 'lucide-react';

type SummaryItem = {
  label: string;
  value: string;
};

const OnchainTransactionSummary = ({
  title,
  items,
  warning,
}: {
  title: string;
  items: SummaryItem[];
  warning?: string;
}) => {
  const gridColumns =
    items.length >= 3
      ? 'sm:grid-cols-3'
      : items.length === 2
      ? 'sm:grid-cols-2'
      : 'sm:grid-cols-1';

  return (
    <section className="rounded-xl border border-border bg-muted/30 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className={`grid grid-cols-1 gap-2 ${gridColumns}`}>
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-0.5 break-words text-lg font-semibold tabular-nums text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>
      {warning && (
        <div
          role="status"
          className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{warning}</span>
        </div>
      )}
    </section>
  );
};

export default OnchainTransactionSummary;
