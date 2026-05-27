import type { Sale, SaleBuyer } from '../types/api';
import { isTokenProductSale } from './saleCategory';

export type SaleParticipant = {
  label: string;
  email?: string;
  memberId?: string;
  isGuest: boolean;
};

type SaleWithBuyer = Sale & { buyer?: SaleBuyer | null };

export function getSaleParticipant(sale: SaleWithBuyer): SaleParticipant | null {
  if (sale.buyer?._id) {
    return {
      label:
        sale.buyer.screenname?.trim() ||
        sale.buyer.email?.trim() ||
        sale.buyer._id,
      email: sale.buyer.email,
      memberId: sale.buyer._id,
      isGuest: false,
    };
  }

  const meta = sale.meta;
  const chargeMeta = sale.charge?.meta;
  const senderName = chargeMeta?.senderName?.trim();
  const userName = meta?.userName?.trim();
  const email = sale.email?.trim() || chargeMeta?.userEmail?.trim();
  const name = sale.name?.trim();

  let label = senderName || userName || '';
  if (!label && name && !name.includes('@')) {
    label = name;
  }
  if (!label) {
    label = email || name || '';
  }

  if (!label && !sale.createdBy) {
    return null;
  }

  return {
    label: label || '—',
    email: email || undefined,
    memberId: sale.createdBy || undefined,
    isGuest: true,
  };
}

export function saleNeedsAttentionHighlight(
  sale: SaleWithBuyer,
  participant: SaleParticipant | null,
): boolean {
  if (!isTokenProductSale(sale)) {
    return false;
  }
  if (participant) {
    return false;
  }
  return sale.status !== 'matched';
}

export function getSaleProductTitle(sale: Sale, category: string): string {
  if (isTokenProductSale(sale)) {
    return sale.name?.trim() || category;
  }
  const meta = sale.meta;
  const chargeMeta = sale.charge?.meta;
  if (chargeMeta?.productType) {
    return String(chargeMeta.productType);
  }
  return sale.product_type?.trim() || category;
}
