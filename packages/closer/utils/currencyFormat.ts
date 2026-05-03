import { CURRENCY_ISO_SYMBOL, configDescription } from '../config';
import { countryCodeToLocale } from '../constants/countryLocales';
import { getDefaultConfigValue } from './config.utils';

let defaultCurrencyLocale = (() => {
  try {
    const g = getDefaultConfigValue('general', configDescription);
    return countryCodeToLocale(g.country as string | undefined);
  } catch {
    return 'en-US';
  }
})();

export function setDefaultCurrencyLocale(locale: string): void {
  defaultCurrencyLocale = locale || 'en-US';
}

export function getDefaultCurrencyLocale(): string {
  return defaultCurrencyLocale;
}

export function syncCurrencyLocaleFromCountryCode(
  countryCode: string | undefined | null,
): void {
  setDefaultCurrencyLocale(countryCodeToLocale(countryCode));
}

export function getCurrencySymbol(currencyCode: string): string {
  return (
    CURRENCY_ISO_SYMBOL[currencyCode as keyof typeof CURRENCY_ISO_SYMBOL] ??
    currencyCode
  );
}

export function isIso4217Currency(currencyCode: string): boolean {
  return Object.prototype.hasOwnProperty.call(CURRENCY_ISO_SYMBOL, currencyCode);
}

export function roundToTwoDecimals(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
}

function normalizeFractionDigits(
  fd?: { min?: number; max?: number },
): { min: number; max: number } {
  return {
    min: fd?.min ?? 2,
    max: fd?.max ?? 2,
  };
}

export function formatIsoFiatAmount(
  amount: number,
  currencyCode: string,
  localeOrFractionDigits?: string | { min?: number; max?: number },
  fractionDigits?: { min?: number; max?: number },
): string {
  let locale: string | undefined;
  let fd: { min?: number; max?: number } | undefined;
  if (typeof localeOrFractionDigits === 'string') {
    locale = localeOrFractionDigits;
    fd = fractionDigits;
  } else if (
    localeOrFractionDigits &&
    typeof localeOrFractionDigits === 'object'
  ) {
    fd = localeOrFractionDigits;
  }
  const { min, max } = normalizeFractionDigits(fd);
  const loc = locale ?? getDefaultCurrencyLocale();
  const roundedAmount = roundToTwoDecimals(amount);
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(roundedAmount);
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    const formatted = new Intl.NumberFormat(loc, {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(roundedAmount);
    return `${symbol}${formatted}`;
  }
}

export function formatIntlNumberTwoDecimals(amount: number, locale?: string): string {
  const loc = locale ?? getDefaultCurrencyLocale();
  const rounded = roundToTwoDecimals(amount);
  return new Intl.NumberFormat(loc, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

export function formatCompactCurrencyAmount(
  amount: number,
  currencyCode: string,
  locale?: string,
): string {
  const loc = locale ?? getDefaultCurrencyLocale();
  try {
    const formatted = new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: currencyCode,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
    return formatted.replace('K', 'k');
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    const compact = new Intl.NumberFormat(loc, {
      notation: 'compact',
      maximumFractionDigits: 1,
    })
      .format(amount)
      .replace('K', 'k');
    return `${symbol}${compact}`;
  }
}

export function parseTokenUnits(amount: string | number, decimals: number): bigint {
  let str = typeof amount === 'number' ? amount.toFixed(decimals) : String(amount);

  if (str.includes('e') || str.includes('E')) {
    str = Number(str).toFixed(decimals);
  }

  const negative = str.startsWith('-');
  if (negative) str = str.slice(1);

  const [intPart = '0', fracPart = ''] = str.split('.');
  const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
  const result = BigInt(intPart + paddedFrac);
  return negative ? -result : result;
}
