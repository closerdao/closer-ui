import { DEFAULT_CURRENCY } from '../constants/shared.constants';
import type { Sale } from '../types/api';
import type { Subscriptions } from '../types/subscriptions';
import {
  formatIsoFiatAmount,
  isIso4217Currency,
} from './currencyFormat';

export function getPlatformDefaultCurrency(
  subscriptionsConfig?: Subscriptions | null,
): string {
  const cur = subscriptionsConfig?.config?.currency?.trim()?.toUpperCase();
  if (cur && isIso4217Currency(cur)) {
    return cur;
  }
  return DEFAULT_CURRENCY;
}

export function resolveSaleCurrency(
  sale: Pick<Sale, 'currency' | 'charge'>,
  platformDefault?: string,
): string {
  const fromCharge = sale.charge?.amount?.total?.cur?.trim()?.toUpperCase();
  if (fromCharge && isIso4217Currency(fromCharge)) {
    return fromCharge;
  }
  const fromSale = sale.currency?.trim()?.toUpperCase();
  if (fromSale && isIso4217Currency(fromSale)) {
    return fromSale;
  }
  const fallback = platformDefault?.trim()?.toUpperCase();
  if (fallback && isIso4217Currency(fallback)) {
    return fallback;
  }
  return DEFAULT_CURRENCY;
}

export function resolveSaleAmountValue(
  sale: Pick<Sale, 'total_price' | 'price' | 'charge'>,
): number {
  const fromCharge = sale.charge?.amount?.total?.val;
  if (typeof fromCharge === 'number' && Number.isFinite(fromCharge)) {
    return fromCharge;
  }
  if (typeof sale.total_price === 'number' && Number.isFinite(sale.total_price)) {
    return sale.total_price;
  }
  if (typeof sale.price === 'number' && Number.isFinite(sale.price)) {
    return sale.price;
  }
  return 0;
}

export function formatSaleAmount(
  sale: Pick<Sale, 'total_price' | 'price' | 'charge' | 'currency'>,
  locale?: string,
  platformDefault?: string,
): string {
  return formatIsoFiatAmount(
    resolveSaleAmountValue(sale),
    resolveSaleCurrency(sale, platformDefault),
    locale,
  );
}
