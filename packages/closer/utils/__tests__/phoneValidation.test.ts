import { isInputValid } from '../helpers';
import { PHONE_PATTERN } from '../validationPatterns';

describe('phone validation', () => {
  it('accepts national formats that are not grouped 3-3-4', () => {
    const valid = [
      '+4522329888', // Denmark, 8 digits after the country code
      '+45 22 32 98 88',
      '+44 20 7946 0958', // United Kingdom
      '+49 30 123456', // Germany
      '+351 912 345 678', // Portugal
      '+1 (555) 123-4567', // North America
      '5551234567',
      '912345678',
    ];

    valid.forEach((phone) => {
      expect(PHONE_PATTERN.test(phone)).toBe(true);
      expect(isInputValid(phone, 'phone')).toBe(true);
    });
  });

  it('rejects values that cannot be a phone number', () => {
    const invalid = [
      '',
      'not a phone',
      '1234', // fewer than five digits
      '+', //
      '1234567890123456', // past the E.164 ceiling
      '+1-555-CALL-NOW',
    ];

    invalid.forEach((phone) => {
      expect(PHONE_PATTERN.test(phone)).toBe(false);
    });
  });
});
