import { checkIfBookingEqBlockchain } from '../helpers';

describe('checkIfBookingEqBlockchain', () => {
  const contractNights = [
    [
      1,
      2022,
      331,
      {
        type: 'BigNumber',
        hex: '0x8ac7230489e80000',
      },
      {
        type: 'BigNumber',
        hex: '0x63834ff5',
      },
    ],
    [
      1,
      2022,
      333,
      {
        type: 'BigNumber',
        hex: '0x1bc16d674ec80000',
      },
      {
        type: 'BigNumber',
        hex: '0x6385f2f3',
      },
    ],
    [
      1,
      2022,
      334,
      {
        type: 'BigNumber',
        hex: '0x1bc16d674ec80000',
      },
      {
        type: 'BigNumber',
        hex: '0x63874472',
      },
    ],
    [
      1,
      2022,
      335,
      {
        type: 'BigNumber',
        hex: '0x1bc16d674ec80000',
      },
      {
        type: 'BigNumber',
        hex: '0x638895f1',
      },
    ],
  ];

  const bookingNightsIncluded = [[2022, 335]];
  const bookingNightsExcluded = [[2022, 367]];

  it('should return true if booking date is included in blockchain dates', () => {
    const isBookingConfirmedOnBlockchain = checkIfBookingEqBlockchain(
      bookingNightsIncluded,
      contractNights,
    );
    expect(isBookingConfirmedOnBlockchain).toBe(true);
  });

  it('should return false if booking date is NOT included in blockchain dates', () => {
    const isBookingConfirmedOnBlockchain = checkIfBookingEqBlockchain(
      bookingNightsExcluded,
      contractNights,
    );
    expect(isBookingConfirmedOnBlockchain).toBe(false);
  });
});
