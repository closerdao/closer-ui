import Card from './ui/Card';

import { useTranslations } from 'next-intl';
import Heading from './ui/Heading';
const StatsCard = ({
  title,
  value,
  icon,
  subtext,
  isAccent,
}: {
  title: string;
  value: string;
  icon?: any;
  subtext?: string;
  isAccent?: boolean;
}) => {
  const t = useTranslations();
  return (
    <Card className="col-span-1 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={2} className="text-lg font-normal">{title}</Heading>
          <p className={`text-2xl font-semibold mt-1 ${isAccent ? 'text-accent' : ''}`}>{value || 0}</p>
          {subtext && <p className="text-sm mt-1">{subtext}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </Card>
  );
};

export default StatsCard;