import { useTranslations } from 'next-intl';

import {
  getTotalNumNights,
  getTotalNumSpaceSlots,
} from '../../utils/dashboard.helpers';
import HospitalityIcon from '../icons/HospitalityIcon';
import SpacesIcon from '../icons/SpacesIcon';
import { Card, Heading } from '../ui';
import ArrivingAndDeparting from './ArrivingAndDeparting';

interface Props {
  isNightly: boolean;
  nightlyListings: any;
  spaceListings: any;
  listings: any;
  duration: number;
  numBookedNights?: number;
  numBookedSpaceSlots?: number;
  arrivingBookings?: any;
  departingBookings?: any;
  nightlyListingsIds?: string[];
  timeFrame?: string;
}

const OccupancyCard = ({
  isNightly,
  nightlyListings,
  spaceListings,
  listings,
  duration,
  numBookedNights,
  numBookedSpaceSlots,
  arrivingBookings,
  departingBookings,
  nightlyListingsIds,
  timeFrame,
}: Props) => {
  const t = useTranslations();

  const totalNumNights =
    (listings && getTotalNumNights(nightlyListings) * duration) || 0;

  const totalNumSpaceSlots =
    listings &&
    spaceListings &&
    getTotalNumSpaceSlots(spaceListings) * duration;

  const hospitalityOccupancy = (
    ((numBookedNights || 0) / totalNumNights) *
    100
  ).toFixed(1);

  const spaceOccupancy = (
    ((numBookedSpaceSlots || 0) / totalNumSpaceSlots) *
    100
  ).toFixed(1);

  return (
    <Card className="p-2 flex flex-col h-[160px] ">
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
          {isNightly ? <HospitalityIcon color="white" /> : <SpacesIcon />}
        </div>
      </div>

      <div className="flex gap-1 justify-between items-end text-sm">
        <div>
          <p className="text-2xl font-bold">
            {isNightly ? hospitalityOccupancy : spaceOccupancy}%
          </p>
          <p> {t('dashboard_booked')}</p>
        </div>

        <div className="flex flex-col gap-1">
          <div>
            <span className="text-xl">
              {isNightly ? totalNumNights : totalNumSpaceSlots}
            </span>{' '}
            {isNightly ? t('dashboard_nights') : t('dashboard_booking_slots')}
          </div>
          {(timeFrame === 'today' || duration === 1) && nightlyListingsIds && (
            <ArrivingAndDeparting
              arrivingBookings={arrivingBookings}
              departingBookings={departingBookings}
              nightlyListings={nightlyListings}
              nightlyListingsIds={nightlyListingsIds}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default OccupancyCard;
