import type { AccountingEntityElement } from '../types/api';

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
