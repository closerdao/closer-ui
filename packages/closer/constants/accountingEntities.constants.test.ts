import {
  accountingProductChipSlugs,
  claimStayBundleExclusively,
  collectAssignedAccountingProductSlugs,
  isStayBundleAssigned,
  isStripeSelectionLocked,
  toggleStayBundleProducts,
} from './accountingEntities.constants';

describe('stay bundle accounting products', () => {
  it('hides food and events from the product chips', () => {
    expect(
      accountingProductChipSlugs([
        'events',
        'food',
        'accommodations',
        'products',
      ]),
    ).toEqual(['accommodations', 'products']);
  });

  it('treats stays, food, or events as the combined chip', () => {
    expect(isStayBundleAssigned(['food'])).toBe(true);
    expect(isStayBundleAssigned(['accommodations'])).toBe(true);
    expect(isStayBundleAssigned(['events'])).toBe(true);
    expect(isStayBundleAssigned(['products'])).toBe(false);
  });

  it('assigns and clears accommodations, food, and events together', () => {
    expect(toggleStayBundleProducts(['products'], true)).toEqual([
      'products',
      'accommodations',
      'food',
      'events',
      'utilities',
    ]);
    expect(
      toggleStayBundleProducts(
        ['products', 'accommodations', 'food', 'events', 'utilities'],
        false,
      ),
    ).toEqual(['products']);
  });

  it('keeps the bundle on one entity', () => {
    expect(
      claimStayBundleExclusively(
        [{ products: ['events'] }, { products: ['products'] }],
        1,
      ),
    ).toEqual([
      { products: [] },
      {
        products: ['products', 'accommodations', 'food', 'events', 'utilities'],
      },
    ]);
  });

  it('surfaces the combined chip once for VAT', () => {
    expect(
      collectAssignedAccountingProductSlugs([{ products: ['food', 'events'] }]),
    ).toEqual(['accommodations']);
  });

  it('locks Stripe selection only when every category is non-routable', () => {
    expect(isStripeSelectionLocked(['payment-link'])).toBe(true);
    expect(isStripeSelectionLocked(['terminal', 'expenses'])).toBe(true);
    expect(isStripeSelectionLocked(['financed-tokens'])).toBe(true);
    expect(isStripeSelectionLocked(['payment-link', 'products'])).toBe(false);
    expect(isStripeSelectionLocked(['lessons'])).toBe(false);
  });
});
