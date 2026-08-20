import type { SaleCategory } from './saleCategory';

export type SalesHubTab = 'financed' | SaleCategory;

export const SALES_HUB_DEFAULT_TAB: SalesHubTab = 'tokens';

export const SALES_HUB_PRODUCT_TABS: SaleCategory[] = [
  'tokens',
  'donations',
  'lessons',
  'other',
];

const SALES_HUB_TAB_IDS: SalesHubTab[] = [
  ...SALES_HUB_PRODUCT_TABS,
  'financed',
];

export function isSalesHubTab(value: string): value is SalesHubTab {
  return (SALES_HUB_TAB_IDS as string[]).includes(value);
}

export function salesHubTabPath(tab: SalesHubTab): string {
  return `/dashboard/sales/${tab}`;
}
