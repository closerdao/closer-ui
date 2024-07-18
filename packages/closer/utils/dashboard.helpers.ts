import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { List, Map } from 'immutable';

import { dateToPropertyTimeZone } from './booking.helpers';

dayjs.extend(utc);
dayjs.extend(timezone);

const toEndOfDay = (date: Date | string, timeZone: string) => {
  const dateOnly = dayjs(date).format('YYYY-MM-DD');
  const endOfZonedDay = dayjs.tz(dateOnly, timeZone).endOf('day');
  return endOfZonedDay.toDate();
};

const toStartOfDay = (date: Date | string, timeZone: string) => {
  const dateOnly = dayjs(date).format('YYYY-MM-DD');
  const startOfZonedDay = dayjs.tz(dateOnly, timeZone).startOf('day');
  return startOfZonedDay.toDate();
};

export const getDateRange = ({
  timeFrame,
  fromDate,
  toDate,
  timeZone,
}: {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
  timeZone: string;
}) => {
  switch (timeFrame) {
    case 'today':
      return {
        start: toStartOfDay(new Date(), timeZone),
        end: toEndOfDay(new Date(), timeZone),
      };
    case 'week':
      return {
        start: toStartOfDay(dayjs().subtract(6, 'day').toDate(), timeZone),
        end: toEndOfDay(new Date(), timeZone),
      };
    case 'month':
      return {
        start: toStartOfDay(dayjs().subtract(1, 'month').subtract(1, 'day').toDate(), timeZone),
        end: toEndOfDay(new Date(), timeZone),
      };
    case 'year':
      return {
        start: toStartOfDay(dayjs().subtract(1, 'year').subtract(1, 'day').toDate(), timeZone),
        end: toEndOfDay(new Date(), timeZone),
      };
    case 'custom':
      return {
        start:
          fromDate && toDate ? toStartOfDay(fromDate, timeZone) : new Date(),
        end: toDate && fromDate ? toEndOfDay(toDate, timeZone) : new Date(),
      };

    default:
      return {
        start: toStartOfDay(new Date(), timeZone),
        end: toEndOfDay(new Date(), timeZone),
      };
  }
};

export const getTotalNumNights = (listings: List<Map<string, unknown>>) => {
  if (!listings) return 0;


  // console.log('listings=',listings && listings.toJS());
  let numListings = 0;
  listings?.forEach((listing: any) => {
    if (listing?.get('private')) {
      numListings += listing.get('quantity');
    } else {
      numListings += listing.get('quantity') * listing?.get('beds');
    }
  });
  return numListings;
};

export const getTotalNumSpaceSlots = (listings: List<Map<string, unknown>>) => {
  if (!listings) return 0;
  let numListings = 0;

  listings.forEach((listing: any) => {
    const numHourSlots =
      listing.get('workingHoursEnd') - listing.get('workingHoursStart');

    numListings += numHourSlots;
  });

  return numListings;
};

function calculateOverlappingNights(
  rangeStart: Date | null,
  rangeEnd: Date | null,
  bookingStart: Date | null,
  bookingEnd: Date | null,
): number {

  if (!bookingStart || !bookingEnd || !rangeStart || !rangeEnd) {
    return 0;
  }

  console.log('rangeStart=', rangeStart);
  console.log('rangeEnd=', rangeEnd);

  const overlapStart = new Date(Math.max(bookingStart.getTime(), rangeStart.getTime()));
  const overlapEnd = new Date(Math.min(bookingEnd.getTime(), rangeEnd.getTime()));

  const diffTime = Math.max(overlapEnd.getTime() - overlapStart.getTime(), 0);
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // If guest is leaving within date range, we do not count this last day as a booked night
  if (bookingEnd.getTime() <= rangeEnd.getTime()) {
    diffDays -= 1;
  }

  return diffDays;
}

export const getBookedNights = (
  bookings: List<Map<string, unknown>>,
  listings: List<Map<string, unknown>>,
  start: Date | null,
  end: Date | null,
) => {
  // question: if guest left, do we count this last day as a booked night? makes sense to not count it

  if (!bookings || !listings) return [];
  const bookedNights: any[] = [];
  let numBookedNights= 0
  
  bookings.forEach((booking: any) => {
    const listing = listings.find((listing: any) => listing.get('_id') === booking.get('listing'));
    const listingName = listing && listing.get('name');
    const numOverlappingNights = calculateOverlappingNights(start, end, new Date(booking.get('start')), new Date(booking.get('end')));

    // numBookedNights += numOverlappingNights;
    booking.get('roomOrBedNumbers').map((roomOrBedNumber: any) => { 
      bookedNights.push({
        listingName,
        roomOrBedNumber,
        nights: numOverlappingNights,
      });
      numBookedNights +=1
    });

  });

  console.log('bookedNights=',bookedNights);
  return { bookedNights, numBookedNights};
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

export const getBookingsWithRoomInfo = (
  bookings: any,
  listings: any,
  timeZone: string,
) => {
  const bookingsWithRoomInfo: any[] = [];
  bookings &&
    bookings.forEach((booking: any) => {
      const listing = listings.find(
        (l: any) => l.get('_id') === booking.get('listing'),
      );

      booking.get('roomOrBedNumbers').map((roomOrBedNumber: any) => {
        const doesCheckoutToday = dayjs().isSame(
          dayjs(dateToPropertyTimeZone(timeZone, booking.get('end'))),
          'day',
        );
        bookingsWithRoomInfo.push({
          room: listing.get('name') + ' ' + roomOrBedNumber,
          doesCheckoutToday,
          period:
            !listing.get('priceDuration') ||
            listing.get('priceDuration') !== 'hour'
              ? 'night'
              : dayjs(
                  dateToPropertyTimeZone(timeZone, booking.get('start')),
                ).format('HH:mm') +
                ' - ' +
                dayjs(
                  dateToPropertyTimeZone(timeZone, booking.get('end')),
                ).format('HH:mm'),
        });
      });
    });
  return bookingsWithRoomInfo;
};

export const getDuration = (
  timeFrame: string,
  fromDate?: Date | string,
  toDate?: Date | string,
) => {
  switch (timeFrame) {
    case 'today':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 28;
    case 'year':
      return 364;
    case 'custom':
      return fromDate && toDate ? dayjs(toDate).diff(fromDate, 'day') + 1 : 1;
    default:
      return 1;
  }
};
