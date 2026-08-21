import { normalizeDiscountCode } from '../discountCode';

describe('normalizeDiscountCode', () => {
  it('trims and upper-cases a code the guest typed', () => {
    expect(normalizeDiscountCode('  citizen ')).toBe('CITIZEN');
  });

  it('reads the code out of a matched discount object', () => {
    expect(normalizeDiscountCode({ code: 'citizen' })).toBe('CITIZEN');
  });

  it('never renders an object that carries no code', () => {
    expect(normalizeDiscountCode({} as any)).toBe('');
    expect(normalizeDiscountCode({ code: null })).toBe('');
  });

  it('treats nothing as no code', () => {
    expect(normalizeDiscountCode(null)).toBe('');
    expect(normalizeDiscountCode(undefined)).toBe('');
    expect(normalizeDiscountCode('')).toBe('');
  });
});
