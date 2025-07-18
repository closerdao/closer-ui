import { format, toZonedTime } from 'date-fns-tz';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import {
  BOOKING_EXISTS_ERROR,
  CURRENCIES,
  USER_REJECTED_TRANSACTION_ERROR,
} from '../constants';
import { User } from '../contexts/auth/types';
import {
  AccommodationUnit,
  BookingItem,
  BookingWithUserAndListing,
  CloserCurrencies,
  Event,
  FiatTotalParams,
  Listing,
  PaymentType,
  Price,
  UtilityTotalParams,
} from '../types';
import { FoodOption } from '../types/food';
import api from './api';
import { priceFormat } from './helpers';

const DEFAULT_TIMEZONE = 'Europe/Berlin';

dayjs.extend(utc);
dayjs.extend(timezone);

export const getBookingType = (
  eventId: string | undefined,
  bookingType: 'volunteer' | 'residence' | undefined,
  volunteerId: string | undefined,
) => {
  if (eventId) {
    return '🎉 Event';
  }
  if (bookingType === 'volunteer' || volunteerId) {
    return '💪🏽 Volunteer';
  }
  if (bookingType === 'residence') {
    return '💪🏽 Residence';
  }
  return '🏡 Stay';
};

export const getFiatTotal = ({
  isTeamBooking,
  eventTotal,
  utilityTotal,
  foodTotal,
  accommodationFiatTotal,
  useTokens,
  useCredits,
}: FiatTotalParams) => {
  if (isTeamBooking) {
    return 0;
  }
  const accommodationTotal =
    useTokens || useCredits ? 0 : accommodationFiatTotal;

  return (
    utilityTotal + (foodTotal || 0) + accommodationTotal + (eventTotal || 0)
  );
};

export const getUtilityTotal = ({
  utilityFiatVal,
  updatedAdults,
  updatedDuration,
  discountRate,
  isTeamBooking,
  isUtilityOptionEnabled,
}: UtilityTotalParams) => {
  if (isTeamBooking || !utilityFiatVal || !isUtilityOptionEnabled) {
    return 0;
  }
  const total = utilityFiatVal * updatedAdults * updatedDuration * discountRate;
  return total;
};

// a better idea is recalculate booking price on backend, so that price calculation logic is in one place
export const getAccommodationTotal = ({
  listing,
  useTokens,
  useCredits,
  adults,
  durationInDaysOrHours,
  discountRate,
  volunteerId,
  isTeamBooking,
}: {
  listing: Listing | undefined;
  useTokens: boolean;
  useCredits: boolean;
  adults: number;
  durationInDaysOrHours: number;
  discountRate: number;
  volunteerId: string | undefined;
  isTeamBooking: boolean | undefined;
}) => {
  if (!listing || volunteerId || isTeamBooking) return 0;

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
        ?.get('name') || 'None, day ticket';

    const userId = b.get('createdBy');
    const user =
      allUsers && allUsers.toJS().find((user: User) => user._id === userId);

    const userInfo = user && {
      name: user.screenname,
    };

    const roomOrBedNumbers = b.get('roomOrBedNumbers').toJS() ?? undefined;
    const adminBookingReason = b.get('adminBookingReason') || null;

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
      roomOrBedNumbers,
      adminBookingReason,
    };
  });
};

const getBookingTitleForCalendar = (booking: BookingWithUserAndListing) => {
  const userName = booking.userInfo?.name || '';
  const additionalGuests = booking.adults > 1 ? ` + ${booking.adults - 1}` : '';
  const formattedPrice =
    booking.fiatPriceVal && booking.fiatPriceCur
      ? priceFormat(booking.fiatPriceVal, booking.fiatPriceCur)
      : '';
  if (booking?.adminBookingReason) {
    return `${booking.adminBookingReason} by ${userName}`;
  }

  return `${userName}${additionalGuests} ${formattedPrice}`;
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

    const roomOrBedNumbers = booking.roomOrBedNumbers || 1;

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
      if (!booking.roomOrBedNumbers || booking.roomOrBedNumbers.length === 0) {
        bookingItems.push({
          id: booking._id,
          group: assignedUnitId,
          title: getBookingTitleForCalendar(booking),
          start_time: dayjs(booking.start).toDate(),
          end_time: dayjs(booking.end).toDate(),
        });
      }

      if (Array.isArray(roomOrBedNumbers) && roomOrBedNumbers?.length > 1) {
        // multiple beds in shared accommodation
        roomOrBedNumbers.forEach((roomOrBedNumber, index) => {
          bookingItems.push({
            id: booking._id + index,
            group: matchedUnits[0].id + roomOrBedNumber - 1,
            title: getBookingTitleForCalendar(booking),
            start_time: dayjs(booking.start).toDate(),
            end_time: dayjs(booking.end).toDate(),
            roomOrBedNumbers: booking.roomOrBedNumbers,
          });
        });
      }
      if (Array.isArray(roomOrBedNumbers) && roomOrBedNumbers?.length === 1) {
        // private accommodation unit or single bed in shared accommodation
        bookingItems.push({
          id: booking._id,
          // group: assignedUnitId,
          group: booking.roomOrBedNumbers
            ? matchedUnits[0].id +
              (Array.isArray(roomOrBedNumbers) ? roomOrBedNumbers[0] : 1) -
              1
            : assignedUnitId,
          start_time: dayjs(booking.start).toDate(),
          end_time: dayjs(booking.end).toDate(),
          roomOrBedNumbers: booking.roomOrBedNumbers,
          title: getBookingTitleForCalendar(booking),
        });
      }
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
    const [hours, minutes] = time?.hour?.split(':').map(Number) || [0, 0];
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);

    const zonedDate = toZonedTime(date, timeZone || DEFAULT_TIMEZONE);
    const localTime = format(zonedDate, 'HH:mm', {
      timeZone: timeZone || DEFAULT_TIMEZONE,
    });

    return { hour: localTime, isAvailable: time.isAvailable };
  });
};

export const dateToPropertyTimeZone = (
  timeZone: string,
  date: string | Date | null | undefined,
) => {
  if ((typeof date !== 'string' && !(date instanceof Date)) || !date) {
    return null;
  }
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
  bookingStatus?: string,
) => {
  if (!dailyRentalTokenVal)
    return { error: 'No daily rental token value provided', success: null };
  if (!bookingId) return { error: 'No bookingId provided', success: null };

  // If booking status is already 'tokens-staked', skip token payment
  if (bookingStatus === 'tokens-staked') {
    return { success: true, error: null };
  }

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

export const formatCheckinDate = (
  date: Date | string | null,
  TIME_ZONE: string,
  checkinTime: number | undefined,
) => {
  const localDate = dayjs.tz(date || new Date(), TIME_ZONE || DEFAULT_TIMEZONE);
  const localTime = localDate
    .hour(Number(checkinTime) || 16)
    .minute(0)
    .second(0)
    .millisecond(0);
  return localTime;
};

export const formatCheckoutDate = (
  date: Date | string | null,
  TIME_ZONE: string,
  checkoutTime: number | undefined,
) => {
  if (!date) return;
  const localDate = dayjs.tz(date, TIME_ZONE);
  const localTime = localDate
    .hour(Number(checkoutTime) || 11)
    .minute(0)
    .second(0)
    .millisecond(0);
  return localTime;
};

export const addOneHour = (time: string) => {
  if (String(Number(time.substring(0, 2)) + 1).length === 1) {
    return String('0' + (Number(time.substring(0, 2)) + 1) + ':00');
  }
  return String(Number(time.substring(0, 2)) + 1 + ':00');
};
interface FoodTotalParams {
  isHourlyBooking: boolean;
  foodPrice: number;
  durationInDays: number;
  adults: number;
  isFoodOptionEnabled: boolean;
  isTeamMember: boolean;
}

export const getFoodTotal = ({
  isHourlyBooking,
  foodPrice,
  durationInDays,
  adults,
  isFoodOptionEnabled,
  isTeamMember,
}: FoodTotalParams) => {
  if (isHourlyBooking || !isFoodOptionEnabled || isTeamMember || !foodPrice)
    return 0;
  return foodPrice * adults * durationInDays;
};

export const getFoodOption = ({
  eventId,
  event,
  foodOptions,
}: {
  eventId: string | undefined;
  event: Event | undefined;
  foodOptions: FoodOption[];
}) => {
  const defaultFoodOption =
    foodOptions.find((option) => option.isDefault) || foodOptions[0];
  if (!eventId || !event || !event?.foodOptionId) return defaultFoodOption;

  if (event?.foodOptionId) {
    const foodOption = foodOptions.find(
      (option) => option._id === event?.foodOptionId,
    );
    return foodOption || defaultFoodOption;
  }
  return defaultFoodOption;
};

export const convertToDateString = (date: string | Date | null) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '';
};

export const getPaymentType = ({
  useCredits,
  duration,
  currency,
  maxNightsToPayWithTokens,
  maxNightsToPayWithCredits,
}: {
  useCredits: boolean;
  duration: number;
  currency: CloserCurrencies;
  maxNightsToPayWithTokens: number;
  maxNightsToPayWithCredits: number;
}): PaymentType => {
  let localPaymentType: PaymentType = PaymentType.FIAT;

  if (currency === CURRENCIES[0]) {
    if (
      maxNightsToPayWithCredits > 0 &&
      maxNightsToPayWithCredits < (duration || 0) &&
      useCredits
    ) {
      localPaymentType = PaymentType.PARTIAL_CREDITS;
    } else if (maxNightsToPayWithCredits >= (duration || 0) && useCredits) {
      localPaymentType = PaymentType.FULL_CREDITS;
    } else {
      localPaymentType = PaymentType.FIAT;
    }
  } else if (currency === CURRENCIES[1]) {
    if (
      maxNightsToPayWithTokens > 0 &&
      maxNightsToPayWithTokens < (duration || 0)
    ) {
      localPaymentType = PaymentType.PARTIAL_TOKENS;
    } else if (maxNightsToPayWithTokens >= (duration || 0)) {
      localPaymentType = PaymentType.FULL_TOKENS;
    } else {
      localPaymentType = PaymentType.FULL_TOKENS;
    }
  }

  return localPaymentType;
};

export const getBookingPaymentType = ({
  useCredits,
  useTokens,
  rentalFiat,
}: {
  useCredits: boolean;
  useTokens: boolean;
  rentalFiat: Price<CloserCurrencies> | undefined;
}) => {
  if (useCredits && rentalFiat?.val) {
    return PaymentType.PARTIAL_CREDITS;
  } else if (useCredits && !rentalFiat?.val) {
    return PaymentType.FULL_CREDITS;
  } else if (useTokens && !rentalFiat?.val) {
    return PaymentType.FULL_TOKENS;
  } else if (useTokens && rentalFiat?.val) {
    return PaymentType.PARTIAL_TOKENS;
  } else if (!useCredits && !useTokens) {
    return PaymentType.FIAT;
  }
  return PaymentType.FIAT;
};
