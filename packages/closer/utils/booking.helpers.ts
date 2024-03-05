import dayjs from 'dayjs';

import { User } from '../contexts/auth/types';
import {
  AccommodationUnit,
  BookingItem,
  BookingWithUserAndListing,
  Listing,
} from '../types';
import { __, priceFormat } from './helpers';

export const getStatusText = (status: string, updated: string | Date) => {
  if (status === 'cancelled') {
    return __('booking_status_cancelled', dayjs(updated).format('DD/MM/YYYY'));
  }

  interface StatusText {
    [key: string]: string;
  }

  const statusText: StatusText = {
    rejected: __('booking_status_rejected'),
    open: __('booking_status_open'),
    pending: __('booking_status_pending'),

    confirmed: __('booking_status_confirmed'),
    paid: __('booking_status_paid'),

    'checked-in': __('booking_status_checked_in'),
    'checked-out': __('booking_status_checked_out'),
  };

  return statusText[status];
};

export const getBookingType = (
  eventId: string | undefined,
  volunteerId: string | undefined,
) => {
  if (eventId) {
    return '🎉 Event';
  }
  if (volunteerId) {
    return '💪🏽 Volunteer';
  }
  return '🏡 Stay';
};

export const getFiatTotal = (
  isTeamBooking: boolean,
  foodOption: string,
  utilityTotal: number,
  accomodationTotal: number,
) => {
  if (isTeamBooking) {
    return 0;
  }
  if (foodOption === 'no_food') {
    return accomodationTotal;
  }
  return utilityTotal + accomodationTotal;
};

export const formatListings = (listings: Listing[]) => {
  const formattedListings: { name: string; id: string }[] = [];
  listings.forEach((listing: Listing) => {
    if (listing.private) {
      for (let i = 0; i < listing.quantity; i++) {
        formattedListings.push({
          name: listing.name + ' ' + (i + 1),
          id: listing._id,
        });
      }
    } else {
      for (let i = 0; i < listing.quantity; i++) {
        for (let j = 0; j < listing.beds; j++) {
          formattedListings.push({
            name: `${listing.name} bed ${i * listing.beds + j + 1}`,
            id: listing._id,
          });
        }
      }
    }
  });
  return formattedListings;
};

export const convertTimeToPropertyTimezone = (date: Date | string | number) => {
  const localDate = new Date(date);
  localDate.setHours(localDate.getUTCHours());
  localDate.setMinutes(localDate.getUTCMinutes());
  return localDate;
};

export const getBookingsWithUserAndListing = (
  bookings: any,
  listings: any,
  allUsers: any,
) => {
  if (!bookings) return [];
  return bookings.map((b: any) => {
    const adults = b.get('adults') ?? 0;
    const children = b.get('children') ?? 0;
    const infants = b.get('infants') ?? 0;
    const start = new Date(b.get('start'));
    const end = new Date(b.get('end'));
    const localEnd = convertTimeToPropertyTimezone(end);
    const localStart = convertTimeToPropertyTimezone(start);
    const doesNeedPickup = b.get('doesNeedPickup') ?? false;
    const status = b.get('status') ?? 'unknown';
    const fiatPriceVal = b.get('rentalFiat')?.get('val') ?? 0;
    const fiatPriceCur = b.get('rentalFiat')?.get('cur') ?? 0;

    const listingId = b.get('listing');
    const listingName =
      listings
        ?.find((listing: any) => listing.get('_id') === listingId)
        ?.get('name') || __('no_listing_type');

    const userId = b.get('createdBy');
    const user =
      allUsers && allUsers.toJS().find((user: User) => user._id === userId);

    const userInfo = user && {
      name: user.screenname,
    };

    return {
      _id: b.get('_id'),
      start: localStart,
      end: localEnd,
      adults,
      children,
      infants,
      listingName,
      userInfo,
      userId,
      doesNeedPickup,
      status,
      listingId,
      fiatPriceVal,
      fiatPriceCur,
    };
  });
};

export const generateBookingItems = (
  bookingsWithUserAndListing: BookingWithUserAndListing[],
  accommodationUnits: AccommodationUnit[],
): BookingItem[] => {
  const bookingItems: BookingItem[] = [];
  const lastAssignedUnitIdForListing: { [listingId: string]: number } = {};

  bookingsWithUserAndListing.forEach((booking) => {
    const matchedUnits = accommodationUnits.filter(
      (unit) => unit.listingId === booking.listingId,
    );
    let assignedUnitId: number | undefined;

    for (const unit of matchedUnits) {
      if (
        lastAssignedUnitIdForListing[booking.listingId] === undefined ||
        unit.id > lastAssignedUnitIdForListing[booking.listingId]
      ) {
        assignedUnitId = unit.id;
        lastAssignedUnitIdForListing[booking.listingId] = unit.id;
        break;
      }
    }

    if (assignedUnitId === undefined && matchedUnits.length > 0) {
      assignedUnitId = matchedUnits[0].id;
      lastAssignedUnitIdForListing[booking.listingId] = matchedUnits[0].id;
    }

    if (assignedUnitId !== undefined) {
      bookingItems.push({
        id: booking._id,
        group: assignedUnitId,
        title: `${booking.userInfo ? booking?.userInfo?.name : ''} ${
          booking.adults > 1 ? ' + ' + (booking.adults - 1) : ''
        }  ${
          booking.fiatPriceVal && booking.fiatPriceCur
            ? priceFormat(booking.fiatPriceVal, booking.fiatPriceCur)
            : ''
        }`,
        start_time: dayjs(booking.start).toDate(),
        end_time: dayjs(booking.end).toDate(),
      });
    }
  });

  return bookingItems;
};

export const getFilterAccommodationUnits = (
  accommodationUnits: {
    id: number;
    title: string;
    listingId: string;
  }[],
  groupsWithBookings: number[],
) => {
  const updatedUnits = accommodationUnits.filter((unit: any) => {
    return groupsWithBookings.includes(unit.id);
  });
  return updatedUnits;
};
