import Card from '../../../components/ui/Card';

import { useTranslations } from 'next-intl';

export const StatsCard = ({
  title,
  value,
  icon,
  subtext,
}: {
  title: string;
  value: string;
  icon?: any;
  subtext: string;
}) => {
  const t = useTranslations();
  return (
    <Card className="col-span-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value || 0}</p>
          <p className="text-sm mt-1">{subtext}</p>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </Card>
  );
};
