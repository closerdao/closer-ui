import { useTranslations } from 'next-intl';

import {
  getNumBookedNights,
  getNumBookedSpaceSlots,
  getTotalNumNights,
  getTotalNumSpaceSlots,
} from '../../utils/dashboard.helpers';
import HospitalityIcon from '../icons/HospitalityIcon';
import SpacesIcon from '../icons/SpacesIcon';
import { Card, Heading } from '../ui';

interface Props {
  isNightly: boolean;
  nightlyListings: any;
  listings: any;
  nightlyBookings: any;
  spaceBookings: any;
  spaceListings: any;
  duration: number;
}

const OccupancyCard = ({
  isNightly,
  nightlyListings,
  listings,
  nightlyBookings,
  spaceBookings,
  spaceListings,
  duration
}: Props) => {
  const t = useTranslations();

  const totalNumNights = listings && getTotalNumNights(nightlyListings) * duration || 0;
  const totalNumSpaceSlots = listings && spaceListings && getTotalNumSpaceSlots(spaceListings) * duration;
  console.log('totalNumSpaceSlots=',totalNumSpaceSlots);

  const numBookedNights = getNumBookedNights(nightlyBookings, nightlyListings);
  const numBookedSpaceSlots = getNumBookedSpaceSlots(
    spaceBookings,
    spaceListings,
  ) ;
  const hospitalityOccupancy = (
    (numBookedNights / totalNumNights) *
    100
  ).toFixed(1);

  const spaceOccupancy = (
    (numBookedSpaceSlots / totalNumSpaceSlots) *
    100
  ).toFixed(1);

  return (
    <Card className="p-2 bg-neutral-light flex flex-col">
      <div className="flex gap-1 justify-between">
        <Heading
          level={3}
          className={`uppercase text-sm ${
            isNightly ? 'text-accent' : 'text-accent-alt'
          } `}
        >
          {isNightly
            ? t('dashboard_hospitality_occupancy')
            : t('dashboard_spaces_occupancy')}
        </Heading>
        <div
          className={` ${
            isNightly ? 'bg-accent' : 'bg-accent-alt'
          } flex-shrink-0  rounded-md w-9 h-9 flex items-center justify-center`}
        >
          {isNightly ? <HospitalityIcon /> : <SpacesIcon />}
        </div>
      </div>

      <div className="flex gap-1 justify-between items-end text-sm">
        <div>
          <p className="text-2xl font-bold">
            {isNightly ? hospitalityOccupancy : spaceOccupancy}%
          </p>
          <p> {t('dashboard_booked')}</p>
        </div>
        <div>
          <span className="text-xl">
            {isNightly ? totalNumNights : totalNumSpaceSlots}
          </span>{' '}
          {isNightly ? t('dashboard_nights') : t('dashboard_booking_slots')}
        </div>
      </div>
    </Card>
  );
};

export default OccupancyCard;
