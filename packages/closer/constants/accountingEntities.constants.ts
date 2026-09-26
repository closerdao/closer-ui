export const ACCOUNTING_ENTITY_PRODUCT_SLUGS = [
  'events',
  'food',
  'accommodations',
  'utilities',
  'expenses',
  'terminal',
  'payment-link',
  'products',
  'subscriptions',
  'tokens',
  'financed-tokens',
  'donations',
  'lessons',
] as const;

export type AccountingEntityProductSlug =
  (typeof ACCOUNTING_ENTITY_PRODUCT_SLUGS)[number];

const LEGACY_PRODUCT_SLUG_ALIASES: Record<string, AccountingEntityProductSlug> =
  {
    donation: 'donations',
    token: 'tokens',
    lesson: 'lessons',
    'financed-token': 'financed-tokens',
  };

export function normalizeAccountingProductSlug(
  slug: string,
): AccountingEntityProductSlug | null {
  if ((ACCOUNTING_ENTITY_PRODUCT_SLUGS as readonly string[]).includes(slug)) {
    return slug as AccountingEntityProductSlug;
  }
  const mapped = LEGACY_PRODUCT_SLUG_ALIASES[slug];
  return mapped ?? null;
}

export const STAY_BUNDLE_PRODUCT_SLUGS: readonly AccountingEntityProductSlug[] =
  ['accommodations', 'food', 'events', 'utilities'];

export const STAY_BUNDLE_CHIP_SLUG: AccountingEntityProductSlug =
  'accommodations';

export function isStayBundleProductSlug(slug: string): boolean {
  return (STAY_BUNDLE_PRODUCT_SLUGS as readonly string[]).includes(slug);
}

const STAY_BUNDLE_HIDDEN_CHIPS = new Set(['food', 'events', 'utilities']);

export function accountingProductChipSlugs(enumSlugs: string[]): string[] {
  return enumSlugs.filter((slug) => !STAY_BUNDLE_HIDDEN_CHIPS.has(slug));
}

export function isStayBundleAssigned(products: string[]): boolean {
  return products.some((product) => isStayBundleProductSlug(product));
}

export function toggleStayBundleProducts(
  products: string[],
  select: boolean,
): string[] {
  const withoutBundle = products.filter(
    (product) => !isStayBundleProductSlug(product),
  );
  if (!select) {
    return withoutBundle;
  }
  return [...withoutBundle, ...STAY_BUNDLE_PRODUCT_SLUGS];
}

export const STRIPE_SELECTION_LOCKED_SLUGS = [
  'payment-link',
  'terminal',
  'expenses',
  'financed-tokens',
] as const;

export type StripeSelectionLockReason =
  'external' | 'expenses' | 'financed-tokens';

export function stripeSelectionLockReasons(
  products: string[],
): StripeSelectionLockReason[] {
  const selected = new Set(products.map(String));
  const reasons: StripeSelectionLockReason[] = [];
  if (selected.has('payment-link') || selected.has('terminal')) {
    reasons.push('external');
  }
  if (selected.has('expenses')) {
    reasons.push('expenses');
  }
  if (selected.has('financed-tokens')) {
    reasons.push('financed-tokens');
  }
  return reasons;
}

export function isStripeSelectionLocked(products: string[]): boolean {
  if (products.length === 0) {
    return false;
  }
  const locked = new Set<string>(STRIPE_SELECTION_LOCKED_SLUGS);
  return products.every((product) => locked.has(String(product)));
}

export function claimStayBundleExclusively<T extends { products?: string[] }>(
  elements: T[],
  ownerIndex: number,
): T[] {
  return elements.map((element, index) => {
    const products = Array.isArray(element?.products)
      ? element.products.map(String)
      : [];
    if (index === ownerIndex) {
      return {
        ...element,
        products: toggleStayBundleProducts(products, true),
      };
    }
    return {
      ...element,
      products: products.filter((product) => !isStayBundleProductSlug(product)),
    };
  });
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
  const assigned = [...set];
  const hasStayBundle = assigned.some((slug) => isStayBundleProductSlug(slug));
  const withoutBundleParts = assigned.filter(
    (slug) => !STAY_BUNDLE_HIDDEN_CHIPS.has(slug),
  );
  const withChip = hasStayBundle
    ? Array.from(new Set([...withoutBundleParts, STAY_BUNDLE_CHIP_SLUG]))
    : withoutBundleParts;
  return withChip.sort((a, b) => a.localeCompare(b));
}
