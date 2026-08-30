import { isInputValid } from '../helpers';

describe('tax number validation', () => {
  it('accepts international VAT / TIN formats', () => {
    const valid = [
      'PT516493388', // Portugal, with country prefix
      '516493388', // Portugal, without country prefix
      'NL000002319B42', // Netherlands, letter inside the body
      'CHE-383.711.471', // Switzerland, dotted and hyphenated
      'CHE-116.281.710 MWST', // Switzerland, with the VAT suffix
      'DK12345678',
      'IE1234567FA',
      'GB123 4567 89',
      'FR 40 303 265 045',
      'ATU99999999',
    ];

    valid.forEach((taxNo) => {
      expect(isInputValid(taxNo, 'taxNo')).toBe(true);
    });
  });

  it('treats an empty value as valid because the field is optional', () => {
    expect(isInputValid('', 'taxNo')).toBe(true);
  });

  it('rejects values that cannot be a tax identifier', () => {
    const invalid = [
      '1234', // too short
      'abcd', // too short
      '$$$$$$', // no alphanumerics
      '123_456', // unsupported separator
      'name@example.com',
      '12345678901234567890123', // too long
    ];

    invalid.forEach((taxNo) => {
      expect(isInputValid(taxNo, 'taxNo')).toBe(false);
    });
  });
});
