import { BigNumber, utils as ethersUtils } from 'ethers';

import {
  buildLaterYearStakeConflictError,
  detectLaterYearStakeConflict,
  parseLaterYearStakeConflictError,
  sumStakeAfter,
} from '../laterYearStakeConflict.helpers';

const tdf = (value: string) => ethersUtils.parseUnits(value, 18);
const tm = (iso: string) => Math.floor(Date.parse(iso) / 1000);

const END_OF_2026 = tm('2026-12-31T23:59:59Z');

// Mirrors the real testnet ledger that produced the panic 0x11 report:
// 2026 nights already staked, plus 2.6 $TDF held for 2027 nights.
const realLedger = [
  { timestamp: tm('2026-05-22T11:57:38Z'), amount: tdf('0.05') },
  { timestamp: tm('2026-06-01T11:57:28Z'), amount: tdf('1.2') },
  { timestamp: tm('2026-11-12T11:54:44Z'), amount: tdf('0.4') },
  { timestamp: tm('2027-01-01T11:59:59Z'), amount: tdf('0.2') },
  { timestamp: tm('2027-01-02T11:59:58Z'), amount: tdf('0.2') },
  { timestamp: tm('2027-01-03T11:59:57Z'), amount: tdf('0.2') },
  { timestamp: tm('2027-01-04T11:59:56Z'), amount: tdf('0.2') },
  { timestamp: tm('2027-01-05T11:59:55Z'), amount: tdf('0.2') },
  { timestamp: tm('2027-01-06T11:59:54Z'), amount: tdf('0.2') },
  { timestamp: tm('2027-01-07T11:59:53Z'), amount: tdf('0.2') },
  { timestamp: tm('2027-02-17T11:59:12Z'), amount: tdf('0.4') },
  { timestamp: tm('2027-02-18T11:59:11Z'), amount: tdf('0.4') },
  { timestamp: tm('2027-02-19T11:59:10Z'), amount: tdf('0.4') },
];

describe('sumStakeAfter', () => {
  it('sums only deposits dated after the end of the booked year', () => {
    expect(sumStakeAfter(realLedger, END_OF_2026).toString()).toBe(
      tdf('2.6').toString(),
    );
  });

  it('returns zero for an empty or missing ledger', () => {
    expect(sumStakeAfter([], END_OF_2026).toString()).toBe('0');
    expect(sumStakeAfter(null, END_OF_2026).toString()).toBe('0');
  });

  it('ignores deposits exactly on the year boundary', () => {
    const onBoundary = [{ timestamp: END_OF_2026, amount: tdf('5') }];
    expect(sumStakeAfter(onBoundary, END_OF_2026).toString()).toBe('0');
  });
});

describe('detectLaterYearStakeConflict', () => {
  it('flags the 2 $TDF per night booking that reverted on-chain', () => {
    const conflict = detectLaterYearStakeConflict({
      deposits: realLedger,
      yearEndTm: END_OF_2026,
      pricePerNightWei: tdf('2'),
    });
    expect(conflict).not.toBeNull();
    expect(conflict?.laterYearStakeWei.toString()).toBe(tdf('2.6').toString());
  });

  it('clears once the per-night price reaches the later-year stake', () => {
    // On-chain sweep: 2.59 reverted, 2.6 succeeded.
    expect(
      detectLaterYearStakeConflict({
        deposits: realLedger,
        yearEndTm: END_OF_2026,
        pricePerNightWei: tdf('2.59'),
      }),
    ).not.toBeNull();
    expect(
      detectLaterYearStakeConflict({
        deposits: realLedger,
        yearEndTm: END_OF_2026,
        pricePerNightWei: tdf('2.6'),
      }),
    ).toBeNull();
  });

  it('does not flag a booking in the latest staked year', () => {
    expect(
      detectLaterYearStakeConflict({
        deposits: realLedger,
        yearEndTm: tm('2027-12-31T23:59:59Z'),
        pricePerNightWei: tdf('2'),
      }),
    ).toBeNull();
  });

  it('does not flag a wallet with no later-year stake', () => {
    expect(
      detectLaterYearStakeConflict({
        deposits: realLedger.filter((d) => d.timestamp < END_OF_2026),
        yearEndTm: END_OF_2026,
        pricePerNightWei: tdf('2'),
      }),
    ).toBeNull();
  });

  it('returns null for a zero or unusable price', () => {
    expect(
      detectLaterYearStakeConflict({
        deposits: realLedger,
        yearEndTm: END_OF_2026,
        pricePerNightWei: BigNumber.from(0),
      }),
    ).toBeNull();
  });
});

describe('later year stake conflict error encoding', () => {
  it('round-trips through the error message', () => {
    const conflict = detectLaterYearStakeConflict({
      deposits: realLedger,
      yearEndTm: END_OF_2026,
      pricePerNightWei: tdf('2'),
    });
    const error = buildLaterYearStakeConflictError(conflict!, 2026);
    const parsed = parseLaterYearStakeConflictError(error.message);
    expect(parsed?.laterYearStakeWei).toBe(tdf('2.6').toString());
    expect(parsed?.bookingYear).toBe('2026');
  });

  it('ignores unrelated error messages', () => {
    expect(parseLaterYearStakeConflictError('something else')).toBeNull();
  });
});
