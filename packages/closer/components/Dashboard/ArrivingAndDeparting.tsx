import { useTranslations } from 'next-intl';

interface Props {
  arrivingBookings: any;
  departingBookings: any;
  nightlyListings: any;
  nightlyListingsIds: string[];
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
    <div className=" ">
      <p className="">
        {arrivingNightlyBookings && arrivingNightlyBookings.size}{' '}
        <span className="text-gray-400"> {t('dashboard_arriving')}</span>
      </p>

      <p className="">
        {departingNightlyBookings && departingNightlyBookings.size}{' '}
        <span className="text-gray-400"> {t('dashboard_departing')}</span>
      </p>
    </div>
  );
};

export default ArrivingAndDeparting;
