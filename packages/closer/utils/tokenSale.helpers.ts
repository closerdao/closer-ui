import { SALES_CONFIG } from '../constants/shared.constants';
import { TokenSale } from '../types/api';
import api, { formatSearch } from './api';

const MAX_TX = SALES_CONFIG.MAX_TOKENS_PER_TRANSACTION;

export async function fetchTokenSaleById(
  saleId: string,
  options?: { cache?: boolean },
): Promise<TokenSale | null> {
  try {
    const res = await api.get('/sale', {
      params: {
        where: formatSearch({ _id: saleId }),
        limit: 1,
      },
      ...(options?.cache === false ? { cache: false as const } : {}),
    } as Parameters<typeof api.get>[1]);
    const rows = res?.data?.results;
    const list = Array.isArray(rows) ? rows : [];
    return (list[0] as TokenSale | null) ?? null;
  } catch {
    return null;
  }
}

const WAIT_PAID_MAX_ATTEMPTS = 10;
const WAIT_PAID_INTERVAL_MS = 400;

export async function waitForTokenSalePaidStatus(
  saleId: string,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<TokenSale | null> {
  const maxAttempts = options?.maxAttempts ?? WAIT_PAID_MAX_ATTEMPTS;
  const intervalMs = options?.intervalMs ?? WAIT_PAID_INTERVAL_MS;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const sale = await fetchTokenSaleById(saleId, { cache: false });
    if (sale?.status === 'paid') return sale;
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return fetchTokenSaleById(saleId, { cache: false });
}

export async function fetchTokenSaleQuantityForMetric(
  saleId: string,
): Promise<number> {
  const sale = await fetchTokenSaleById(saleId);
  const rawQty = sale?.quantity;
  if (typeof rawQty === 'number' && Number.isFinite(rawQty)) return rawQty;
  const n = parseInt(String(rawQty ?? ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export function checkoutTokensFromSaleQuantity(
  sale: TokenSale | null,
): string | null {
  if (!sale) return null;
  const rawQty = sale.quantity;
  const n =
    typeof rawQty === 'number' && Number.isFinite(rawQty)
      ? rawQty
      : parseInt(String(rawQty ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(Math.min(n, MAX_TX));
}

export function rawQuantityFromSale(sale: TokenSale | null): number {
  if (!sale) return NaN;
  const rawQty = sale.quantity;
  if (typeof rawQty === 'number' && Number.isFinite(rawQty)) return rawQty;
  return parseInt(String(rawQty ?? ''), 10);
}
