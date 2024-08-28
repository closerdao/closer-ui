import axios from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ethers } from 'ethers';
import { List } from 'immutable';

import { blockchainConfig } from '../config_blockchain';
import {
  GNOSIS_SAFE_ADDRESS,
  STRIPE_AMOUNT_MULTIPLIER,
  paidStatuses,
} from '../constants';
import {
  ListingByType,
  NightlyBookingByListing,
  SpaceBookingByListing,
} from '../types';
import { SalesResult, TokenTransaction } from '../types/dashboard';
import { dateToPropertyTimeZone } from './booking.helpers';

const { BLOCKCHAIN_DAO_TOKEN } = blockchainConfig;

dayjs.extend(utc);
dayjs.extend(timezone);

export const toEndOfDay = (date: Date | string, timeZone: string) => {
  const dateOnly = dayjs(date).format('YYYY-MM-DD');
  const endOfZonedDay = dayjs.tz(dateOnly, timeZone).endOf('day');
  return endOfZonedDay.toDate();
};

export const toStartOfDay = (date: Date | string, timeZone: string) => {
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
        start: toStartOfDay(
          dayjs().subtract(1, 'month').subtract(1, 'day').toDate(),
          timeZone,
        ),
        end: toEndOfDay(new Date(), timeZone),
      };
    case 'year':
      return {
        start: toStartOfDay(
          dayjs().subtract(1, 'year').subtract(1, 'day').toDate(),
          timeZone,
        ),
        end: toEndOfDay(new Date(), timeZone),
      };
    case 'allTime':
      return {
        start:
          fromDate && toDate ? toStartOfDay(fromDate, timeZone) : new Date(),
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

const calculateOverlappingNights = (
  rangeStart: Date | null,
  rangeEnd: Date | null,
  bookingStart: Date | null,
  bookingEnd: Date | null,
): number => {
  if (!bookingStart || !bookingEnd || !rangeStart || !rangeEnd) {
    return 0;
  }

  const overlapStart = new Date(
    Math.max(bookingStart.getTime(), rangeStart.getTime()),
  );
  const overlapEnd = new Date(
    Math.min(bookingEnd.getTime(), rangeEnd.getTime()),
  );

  const diffTime = Math.max(overlapEnd.getTime() - overlapStart.getTime(), 0);
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // If guest is leaving within date range, we do not count this last day as a booked night
  if (bookingEnd.getTime() <= rangeEnd.getTime()) {
    diffDays -= 1;
  }

  return diffDays;
};

function groupByListingAndRoom(
  ListingWithNumber: Array<SpaceBookingByListing>,
): Array<SpaceBookingByListing> {
  const grouped = ListingWithNumber.reduce(
    (acc, { listingName, roomOrBedNumber, spaceSlots, totalSpaceSlots }) => {
      const key = `${listingName}-${roomOrBedNumber}`;
      if (!acc[key]) {
        acc[key] = {
          listingName,
          roomOrBedNumber,
          spaceSlots: 0,
          totalSpaceSlots,
        };
      }
      acc[key].spaceSlots += spaceSlots;
      return acc;
    },
    {} as Record<string, SpaceBookingByListing>,
  );

  return Object.values(grouped);
}

function groupNightlyByListingAndRoom(
  ListingWithNumber: Array<NightlyBookingByListing>,
): Array<NightlyBookingByListing> {
  const grouped = ListingWithNumber.reduce(
    (acc, { listingName, roomOrBedNumber, nights, totalNights }) => {
      const key = `${listingName}-${roomOrBedNumber}`;

      if (!acc[key]) {
        acc[key] = { listingName, roomOrBedNumber, nights: 0, totalNights };
      }
      acc[key].nights += nights;
      return acc;
    },
    {} as Record<string, NightlyBookingByListing>,
  );

  return Object.values(grouped);
}

export const getBookedNights = ({
  nightlyBookings,
  nightlyListings,
  start,
  end,
  duration,
  TIME_ZONE,
  firstBookingDate,
}: {
  nightlyBookings: List<Map<string, any>>;
  nightlyListings: List<Map<string, any>>;
  start: Date | null;
  end: Date | null;
  duration: number;
  TIME_ZONE: string;
  firstBookingDate?: string;
}) => {
  nightlyBookings = nightlyBookings?.filter((booking: any) => {
    return paidStatuses.includes(booking.get('status'));
  });

  if (!nightlyBookings || !nightlyListings)
    return { bookedNights: [], numBookedNights: 0 };

  if (firstBookingDate) {
    start = toStartOfDay(firstBookingDate, TIME_ZONE);
    end = toEndOfDay(new Date(), TIME_ZONE);
  }
  const bookedNights: any[] = [];

  const listingsWithoutBookings = nightlyListings.filter(
    (listing: any) =>
      !nightlyBookings.find(
        (booking: any) => booking.get('listing') === listing.get('_id'),
      ),
  );

  nightlyBookings.forEach((booking: any) => {
    const listing = nightlyListings.find(
      (listing: any) => listing.get('_id') === booking.get('listing'),
    );
    const listingName = listing?.get('name');

    const numOverlappingNights = calculateOverlappingNights(
      start,
      end,
      new Date(booking.get('start')),
      new Date(booking.get('end')),
    );
    const totalNights = listing?.get('private')
      ? duration * listing?.get('quantity')
      : duration * listing?.get('quantity') * listing?.get('beds');

    if (booking.get('roomOrBedNumbers').size) {
      booking.get('roomOrBedNumbers').map((roomOrBedNumber: any) => {
        bookedNights.push({
          listingName,
          roomOrBedNumber,
          nights: numOverlappingNights < 0 ? 0 : numOverlappingNights,
          totalNights: totalNights || 0,
        });
      });
    } else {
      bookedNights.push({
        listingName,
        roomOrBedNumber: -1,
        nights: numOverlappingNights < 0 ? 0 : numOverlappingNights,
        totalNights: totalNights || 0,
      });
    }
  });

  listingsWithoutBookings.forEach((listing: any) => {
    const totalNights = listing?.get('private')
      ? duration * listing?.get('quantity')
      : duration * listing?.get('quantity') * listing?.get('beds');

    bookedNights.push({
      listingName: listing.get('name'),
      roomOrBedNumber: -1,
      nights: 0,
      totalNights,
    });
  });

  const groupedBookedNights = groupNightlyByListingAndRoom(bookedNights);
  const sumBookedNights = groupedBookedNights.reduce(
    (sum, current) => sum + current.nights,
    0,
  );

  return {
    bookedNights: groupedBookedNights || [],
    numBookedNights: sumBookedNights,
  };
};

export const getBookedSpaceSlots = (
  bookings: List<any>,
  listings: List<any>,
  duration: number,
) => {
  if (!bookings || !listings)
    return { bookedSpaceSlots: [], numBookedSpaceSlots: 0 };

  const bookedSpaceSlots: any[] = [];
  let numBookedSpaceSlots = 0;

  const listingsWithoutBookings = listings.filter(
    (listing: any) =>
      !bookings.find(
        (booking: any) => booking.get('listing') === listing.get('_id'),
      ),
  );

  bookings.forEach((booking: any) => {
    const listing = listings.find(
      (listing: any) => listing.get('_id') === booking.get('listing'),
    );

    const listingName = listing && listing.get('name');

    const bookingNumSlots = dayjs(booking.get('end')).diff(
      dayjs(booking.get('start')),
      'hour',
    );

    const totalSpaceSlots =
      (listing &&
        listing.get('workingHoursEnd') - listing.get('workingHoursStart')) *
        listing.get('quantity') *
        duration || 0;

    booking.get('roomOrBedNumbers').map((roomOrBedNumber: any) => {
      bookedSpaceSlots.push({
        listingName,
        roomOrBedNumber,
        spaceSlots: bookingNumSlots,
        totalSpaceSlots,
      });
      numBookedSpaceSlots += bookingNumSlots;
    });
  });

  listingsWithoutBookings.forEach((listing: any) => {
    const totalSpaceSlots =
      (listing &&
        listing.get('workingHoursEnd') - listing.get('workingHoursStart')) *
        listing.get('quantity') *
        duration || 0;

    bookedSpaceSlots.push({
      listingName: listing.get('name'),
      roomOrBedNumber: -1,
      spaceSlots: 0,
      totalSpaceSlots,
    });
  });

  return {
    bookedSpaceSlots: groupByListingAndRoom(bookedSpaceSlots) || [],
    numBookedSpaceSlots,
  };
};

export const getBookingsWithRoomInfo = (
  bookings: any,
  listings: any,
  timeZone: string,
) => {
  const bookingsWithRoomInfo: any[] = [];
  bookings &&
    bookings.forEach((booking: any) => {
      const listing = listings?.find(
        (listing: any) => listing.get('_id') === booking.get('listing'),
      );

      booking.get('roomOrBedNumbers').map((roomOrBedNumber: any) => {
        const doesCheckoutToday = dayjs().isSame(
          dayjs(dateToPropertyTimeZone(timeZone, booking.get('end'))),
          'day',
        );
        bookingsWithRoomInfo.push({
          room: listing?.get('name') + ' ' + roomOrBedNumber,
          doesCheckoutToday,
          period:
            !listing?.get('priceDuration') ||
            listing?.get('priceDuration') !== 'hour'
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
    case 'allTime':
      return fromDate ? dayjs(new Date()).diff(fromDate, 'day') + 1 : 1;
    default:
      return 1;
  }
};

export const groupListingsByType = (listings: any[]) => {
  const groupedMap = new Map<string, ListingByType>();

  for (const listing of listings) {
    const key = listing.listingName;

    if (groupedMap.has(key)) {
      const existingListing = groupedMap.get(key) as ListingByType;

      if ('nights' in listing) {
        existingListing.nights += listing.nights;
      } else {
        existingListing.spaceSlots += listing.spaceSlots;
      }
    } else {
      groupedMap.set(key, { ...listing });
    }
  }

  return Array.from(groupedMap.values());
};

export const isSaleTransaction = (tx: TokenTransaction) => {
  const zeroHash = '0x0000000000000000000000000000000000000000';
  const transferEventHash =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const notRelatedToProxy =
    tx.fromAddressHash.toLowerCase() !== GNOSIS_SAFE_ADDRESS.toLowerCase() &&
    tx.toAddressHash.toLowerCase() !== GNOSIS_SAFE_ADDRESS.toLowerCase();
  const isTransfer = tx.fromAddressHash !== zeroHash;
  const isTransferEvent = tx.topics[0] === transferEventHash;
  const isNotSelfTransfer =
    tx.fromAddressHash.toLowerCase() !== tx.toAddressHash.toLowerCase();
  const isPositiveAmount =
    ethers.BigNumber.from(tx.amount) > ethers.BigNumber.from(0);

  return (
    isTransferEvent &&
    isNotSelfTransfer &&
    isPositiveAmount &&
    isTransfer &&
    notRelatedToProxy
  );
};

export const getTokenSales = (txs: TokenTransaction[]): SalesResult => {
  const sales = txs.filter((tx) => {
    return isSaleTransaction(tx);
  });

  const totalSales = sales.reduce((sum, tx) => {
    const amountInWei = ethers.BigNumber.from(tx.amount);
    return sum.add(amountInWei);
  }, ethers.BigNumber.from(0));

  const totalSalesInTDF = ethers.utils.formatEther(totalSales);

  return {
    salesCount: sales.length,
    totalSalesAmount: totalSalesInTDF,
  };
};

export const getAllTokenTransactions = async () => {
  try {
    const celoApiBaseUrl = 'https://explorer.celo.org/mainnet/api';
    const latestBlockUrl =
      'https://explorer.celo.org/mainnet/api?module=block&action=eth_block_number';

    const latestBlockResponse = await axios.get(latestBlockUrl);
    const data = latestBlockResponse.data;
    const latestBlockNumber = parseInt(data.result, 16);
    const oldBlockNumber = Math.max(0, latestBlockNumber - 10000000);
    const apiUrl = `${celoApiBaseUrl}?module=token&action=tokentx&contractaddress=${BLOCKCHAIN_DAO_TOKEN.address}&fromBlock=${oldBlockNumber}&toBlock=${latestBlockNumber}`;
    const response = await axios.get(apiUrl);
    const tokenTransactions = response.data.result;

    return tokenTransactions;
  } catch (error) {
    console.log('Error fetching Token transactions:', error);
    return null;
  }
};

export const getTokenSalesByDateRange = (
  txs: TokenTransaction[] | [],
  startDate: string | Date,
  endDate: string | Date,
): SalesResult => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  const filteredTxs = txs.filter((tx) => {
    const txDateSeconds = parseInt(tx.timeStamp, 16);
    const txDate = new Date(txDateSeconds * 1000).getTime();
    return txDate >= start && txDate <= end;
  });

  return getTokenSales(filteredTxs);
};

export const getPeriodName = (
  subPeriod: { start: string; end: string },
  timeFrame: string,
  diffInDays?: number,
) => {
  if (
    timeFrame === 'year' ||
    (timeFrame === 'allTime' &&
      diffInDays &&
      diffInDays >= 62 &&
      diffInDays <= 364) ||
    (timeFrame === 'custom' &&
      diffInDays &&
      diffInDays >= 62 &&
      diffInDays <= 364)
  ) {
    return dayjs(subPeriod.start).format('MMM');
  }

  if (timeFrame === 'allTime' && diffInDays && diffInDays >= 364) {
    return dayjs(subPeriod.start).format('YYYY');
  }

  return subPeriod.start !== subPeriod.end
    ? dayjs(subPeriod.start).format('MM.DD') +
        '-' +
        dayjs(subPeriod.end).format('MM.DD')
    : dayjs(subPeriod.end).format('MM.DD');
};

const getNDays = (days: number, toDate: string | Date) => {
  return Array.from({ length: days }, (_, i) => {
    return {
      start: dayjs(toDate).subtract(i, 'days').format('YYYY-MM-DD'),
      end: dayjs(toDate).subtract(i, 'days').format('YYYY-MM-DD'),
    };
  }).reverse();
};

const getNWeeks = (
  days: number,
  fromDate: string | Date,
  toDate: string | Date,
) => {
  const periods = [];
  for (let i = 1; i <= Math.ceil(days / 7); i++) {
    const endOfPeriod = dayjs(toDate).subtract((i - 1) * 7, 'day');
    const startOfPeriod =
      dayjs(toDate).subtract(i * 7, 'day') < dayjs(fromDate)
        ? dayjs(fromDate)
        : dayjs(toDate).subtract(i * 7, 'day');

    periods.push({
      start: startOfPeriod.format('YYYY-MM-DD'),
      end: endOfPeriod.format('YYYY-MM-DD'),
    });
  }
  return periods.reverse();
};

const getPrev7Days = () => {
  return Array.from({ length: 7 }, (_, i) => {
    return {
      start: dayjs().subtract(i, 'days').format('YYYY-MM-DD'),
      end: dayjs().subtract(i, 'days').format('YYYY-MM-DD'),
    };
  }).reverse();
};

const getPrev4Weeks = () => {
  const periods = [];
  for (let i = 1; i <= 4; i++) {
    const endOfPeriod = dayjs().subtract((i - 1) * 7, 'day');
    const startOfPeriod = dayjs().subtract(i * 7, 'day');
    periods.push({
      start: startOfPeriod.format('YYYY-MM-DD'),
      end: endOfPeriod.format('YYYY-MM-DD'),
    });
  }
  return periods.reverse();
};

const getPrev12Months = () => {
  const today = dayjs();
  const result: { start: string; end: string }[] = [];

  for (let i = 0; i < 12; i++) {
    const startOfMonth = today.subtract(i, 'month').startOf('month');
    const endOfMonth = startOfMonth.endOf('month');

    result.unshift({
      start: startOfMonth.format('YYYY-MM-DD'),
      end: endOfMonth.format('YYYY-MM-DD'),
    });
  }

  return result;
};

const getNMonths = (
  diffInDays: number,
  startDate: string | Date,
  endDate: string | Date,
) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const result: { start: string; end: string }[] = [];

  let currentMonth = start.startOf('month');

  while (currentMonth.isBefore(end) || currentMonth.isSame(end, 'month')) {
    const periodStart = currentMonth.isAfter(start) ? currentMonth : start;
    const periodEnd = currentMonth.endOf('month').isAfter(end)
      ? end
      : currentMonth.endOf('month');

    result.push({
      start: periodStart.format('YYYY-MM-DD'),
      end: periodEnd.format('YYYY-MM-DD'),
    });

    currentMonth = currentMonth.add(1, 'month');
  }

  return result;
};

const getNYears = (
  diffInDays: number,
  startDate: string | Date,
  endDate: string | Date,
) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const result: { start: string; end: string }[] = [];

  let currentYear = start.startOf('year');

  while (currentYear.isBefore(end) || currentYear.isSame(end, 'year')) {
    const periodStart = currentYear.isAfter(start) ? currentYear : start;
    const periodEnd = currentYear.endOf('year').isAfter(end)
      ? end
      : currentYear.endOf('year');

    result.push({
      start: periodStart.format('YYYY-MM-DD'),
      end: periodEnd.format('YYYY-MM-DD'),
    });

    currentYear = currentYear.add(1, 'year');
  }

  return result;
};

const getCustomPeriods = (fromDate: string | Date, toDate: string | Date) => {
  const start = dayjs(fromDate);
  const end = dayjs(toDate);
  const diffInDays = end.diff(start, 'days');

  if (diffInDays <= 6) {
    return getNDays(diffInDays + 1, toDate);
  } else if (diffInDays <= 62) {
    return getNWeeks(diffInDays, fromDate, toDate);
  } else if (diffInDays <= 364) {
    return getNMonths(diffInDays, fromDate, toDate);
  } else {
    return [
      {
        start: dayjs(fromDate).format('YYYY-MM-DD'),
        end: dayjs(toDate).format('YYYY-MM-DD'),
      },
    ];
  }
};

const getAllTimePeriods = (firstBookingDate: string) => {
  const start = dayjs(firstBookingDate);
  const end = dayjs(new Date());
  const diffInDays = end.diff(start, 'days');

  if (diffInDays <= 6) {
    return getNDays(diffInDays + 1, new Date());
  } else if (diffInDays <= 62) {
    return getNWeeks(diffInDays, firstBookingDate, new Date());
  } else if (diffInDays <= 364) {
    return getNMonths(diffInDays, firstBookingDate, new Date());
  } else {
    return getNYears(diffInDays, firstBookingDate, new Date());
  }
};

export const getTimePeriod = (
  timeFrame: string,
  fromDate: string | Date,
  toDate: string | Date,
  firstBookingDate?: string,
): { subPeriods: { start: string; end: string }[] } => {
  switch (timeFrame) {
    case 'today':
      return {
        subPeriods: [
          {
            start: dayjs().format('YYYY-MM-DD'),
            end: dayjs().format('YYYY-MM-DD'),
          },
        ],
      };
    case 'week':
      return {
        subPeriods: getPrev7Days(),
      };
    case 'month':
      return {
        subPeriods: getPrev4Weeks(),
      };
    case 'year':
      return {
        subPeriods: getPrev12Months(),
      };
    case 'custom':
      return {
        subPeriods: getCustomPeriods(fromDate, toDate),
      };
    case 'allTime':
      return {
        subPeriods: getAllTimePeriods(
          firstBookingDate || new Date().toISOString(),
        ),
      };
    default:
      return {
        subPeriods: [
          {
            start: dayjs().format('YYYY-MM-DD'),
            end: dayjs().format('YYYY-MM-DD'),
          },
        ],
      };
  }
};

export const getSubPeriodData = ({
  subPeriod,
  bookings,
  tokenSales,
  timeFrame,
  fromDate,
  toDate,
  firstBookingDate,
  TIME_ZONE,
  stripeSubsPayments,
  listings,
  TOKEN_PRICE,
}: {
  subPeriod: { start: string; end: string };
  bookings: List<any>;
  tokenSales: List<any>;
  timeFrame: string;
  fromDate: string | Date;
  toDate: string | Date;
  firstBookingDate: string;
  TIME_ZONE: string;
  stripeSubsPayments: any[];
  listings: List<any>;
  TOKEN_PRICE: number;
}) => {
  let hospitalityRevenue = 0;
  let spacesRevenue = 0;
  let eventsRevenue = 0;
  let subscriptionsRevenue = 0;
  let foodRevenue = 0;
  let start: Date | string = '';
  let end: Date | string = '';

  const diffInDays =
    timeFrame === 'custom'
      ? dayjs(toDate).diff(dayjs(fromDate), 'days')
      : dayjs(new Date()).diff(dayjs(firstBookingDate), 'days');

  ({ start, end } = getDateRange({
    timeFrame: 'custom',
    fromDate: subPeriod.start,
    toDate: subPeriod.end,
    timeZone: TIME_ZONE,
  }));

  const timePeriodTokenSales = tokenSales.filter((sale: any) => {
    const saleDate = new Date(sale.get('created'));
    const startDate = new Date(start);
    const endDate = new Date(end);

    return saleDate >= startDate && saleDate <= endDate;
  });
  const timePeriodTokenRevenue = timePeriodTokenSales.reduce(
    (acc: number, curr: any) => {
      return Number(acc) + Number(curr.get('value'));
    },
    0,
  );

  const timePeriodSubsData = stripeSubsPayments.filter((sub) => {
    const paymentDate = new Date(sub.date);
    const startDate = new Date(start);
    const endDate = new Date(end);

    return paymentDate >= startDate && paymentDate <= endDate;
  });

  subscriptionsRevenue =
    timePeriodSubsData.reduce((acc, curr) => {
      return acc + curr.amount;
    }, 0) / STRIPE_AMOUNT_MULTIPLIER || 0;

  const filteredBookings = bookings.filter((booking: any) => {
    return (
      dayjs(booking.get('start')).isBefore(end) &&
      dayjs(booking.get('end')).isAfter(start)
    );
  });

  filteredBookings.forEach((booking: any) => {
    const listing = listings.find((listing: any) => {
      return listing.get('_id') === booking.get('listing');
    });

    const isCheckin =
      dayjs(booking.get('start')).isAfter(start) &&
      dayjs(booking.get('start')).isBefore(end);
    const isEvent = booking.get('eventId');
    const isNightly =
      listing?.get('priceDuration') === 'night' ||
      !listing?.get('priceDuration');

    if (isCheckin) {
      if (isNightly) {
        const fiatPrice = booking?.get('rentalFiat')?.get('val');

        hospitalityRevenue += fiatPrice;

        const utilityPrice = booking?.get('utilityFiat')?.get('val');
        foodRevenue += utilityPrice;
      }
      if (!isNightly) {
        const fiatPrice = booking?.get('rentalFiat')?.get('val');
        spacesRevenue += fiatPrice;
      }
      if (isEvent) {
        const ticketPrice = booking?.get('ticketOption')?.get('price');
        eventsRevenue += ticketPrice;
      }
    }
  });

  const totalOperations = Math.floor(
    Number(hospitalityRevenue) +
      Number(spacesRevenue) +
      Number(eventsRevenue) +
      Number(subscriptionsRevenue) +
      Number(foodRevenue),
  );

  return {
    name: getPeriodName(subPeriod, timeFrame, diffInDays),
    hospitality: Number(hospitalityRevenue.toFixed(1)),
    spaces: Number(spacesRevenue.toFixed(1)),
    events: Number(eventsRevenue.toFixed(1)),
    subscriptions: Number(subscriptionsRevenue.toFixed(1)),
    food: Number(foodRevenue.toFixed(1)),

    // TODO: calculate token price more precisely
    tokens: Number((timePeriodTokenRevenue * TOKEN_PRICE).toFixed(1)),
    totalOperations,
  };
};
