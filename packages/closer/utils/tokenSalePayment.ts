import { formatUnits, parseUnits } from 'viem';

export const EURM_DECIMALS = 18;
export const TOKEN_SALE_PRICE_BUFFER_BPS = 500n;
export const BASIS_POINTS = 10_000n;
export const EURM_GAS_RESERVE = parseUnits('0.1', EURM_DECIMALS);

type TopUpAmountInput = {
  balance: bigint;
  totalCost: bigint;
  needsEurmGas: boolean;
};

export const safeParseTokenAmount = (
  value: string | number | null | undefined,
  decimals = EURM_DECIMALS,
) => {
  try {
    return parseUnits(String(value ?? 0), decimals);
  } catch {
    return 0n;
  }
};

export const calculateEurmTopUpAmount = ({
  balance,
  totalCost,
  needsEurmGas,
}: TopUpAmountInput) => {
  const gasReserve = needsEurmGas ? EURM_GAS_RESERVE : 0n;
  const immediatelyRequired = totalCost + gasReserve;

  if (balance >= immediatelyRequired) return 0n;

  const priceBuffer = (totalCost * TOKEN_SALE_PRICE_BUFFER_BPS) / BASIS_POINTS;
  const targetBalance = totalCost + priceBuffer + gasReserve;

  return targetBalance > balance ? targetBalance - balance : 0n;
};

export const formatWidgetTokenAmount = (
  value: bigint,
  decimals = EURM_DECIMALS,
) => {
  const formatted = formatUnits(value, decimals);
  return formatted.includes('.') ? formatted.replace(/\.?0+$/, '') : formatted;
};
