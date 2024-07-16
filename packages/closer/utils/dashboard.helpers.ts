import { List, Map } from 'immutable';

export const getDateRange = (
  timeFrame: string,
  fromDate: Date | string,
  toDate: Date | string,
) => {
  // TODO: make sure that times do not affect results - just dates in property timezone
  switch (timeFrame) {
    case 'today':
      return { start: new Date(), end: new Date() };
    case 'week':
      return {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
    case 'month':
      return {
        start: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
    case 'year':
      return {
        start: new Date(Date.now() - 364 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
    case 'custom':
      return {
        start: fromDate,
        end: toDate,
      };

    default:
      return { start: new Date(), end: new Date() };
  }
};

export const getTotalNumNights = (listings: List<Map<string, unknown>>) => {
  if (!listings) return 0;
  let numListings = 0;
  listings.forEach((listing: any) => {
    if (listing.get('private')) {
      numListings += listing.get('quantity');
    } else {
      numListings += listing.get('quantity') * listing.get('beds');
    }
  });
  return numListings;
};

export const getTotalNumSpaceSlots = (listings: List<Map<string, unknown>>) => {
  if (!listings) return 0;
  let numListings = 0;

  listings.forEach((listing: any) => {
    console.log('listing?.workingHoursEnd=',listing.get('workingHoursEnd'));
    const numHourSlots = listing.get('workingHoursEnd') - listing.get('workingHoursStart');

    numListings += numHourSlots
  });

  console.log('numListings hour slots', numListings);
  return numListings;
};

export const getNumBookedNights = (
  bookings: List<Map<string, unknown>>,
  listings: List<Map<string, unknown>>,
) => {
  if (!bookings || !listings) return 0;
  let numBookedNights = 0;

  const sharedListingIds = listings
    .filter((listing: any) => !listing.get('private'))
    .map((listing: any) => listing.get('_id'));

  bookings.forEach((booking: any) => {
    if (sharedListingIds.includes(booking.get('listing'))) {
      numBookedNights += booking.get('adults');
    } else {
      numBookedNights += 1;
    }
  });
  return numBookedNights;
};

export const getNumBookedSpaceSlots = (
  bookings: List<Map<string, unknown>>,
  listings: List<Map<string, unknown>>,
) => {
  if (!bookings || !listings) return 0;
  let numBookedNights = 0;

  const sharedListingIds = listings
    .filter((listing: any) => !listing.get('private'))
    .map((listing: any) => listing.get('_id'));

  bookings.forEach((booking: any) => {
    if (sharedListingIds.includes(booking.get('listing'))) {
      numBookedNights += booking.get('adults');
    } else {
      numBookedNights += 1;
    }
  });
  return numBookedNights;
};
