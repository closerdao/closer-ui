import { useTranslations } from 'next-intl';

import {
  getTotalNumNights,
  getTotalNumSpaceSlots,
} from '../../utils/dashboard.helpers';
import HospitalityIcon from '../icons/HospitalityIcon';
import SpacesIcon from '../icons/SpacesIcon';
import { Card, Heading } from '../ui';
import ArrivingAndDeparting from './ArrivingAndDeparting';
import { formatThousands } from '../../utils/dashboard.helpers';
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
    (listings && spaceListings && getTotalNumSpaceSlots(spaceListings) * duration) || 0;

  const calculateOccupancy = (booked: number, total: number): string => {
    if (total === 0 || !total || !Number.isFinite(total)) {
      return '0';
    }
    const percentage = (booked / total) * 100;
    if (!Number.isFinite(percentage)) {
      return '0';
    }
    return percentage.toFixed(1);
  };

  const hospitalityOccupancy = calculateOccupancy(numBookedNights || 0, totalNumNights);
  const spaceOccupancy = calculateOccupancy(numBookedSpaceSlots || 0, totalNumSpaceSlots);

  const bookedCount = isNightly ? (numBookedNights || 0) : (numBookedSpaceSlots || 0);
  const totalCapacity = isNightly ? totalNumNights : totalNumSpaceSlots;
  
  const hasNoBookings = bookedCount === 0;
  const hasNoListings = totalCapacity === 0 && bookedCount === 0;

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

      {hasNoListings ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          {t('dashboard_no_listings_available')}
        </div>
      ) : hasNoBookings ? (
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-gray-500 text-sm">{t('dashboard_no_bookings_yet')}</p>
          {totalCapacity > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {formatThousands(totalCapacity)}{' '}
              {isNightly ? t('dashboard_nights') : t('dashboard_booking_slots')} {t('dashboard_available')}
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-3 justify-between items-end text-sm">
          <div>
            {totalCapacity > 0 ? (
              <>
                <p className="text-2xl font-bold">
                  {isNightly ? hospitalityOccupancy : spaceOccupancy}%
                </p>
                <p>{t('dashboard_booked')}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">{formatThousands(bookedCount)}</p>
                <p>{isNightly ? t('dashboard_nights') : t('dashboard_booking_slots')}</p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1 ">
            {totalCapacity > 0 && (
              <div>
                <span className="text-xl">
                  {formatThousands(bookedCount)} / {formatThousands(totalCapacity)}
                </span>{' '}
                {isNightly ? t('dashboard_nights') : t('dashboard_booking_slots')}
              </div>
            )}
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
      )}
    </Card>
  );
};

export default OccupancyCard;
