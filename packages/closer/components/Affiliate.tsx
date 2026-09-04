import Card from './ui/Card';
import Heading from './ui/Heading';

const StatsCard = ({
  title,
  value,
  icon,
  subtext,
  isAccent,
}: {
  title: string;
  value: string | number;
  icon?: any;
  subtext?: string;
  isAccent?: boolean;
}) => {
  return (
    <Card
      className={`col-span-1 rounded-2xl shadow-none border ${
        isAccent
          ? 'bg-accent-light/40 border-accent/30'
          : 'bg-background border-line/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading
            level={2}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/60"
          >
            {title}
          </Heading>
          <p
            className={`text-3xl font-bold mt-2 leading-none ${
              isAccent ? 'text-accent' : ''
            }`}
          >
            {value || 0}
          </p>
          {subtext && (
            <p className="text-sm text-foreground/60 mt-2">{subtext}</p>
          )}
        </div>
        {icon && <div className="text-foreground/40">{icon}</div>}
      </div>
    </Card>
  );
};

export default StatsCard;
