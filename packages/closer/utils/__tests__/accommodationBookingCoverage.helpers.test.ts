import { BigNumber } from 'ethers';

import {
  classifyAccommodationBookingCoverage,
  countMatchingAccommodationBookingPrefix,
} from '../accommodationBookingCoverage.helpers';

const booking = (year: number, dayOfYear: number, price: number) => ({
  year,
  dayOfYear,
  price: BigNumber.from(price),
});

describe('accommodation booking coverage', () => {
  const nights = [
    [2026, 1],
    [2026, 2],
    [2026, 3],
  ];

  it('reports complete only when every night exists at the exact price', () => {
    const bookingsByYear = new Map([
      [
        2026,
        [booking(2026, 1, 100), booking(2026, 2, 100), booking(2026, 3, 100)],
      ],
    ]);

    expect(
      classifyAccommodationBookingCoverage(bookingsByYear, nights, 100),
    ).toBe('complete');
  });

  it('reports a conflict for partial coverage or another price', () => {
    expect(
      classifyAccommodationBookingCoverage(
        new Map([[2026, [booking(2026, 1, 100)]]]),
        nights,
        100,
      ),
    ).toBe('conflict');
    expect(
      classifyAccommodationBookingCoverage(
        new Map([
          [
            2026,
            [
              booking(2026, 1, 100),
              booking(2026, 2, 120),
              booking(2026, 3, 100),
            ],
          ],
        ]),
        nights,
        100,
      ),
    ).toBe('conflict');
  });

  it('reports none when none of the requested dates exist', () => {
    expect(
      classifyAccommodationBookingCoverage(new Map([[2026, []]]), nights, 100),
    ).toBe('none');
  });

  it('counts only the consecutive exact prefix', () => {
    const bookingsByYear = new Map([
      [2026, [booking(2026, 1, 100), booking(2026, 2, 120)]],
    ]);

    expect(
      countMatchingAccommodationBookingPrefix(bookingsByYear, nights, 100),
    ).toBe(1);
  });
});
