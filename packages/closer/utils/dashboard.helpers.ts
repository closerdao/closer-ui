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

export const getTotalNumListings = (listings: any) => {
  // excluding spaces booked by hour slots
  if (!listings) return 0;
  let numListings = 0;
  listings.forEach((listing: any) => {
    if (
      !listing.get('priceDuration') ||
      listing.get('priceDuration') !== 'night'
    ) {
      return;
    }
    if (listing.get('private')) {
      numListings += listing.get('quantity');
    } else {
      numListings += listing.get('quantity') * listing.get('beds');
    }
  });
  return numListings;
};
