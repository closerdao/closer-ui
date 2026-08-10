import { normalizeAccountingProductSlug } from '../constants/accountingEntities.constants';

export type SaleCategory = 'tokens' | 'donations' | 'lessons' | 'other';

const TOKENS_PRODUCT_TYPES = ['token', 'tokens'];
const DONATIONS_PRODUCT_TYPES = ['donation', 'donations'];
const LESSONS_PRODUCT_TYPES = ['lesson', 'lessons'];

const EXCLUDED_FROM_OTHER = [
  ...TOKENS_PRODUCT_TYPES,
  ...DONATIONS_PRODUCT_TYPES,
  ...LESSONS_PRODUCT_TYPES,
];

type SaleCategoryInput = {
  product_type?: string;
  charge?: { type?: string };
};

export function resolveSaleCategory(sale: SaleCategoryInput): SaleCategory {
  const productType = sale.product_type?.trim();
  if (productType) {
    const normalized = normalizeAccountingProductSlug(productType);
    if (normalized === 'tokens') return 'tokens';
    if (normalized === 'donations') return 'donations';
    if (normalized === 'lessons') return 'lessons';
    if (TOKENS_PRODUCT_TYPES.includes(productType)) return 'tokens';
    if (DONATIONS_PRODUCT_TYPES.includes(productType)) return 'donations';
    if (LESSONS_PRODUCT_TYPES.includes(productType)) return 'lessons';
  }

  const chargeType = sale.charge?.type?.trim();
  if (chargeType === 'donation') return 'donations';
  if (chargeType === 'tokenSale' || chargeType === 'fiatTokenSale') return 'tokens';

  return 'other';
}

export function isTokenProductSale(sale: SaleCategoryInput): boolean {
  return resolveSaleCategory(sale) === 'tokens';
}

export function saleCategoryToPlatformWhere(
  category: SaleCategory,
): Record<string, unknown> {
  switch (category) {
    case 'tokens':
      return { product_type: { $in: TOKENS_PRODUCT_TYPES } };
    case 'donations':
      return { product_type: { $in: DONATIONS_PRODUCT_TYPES } };
    case 'lessons':
      return { product_type: { $in: LESSONS_PRODUCT_TYPES } };
    case 'other':
      return { product_type: { $nin: EXCLUDED_FROM_OTHER } };
    default:
      return {};
  }
}

export function mergeSaleListWhere(
  category: SaleCategory,
  statusFilter: string,
): Record<string, unknown> {
  const categoryWhere = saleCategoryToPlatformWhere(category);
  const statusWhere =
    statusFilter === 'all' ? {} : { status: statusFilter };
  if (Object.keys(statusWhere).length === 0) {
    return categoryWhere;
  }
  return { $and: [categoryWhere, statusWhere] };
}

export function saleCategoryLabelKey(category: SaleCategory): string {
  const map: Record<SaleCategory, string> = {
    tokens: 'sales_dashboard_tab_tokens',
    donations: 'sales_dashboard_tab_donations',
    lessons: 'sales_dashboard_tab_lessons',
    other: 'sales_dashboard_tab_other',
  };
  return map[category];
}
