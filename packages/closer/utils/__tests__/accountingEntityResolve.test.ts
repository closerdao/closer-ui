import {
  resolveAccountingEntityForProduct,
  resolveAccountingEntityFromSale,
} from '../accountingEntityResolve';
import type { AccountingEntityElement } from '../../types/api';

const elements: AccountingEntityElement[] = [
  {
    _id: 'a1',
    legalName: 'Traditional Dream Factory LDA',
    products: ['accommodations', 'food'],
    stripeAccount: 'default',
    walletAddress: '0x1111111111111111111111111111111111111111',
  },
  {
    _id: 'a2',
    legalName: 'OASA Association',
    products: ['donation', 'tokens'],
    stripeAccount: 'none',
  },
];

describe('resolveAccountingEntityForProduct', () => {
  it('finds the entity assigned to the product slug', () => {
    const entity = resolveAccountingEntityForProduct(
      'accommodations',
      elements,
    );
    expect(entity?._id).toBe('a1');
  });

  it('normalizes legacy product aliases on both sides', () => {
    // Query uses the canonical slug, the entity stores the legacy alias.
    expect(
      resolveAccountingEntityForProduct('donations', elements)?._id,
    ).toBe('a2');
    // Query uses the legacy alias.
    expect(resolveAccountingEntityForProduct('donation', elements)?._id).toBe(
      'a2',
    );
  });

  it('returns null when no entity covers the product', () => {
    expect(resolveAccountingEntityForProduct('events', elements)).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(resolveAccountingEntityForProduct('', elements)).toBeNull();
    expect(resolveAccountingEntityForProduct('food', undefined)).toBeNull();
    expect(resolveAccountingEntityForProduct('food', [])).toBeNull();
  });
});

describe('resolveAccountingEntityFromSale', () => {
  it('still resolves by id and legal name', () => {
    expect(resolveAccountingEntityFromSale('a2', elements)?._id).toBe('a2');
    expect(
      resolveAccountingEntityFromSale(
        'Traditional Dream Factory LDA',
        elements,
      )?._id,
    ).toBe('a1');
  });
});
