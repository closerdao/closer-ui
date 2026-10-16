import { BigNumber, constants, utils } from 'ethers';

import type { Stay } from '../types/stay';

// Transaction amounts use base units. Human-readable numbers are display-only.
export const uint256Wei = (value: string): BigNumber => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new Error('Token amount must be an unsigned integer wei string.');
  }
  const amount = BigNumber.from(value);
  if (amount.gt(constants.MaxUint256))
    throw new Error('Token amount exceeds uint256.');
  return amount;
};

export const approvalWithBufferWei = (costWei: string): string => {
  const cost = uint256Wei(costWei);
  return uint256Wei(cost.mul(105).add(99).div(100).toString()).toString();
};

export const tokenPaymentFromBalance = (balanceWei: string, capWei: string) => {
  const balance = uint256Wei(balanceWei);
  const cap = uint256Wei(capWei);
  if (balance.isZero() || cap.isZero())
    throw new Error('No tokens available for this payment.');
  return balance.gte(cap)
    ? { method: 'full-tokens' as const }
    : {
        method: 'partial-tokens' as const,
        requestedTokensWei: balance.toString(),
      };
};

export const accommodationCapWei = (
  stay: Pick<Stay, 'priceLock' | 'rentalToken'>,
  decimals = 18,
): string =>
  uint256Wei(
    stay.priceLock?.accommodationPricing?.token?.discountedWei ??
      utils
        .parseUnits(
          String(
            stay.priceLock?.rentalToken?.val ?? stay.rentalToken?.val ?? 0,
          ),
          decimals,
        )
        .toString(),
  ).toString();
