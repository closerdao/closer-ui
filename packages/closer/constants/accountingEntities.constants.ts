export const ACCOUNTING_ENTITY_PRODUCT_SLUGS = [
  'events',
  'food',
  'accommodations',
  'expenses',
  'terminal',
  'payment-link',
  'products',
  'subscriptions',
  'tokens',
  'donations',
  'lessons',
] as const;

export type AccountingEntityProductSlug =
  (typeof ACCOUNTING_ENTITY_PRODUCT_SLUGS)[number];

const LEGACY_PRODUCT_SLUG_ALIASES: Record<string, AccountingEntityProductSlug> =
  {
    donation: 'donations',
  };

export function normalizeAccountingProductSlug(
  slug: string,
): AccountingEntityProductSlug | null {
  if (
    (ACCOUNTING_ENTITY_PRODUCT_SLUGS as readonly string[]).includes(slug)
  ) {
    return slug as AccountingEntityProductSlug;
  }
  const mapped = LEGACY_PRODUCT_SLUG_ALIASES[slug];
  return mapped ?? null;
}

export function collectAssignedAccountingProductSlugs(
  elements: unknown[],
): AccountingEntityProductSlug[] {
  const set = new Set<AccountingEntityProductSlug>();
  for (const el of elements) {
    if (!el || typeof el !== 'object') continue;
    const products = (el as { products?: string[] }).products;
    if (!Array.isArray(products)) continue;
    for (const p of products) {
      const n = normalizeAccountingProductSlug(String(p));
      if (n) set.add(n);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
