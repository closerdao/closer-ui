import { useTranslations } from 'next-intl';

import ArrivingIcon from '../icons/ArrivingIcon';
import DepartingIcon from '../icons/DepartingIcon';
import { Card } from '../ui';

interface Props {
  arrivingBookings: any;
  departingBookings: any;
  nightlyListings: any;
  nightlyListingsIds: any;
}

const ArrivingAndDeparting = ({
  arrivingBookings,
  departingBookings,
  nightlyListings,
  nightlyListingsIds,
}: Props) => {
    const t = useTranslations();
    
  const arrivingNightlyBookings =
    arrivingBookings &&
    nightlyListings &&
    arrivingBookings?.filter((booking: any) => {
      {
        return nightlyListingsIds.includes(booking.get('listing'));
      }
    });
  const departingNightlyBookings =
    departingBookings &&
    nightlyListings &&
    departingBookings?.filter((booking: any) => {
      {
        return nightlyListingsIds.includes(booking.get('listing'));
      }
    });

  return (
    <div className="grid grid-rows-2 gap-4">
      <Card className="p-2 flex flex-row gap-1 justify-between items-center">
        <p className="text-xl font-bold">
          {arrivingNightlyBookings && arrivingNightlyBookings.size}
        </p>
        <div>
          <p>{t('dashboard_rooms')}</p>
          <p className="text-accent">{t('dashboard_arriving')}</p>
        </div>

        <div className="flex-shrink-0 bg-neutral-dark rounded-md w-9 h-9 flex items-center justify-center">
          <ArrivingIcon />
        </div>
      </Card>

      <Card className="p-2 flex flex-row gap-1 justify-between items-center">
        <p className="text-xl font-bold">
          {departingNightlyBookings && departingNightlyBookings.size}
        </p>
        <div>
          <p>{t('dashboard_rooms')}</p>
          <p className="text-accent">{t('dashboard_departing')}</p>
        </div>

        <div className="flex-shrink-0 bg-neutral-dark rounded-md w-9 h-9 flex items-center justify-center">
          <DepartingIcon />
        </div>
      </Card>
    </div>
  );
};

export default ArrivingAndDeparting;
