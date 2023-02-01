import { calculateRefundTotal, checkIfBookingEqBlockchain } from './helpers';

const POLICY_MOCK = {
  default: 1,
  lastmonth: 0.5,
  lastweek: 0.25,
  lastday: 0.01,
};

describe('calculateRefundTotal', () => {
  it('should return initialValue * defaultRefund if start date > 30 days ', () => {
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 31);
    const args = {
      initialValue: 100,
      policy: POLICY_MOCK,
      startDate: targetDate,
    };
    expect(calculateRefundTotal(args)).toBe(
      args.initialValue * POLICY_MOCK.default,
    );
  });

  it('should return initialValue * lastmonth if start date > 7 days ', () => {
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    targetDate.setHours(targetDate.getHours() + 1);
    const args = {
      initialValue: 100,
      policy: POLICY_MOCK,
      startDate: targetDate,
    };
    expect(calculateRefundTotal(args)).toBe(
      args.initialValue * POLICY_MOCK.lastmonth,
    );
  });

  it('should return initialValue * lastweek if start date > 3 day ', () => {
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(targetDate.getHours() + 1);
    const args = {
      initialValue: 100,
      policy: POLICY_MOCK,
      startDate: targetDate,
    };
    expect(calculateRefundTotal(args)).toBe(
      args.initialValue * POLICY_MOCK.lastweek,
    );
  });

  it('should return initialValue * lastday if start date > 1 day ', () => {
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(targetDate.getHours() + 1);
    const args = {
      initialValue: 100,
      policy: POLICY_MOCK,
      startDate: targetDate,
    };
    expect(calculateRefundTotal(args)).toBe(
      args.initialValue * POLICY_MOCK.lastday,
    );
  });

  it('should return 0 if start date is in the past or equal to now', () => {
    let targetDate = new Date();
    const args = {
      initialValue: 100,
      policy: POLICY_MOCK,
      startDate: targetDate,
    };
    expect(calculateRefundTotal(args)).toBe(0);
  });
});

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
