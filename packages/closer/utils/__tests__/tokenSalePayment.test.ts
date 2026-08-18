import {
  EURM_GAS_RESERVE,
  calculateEurmTopUpAmount,
  formatWidgetTokenAmount,
  safeParseTokenAmount,
} from '../tokenSalePayment';

const eurm = (value: string) => safeParseTokenAmount(value);

describe('token sale multi-currency payment helpers', () => {
  it('does not request a conversion when EURm already covers the purchase', () => {
    expect(
      calculateEurmTopUpAmount({
        balance: eurm('100'),
        totalCost: eurm('100'),
        needsEurmGas: false,
      }),
    ).toBe(0n);
  });

  it('tops up the shortfall plus a five-percent price buffer', () => {
    expect(
      calculateEurmTopUpAmount({
        balance: eurm('20'),
        totalCost: eurm('100'),
        needsEurmGas: false,
      }),
    ).toBe(eurm('85'));
  });

  it('reserves EURm gas when native CELO cannot pay for transactions', () => {
    expect(
      calculateEurmTopUpAmount({
        balance: eurm('20'),
        totalCost: eurm('100'),
        needsEurmGas: true,
      }),
    ).toBe(eurm('85') + EURM_GAS_RESERVE);
  });

  it('requests only the missing gas reserve when the purchase is funded', () => {
    expect(
      calculateEurmTopUpAmount({
        balance: eurm('100'),
        totalCost: eurm('100'),
        needsEurmGas: true,
      }),
    ).toBe(eurm('5') + EURM_GAS_RESERVE);
  });

  it('formats exact output amounts without trailing zeroes', () => {
    expect(formatWidgetTokenAmount(eurm('85.1000'))).toBe('85.1');
  });

  it('treats invalid wallet balance strings as zero', () => {
    expect(safeParseTokenAmount('not-a-number')).toBe(0n);
  });
});
