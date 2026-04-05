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
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(amount);
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    const formatted = new Intl.NumberFormat(loc, {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(amount);
    return `${symbol}${formatted}`;
  }
}
