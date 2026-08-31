import { BigNumber, BigNumberish } from 'ethers';

import type {
  AccommodationBookingCoverage,
  OnChainAccommodationBooking,
} from '../types/accommodationBooking';

const bookingField = (
  booking: OnChainAccommodationBooking,
  name: 'year' | 'dayOfYear' | 'price',
  index: number,
): BigNumberish | undefined => booking?.[name] ?? booking?.[index];

const toNumber = (value: BigNumberish | undefined): number =>
  BigNumber.isBigNumber(value) ? value.toNumber() : Number(value);

const bookingDay = (booking: OnChainAccommodationBooking): number =>
  toNumber(bookingField(booking, 'dayOfYear', 2));

const bookingPrice = (booking: OnChainAccommodationBooking): BigNumber =>
  BigNumber.from(bookingField(booking, 'price', 3) ?? 0);

const indexBookings = (
  bookingsByYear: Map<number, OnChainAccommodationBooking[]>,
): Map<number, Map<number, OnChainAccommodationBooking>> => {
  const bookingMaps = new Map<
    number,
    Map<number, OnChainAccommodationBooking>
  >();
  for (const [year, bookings] of bookingsByYear.entries()) {
    const byDay = new Map<number, OnChainAccommodationBooking>();
    for (const booking of bookings || []) {
      byDay.set(bookingDay(booking), booking);
    }
    bookingMaps.set(year, byDay);
  }
  return bookingMaps;
};

export const countMatchingAccommodationBookingPrefix = (
  bookingsByYear: Map<number, OnChainAccommodationBooking[]>,
  nights: BigNumberish[][],
  pricePerNightWei: BigNumberish,
): number => {
  const bookingMaps = indexBookings(bookingsByYear);
  const targetPrice = BigNumber.from(pricePerNightWei);
  let matching = 0;

  for (const [yearRaw, dayRaw] of nights) {
    const year = toNumber(yearRaw);
    const day = toNumber(dayRaw);
    const booking = bookingMaps.get(year)?.get(day);
    if (!booking || !bookingPrice(booking).eq(targetPrice)) break;
    matching += 1;
  }

  return matching;
};

export const classifyAccommodationBookingCoverage = (
  bookingsByYear: Map<number, OnChainAccommodationBooking[]>,
  nights: BigNumberish[][],
  pricePerNightWei: BigNumberish,
): AccommodationBookingCoverage => {
  if (nights.length === 0) return 'none';

  const bookingMaps = indexBookings(bookingsByYear);
  const targetPrice = BigNumber.from(pricePerNightWei);
  let existingCount = 0;
  let exactCount = 0;

  for (const [yearRaw, dayRaw] of nights) {
    const year = toNumber(yearRaw);
    const day = toNumber(dayRaw);
    const booking = bookingMaps.get(year)?.get(day);
    if (!booking) continue;
    existingCount += 1;
    if (bookingPrice(booking).eq(targetPrice)) exactCount += 1;
  }

  if (exactCount === nights.length) return 'complete';
  return existingCount > 0 ? 'conflict' : 'none';
};
