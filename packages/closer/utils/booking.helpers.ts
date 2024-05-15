import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import {
  BOOKING_EXISTS_ERROR,
  USER_REJECTED_TRANSACTION_ERROR,
} from '../constants';
import { User } from '../contexts/auth/types';
import {
  AccommodationUnit,
  BookingItem,
  BookingWithUserAndListing,
  CloserCurrencies,
  Listing,
  Price,
} from '../types';
import api from './api';
import { __, priceFormat } from './helpers';

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.extend(utc);
dayjs.extend(timezone);

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
  eventTotal?: number,
  useTokens?: boolean,
  useCredits?: boolean,
) => {
  if (isTeamBooking) {
    return 0;
  }
  const accommodationFiatTotal =
    useTokens || useCredits ? 0 : accomodationTotal;
  if (foodOption === 'no_food') {
    return accommodationFiatTotal + (eventTotal || 0);
  }
  return utilityTotal + accommodationFiatTotal + (eventTotal || 0);
};

export const getUtilityTotal = ({
  foodOption,
  utilityFiatVal,
  isPrivate,
  updatedAdults,
  updatedDuration,
  discountRate,
}: {
  foodOption: string;
  utilityFiatVal: number | undefined;
  isPrivate: boolean;
  updatedAdults: number;
  updatedDuration: number;
  discountRate: number;
}) => {
  if (foodOption === 'no_food') {
    return 0;
  }
  if (!utilityFiatVal) {
    return 0;
  }
  const multiplier = isPrivate ? 1 : updatedAdults;
  const total = utilityFiatVal * multiplier * updatedDuration * discountRate;
  return total;
};

export const getAccommodationTotal = (
  listing: Listing | undefined,
  useTokens: boolean,
  useCredits: boolean,
  adults: number,
  durationInDaysOrHours: number,
  discountRate: number,
  volunteerId: string | undefined,
) => {
  if (!listing) return 0;
  if (volunteerId) return 0;

  let price: number | undefined =
    useTokens || useCredits ? listing.tokenPrice?.val : listing.fiatPrice?.val;
  if (listing.priceDuration === 'hour') {
    price =
      useTokens || useCredits
        ? listing.tokenHourlyPrice?.val
        : listing.fiatHourlyPrice?.val;
    discountRate = 1;
  }

  const multiplier = listing.private ? 1 : adults;

  const total = +(
    (price || 0) *
    multiplier *
    durationInDaysOrHours *
    discountRate
  ).toFixed(2);

  return total;
};

export const getPaymentDelta = (
  total: number,
  updatedFiatTotal: number,
  useTokens: boolean,
  useCredits: boolean,
  rentalToken: Price<CloserCurrencies>,
  updatedAccomodationTotal: number,
  rentalFiatCur: CloserCurrencies,
) => {
  if (useTokens || useCredits) {
    const delta = Number(
      (updatedAccomodationTotal - rentalToken?.val).toFixed(2),
    );
    if (!delta) return null;
    return {
      credits: {
        val: useCredits ? delta : 0,
        cur: 'credits',
      },
      token: {
        val: useTokens ? delta : 0,
        cur: rentalToken?.cur,
      },
      fiat: {
        val: Number((updatedFiatTotal - total).toFixed(2)) || 0,
        cur: rentalFiatCur,
      },
    };
  }
  const delta = Number((updatedFiatTotal - total).toFixed(2));
  if (!delta) return null;
  return {
    token: { val: 0, cur: rentalToken?.cur },
    fiat: {
      val: delta || 0,
      cur: rentalFiatCur,
    },
  };
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

export const convertTimeToTimelineFormat = (
  date: Date | string | number | null,
  timeZone: string | undefined,
  browserTimezone: string | undefined,
) => {
  if (!date || !timeZone) {
    return null;
  }
  const utcDate = dayjs.utc(date);
  const localDate = utcDate.tz(timeZone);
  const browserDate = localDate.clone().tz(browserTimezone);

  const offsetFromTimeZoneToBrowser =
    browserDate.utcOffset() - localDate.utcOffset();
  const adjustedDate = browserDate.subtract(
    offsetFromTimeZoneToBrowser,
    'minute',
  );

  return adjustedDate.toDate();
};

export const getBookingsWithUserAndListing = ({
  bookings,
  listings,
  allUsers,
  TIME_ZONE,
  browserTimezone,
}: {
  bookings: any;
  listings: any;
  allUsers: any;
  TIME_ZONE: string;
  browserTimezone: string;
}) => {
  if (!bookings) return [];
  return bookings.map((b: any) => {
    const adults = b.get('adults') ?? 0;
    const children = b.get('children') ?? 0;
    const infants = b.get('infants') ?? 0;
    const start = b.get('start');
    const end = b.get('end');
    const localEnd = convertTimeToTimelineFormat(
      end,
      TIME_ZONE,
      browserTimezone,
    );

    const localStart = convertTimeToTimelineFormat(
      start,
      TIME_ZONE,
      browserTimezone,
    );
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

export const getDateOnly = (date: Date | undefined | null | string) => {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DD');
};

export const getTimeOnly = (date: Date | undefined | null | string) => {
  if (!date) return null;
  return dayjs(date).format('HH:mm');
};

export const getDateStringWithoutTimezone = (
  dateOnly: string | undefined,
  time: string | null,
) => {
  if (!dateOnly || !time) return null;
  return dayjs(`${dateOnly} ${time}`).format('YYYY-MM-DD HH:mm');
};

export const getTimeOptions = (
  workingHoursStart: number | undefined,
  workingHoursEnd: number | undefined,
  timeZone: string | undefined,
) => {
  if (!workingHoursStart || !workingHoursEnd || !timeZone) {
    return null;
  }
  return Array.from(
    { length: workingHoursEnd - workingHoursStart + 1 },
    (_, hour) =>
      dayjs()
        .tz(timeZone)
        .hour(hour + workingHoursStart)
        .minute(0)
        .format('HH:00'),
  );
};

export const getLocalTimeAvailability = (
  availability: { hour: string; isAvailable: boolean }[],
  timeZone: string | undefined,
) => {
  const DEFAULT_TIMEZONE = 'UTC';

  return availability?.map((time) => {
    const localTime = dayjs
      .utc(`1970-01-01T${time.hour}:00Z`)
      .tz(timeZone || DEFAULT_TIMEZONE)
      .format('HH:mm');

    return { hour: localTime, isAvailable: time.isAvailable };
  });
};

export const dateToPropertyTimeZone = (
  timeZone: string,
  date: string | Date,
) => {
  return dayjs.utc(date).tz(timeZone).format('YYYY-MM-DD HH:mm');
};
export const payTokens = async (
  bookingId: string | undefined,
  dailyRentalTokenVal: number | undefined,
  stakeTokens: (dailyValue: number) => Promise<
    | {
        error: null;
        success: {
          transactionId: string;
        };
      }
    | {
        error: unknown;
        success: null;
      }
    | undefined
  >,

  checkContract: () => Promise<
    | {
        success: boolean;
        error: null;
      }
    | {
        success: boolean;
        error: string;
      }
    | undefined
  >,
) => {
  if (!dailyRentalTokenVal)
    return { error: 'No daily rental token value provided', success: null };
  if (!bookingId) return { error: 'No bookingId provided', success: null };

  const { success: stakingSuccess, error: stakingError } = (await stakeTokens(
    dailyRentalTokenVal,
  )) as
    | {
        error: null;
        success: {
          transactionId: string;
        };
      }
    | {
        error: any;
        success: null;
      };

  const { success: isBookingMatchContract, error: nightsRejected } =
    (await checkContract()) as
      | {
          success: boolean;
          error: null;
        }
      | {
          success: boolean;
          error: string;
        };

  const error = stakingError || nightsRejected;
  console.log('stakingError=', stakingError);
  console.log('nightsRejected=', nightsRejected);
  console.log('error reason=', error?.reason);

  if (error?.reason.trim() === USER_REJECTED_TRANSACTION_ERROR) {
    console.log('User rejected transaction!!!!!');
    return { error: 'User rejected transaction', success: null };
  }
  if (error?.reason.trim() === BOOKING_EXISTS_ERROR) {
    return { error: 'Booking for these dates already exists', success: null };
  }
  if (error) {
    console.log('TOKEN PAYMENT ERROR=', error);
    return { error: 'Token payment failed.', success: null };
  }

  if (stakingSuccess?.transactionId && isBookingMatchContract) {
    await api.post(`/bookings/${bookingId}/token-payment`, {
      transactionId: stakingSuccess.transactionId,
    });
    return { success: true, error: null };
  }
};
