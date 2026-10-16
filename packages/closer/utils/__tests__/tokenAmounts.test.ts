import { constants } from 'ethers';

import {
  approvalWithBufferWei,
  tokenPaymentFromBalance,
  uint256Wei,
} from '../tokenAmounts';

test('the reported wallet budget is sent unchanged to booking pricing', () => {
  expect(
    tokenPaymentFromBalance('10836489457776736884', '15000000000000000000'),
  ).toEqual({
    method: 'partial-tokens',
    requestedTokensWei: '10836489457776736884',
  });
});

test('full payment uses an exact comparison, including a one-wei shortfall', () => {
  expect(
    tokenPaymentFromBalance('999999999999999999', '1000000000000000000').method,
  ).toBe('partial-tokens');
  expect(
    tokenPaymentFromBalance('1000000000000000000', '1000000000000000000')
      .method,
  ).toBe('full-tokens');
  expect(
    tokenPaymentFromBalance('1000000000000000001', '1000000000000000000')
      .method,
  ).toBe('full-tokens');
});

test('approval buffer is exact, rounds up only fractional wei, and rejects overflow', () => {
  expect(approvalWithBufferWei('100000000000000000')).toBe(
    '105000000000000000',
  );
  expect(approvalWithBufferWei('1')).toBe('2');
  const largest = constants.MaxUint256.mul(100).div(105);
  expect(
    uint256Wei(approvalWithBufferWei(largest.toString())).lte(
      constants.MaxUint256,
    ),
  ).toBe(true);
  expect(() => approvalWithBufferWei(largest.add(1).toString())).toThrow(
    /uint256/,
  );
});

test.each(['-1', '1.2', '1e18', '0xff', '', ' 1', 'NaN'])(
  'rejects invalid wei %s',
  (value) => {
    expect(() => uint256Wei(value)).toThrow();
  },
);
