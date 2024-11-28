import { calculateRefundTotal } from '../helpers';

const POLICY_MOCK = {
  default: 1,
  lastmonth: 0.5,
  lastweek: 0.25,
  lastday: 0.01,
};

describe.skip('calculateRefundTotal', () => {
  it.skip('should return initialValue * defaultRefund if start date > 30 days ', () => {
    const targetDate = new Date();
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
    const targetDate = new Date();
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
    const targetDate = new Date();
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
    const targetDate = new Date();
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
    const targetDate = new Date();
    const args = {
      initialValue: 100,
      policy: POLICY_MOCK,
      startDate: targetDate,
    };
    expect(calculateRefundTotal(args)).toBe(0);
  });
});
