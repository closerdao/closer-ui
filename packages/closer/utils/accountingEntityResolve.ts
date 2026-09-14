import { normalizeAccountingProductSlug } from '../constants/accountingEntities.constants';
import type { AccountingEntityElement } from '../types/api';

/**
 * The entity a payment for the given product type goes to: the first entity
 * whose `products` assignment covers the (normalized) slug.
 */
export function resolveAccountingEntityForProduct(
  productSlug: string | undefined,
  elements: AccountingEntityElement[] | undefined,
): AccountingEntityElement | null {
  if (!productSlug?.trim() || !elements?.length) return null;
  const normalized =
    normalizeAccountingProductSlug(productSlug.trim()) ?? productSlug.trim();
  return (
    elements.find((e) =>
      e?.products?.some(
        (p) => (normalizeAccountingProductSlug(String(p)) ?? p) === normalized,
      ),
    ) ?? null
  );
}

export function resolveAccountingEntityFromSale(
  entityKey: string | undefined,
  elements: AccountingEntityElement[] | undefined,
): AccountingEntityElement | null {
  if (!entityKey?.trim() || !elements?.length) return null;
  const key = entityKey.trim();
  const byId = elements.find((e) => e._id != null && String(e._id) === key);
  if (byId) return byId;
  const byLegalName = elements.find((e) => e.legalName?.trim() === key);
  if (byLegalName) return byLegalName;
  return null;
}
