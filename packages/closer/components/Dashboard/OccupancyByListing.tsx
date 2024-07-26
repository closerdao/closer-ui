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
}

const OccupancyByListing = ({ bookedNights, bookedSpaceSlots }: Props) => {
  const mergedBooked = [...bookedNights, ...bookedSpaceSlots];

  const occupancyByListingType = groupListingsByType(mergedBooked);
  return (
    <Card className="p-0 flex flex-col gap-1 h-[160px] overflow-hidden justify-start relative">
      <div className="z-1000 absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      <div className="p-2 overflow-scroll pb-10">
        {occupancyByListingType.map((listing: ListingByType) => {
          const isNightly = 'nights' in listing;
          return (
            <div
              className="flex justify-between gap-2"
              key={listing.listingName}
            >
              <div>{listing.listingName}</div>

              <div className="text-right whitespace-nowrap">
                {isNightly ? listing.nights : listing.spaceSlots} /{' '}
                <span className="text-gray-400">
                  {isNightly ? listing.totalNights : listing.totalSpaceSlots}
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
