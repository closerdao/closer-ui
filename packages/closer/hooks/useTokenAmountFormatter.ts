import { useCallback } from 'react';

import { utils as ethersUtils } from 'ethers';
import { useFormatter } from 'next-intl';

const MAX_TOKEN_DISPLAY_DECIMALS = 6;

const normalizeDisplayDecimals = (value: number | undefined): number =>
  Number.isInteger(value)
    ? Math.min(MAX_TOKEN_DISPLAY_DECIMALS, Math.max(0, Number(value)))
    : MAX_TOKEN_DISPLAY_DECIMALS;

export const tokenAmountNumberFromWei = (
  valueWei: string,
  decimals: number,
): number | null => {
  try {
    const value = Number(ethersUtils.formatUnits(valueWei, decimals));
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

export const useTokenAmountFormatter = (displayDecimals?: number) => {
  const format = useFormatter();
  const maximumFractionDigits = normalizeDisplayDecimals(displayDecimals);

  return useCallback(
    (value: number | string | null | undefined): string => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return '0';
      return format.number(numeric, {
        minimumFractionDigits: 0,
        maximumFractionDigits,
      });
    },
    [format, maximumFractionDigits],
  );
};
