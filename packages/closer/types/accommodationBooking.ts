import type { BigNumberish } from 'ethers';

export type OnChainAccommodationBooking = {
  year?: BigNumberish;
  dayOfYear?: BigNumberish;
  price?: BigNumberish;
  [index: number]: BigNumberish | undefined;
};

export type AccommodationBookingCoverage = 'none' | 'complete' | 'conflict';
