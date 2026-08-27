import { BigNumber, BigNumberish } from 'ethers';

type AccommodationBooking = {
  year?: BigNumberish;
  dayOfYear?: BigNumberish;
  price?: BigNumberish;
  [index: number]: BigNumberish | undefined;
};

export type AccommodationBookingCoverage = 'none' | 'complete' | 'conflict';

const bookingField = (
  booking: AccommodationBooking,
  name: 'year' | 'dayOfYear' | 'price',
  index: number,
): BigNumberish | undefined => booking?.[name] ?? booking?.[index];

const toNumber = (value: BigNumberish | undefined): number =>
  BigNumber.isBigNumber(value) ? value.toNumber() : Number(value);

const bookingDay = (booking: AccommodationBooking): number =>
  toNumber(bookingField(booking, 'dayOfYear', 2));

const bookingPrice = (booking: AccommodationBooking): BigNumber =>
  BigNumber.from(bookingField(booking, 'price', 3) ?? 0);

const indexBookings = (
  bookingsByYear: Map<number, AccommodationBooking[]>,
): Map<number, Map<number, AccommodationBooking>> => {
  const bookingMaps = new Map<number, Map<number, AccommodationBooking>>();
  for (const [year, bookings] of bookingsByYear.entries()) {
    const byDay = new Map<number, AccommodationBooking>();
    for (const booking of bookings || []) {
      byDay.set(bookingDay(booking), booking);
    }
    bookingMaps.set(year, byDay);
  }
  return bookingMaps;
};

export const countMatchingAccommodationBookingPrefix = (
  bookingsByYear: Map<number, AccommodationBooking[]>,
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
  bookingsByYear: Map<number, AccommodationBooking[]>,
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
