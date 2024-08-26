import { useTranslations } from 'next-intl';

import {
  ListingByType,
  NightlyBookingByListing,
  SpaceBookingByListing,
} from '../../types';
import { groupListingsByType } from '../../utils/dashboard.helpers';
import { Card } from '../ui';

interface Props {
  bookedNights: NightlyBookingByListing[];
  bookedSpaceSlots: SpaceBookingByListing[];
  isNightly: boolean;
}

const OccupancyByListing = ({
  bookedNights,
  bookedSpaceSlots,
  isNightly,
}: Props) => {
  const t = useTranslations();
  const occupancyNights = groupListingsByType(bookedNights);
  const occupancySpaces = groupListingsByType(bookedSpaceSlots);
  const occupancyByListingType = isNightly ? occupancyNights : occupancySpaces;

  return (
    <Card className="p-0 flex flex-col gap-1 h-[160px] overflow-hidden justify-start relative">
      <div className="z-1000 absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      <div className="p-2 overflow-scroll pb-10 ">
        <div className="flex justify-between gap-2 border-b pb-0.5 mb-0.5">
          <div>{t('dashboard_listing')}</div>

          <div className="text-right whitespace-nowrap">
            {t('dashboard_listing_booked')} /
            <span className="text-gray-400">
              {t('dashboard_listing_total')}
            </span>
          </div>
        </div>

        {occupancyByListingType.map((listing: ListingByType) => {
          const isNightly = 'nights' in listing;
          return (
            <div
              className="flex justify-between gap-2"
              key={listing.listingName}
            >
              <div>{listing.listingName}</div>

              <div className="text-right whitespace-nowrap">
                {isNightly ? listing.nights || 0 : listing.spaceSlots || 0} /{' '}
                <span className="text-gray-400">
                  {isNightly ? listing.totalNights || 0 : listing.totalSpaceSlots || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default OccupancyByListing;
