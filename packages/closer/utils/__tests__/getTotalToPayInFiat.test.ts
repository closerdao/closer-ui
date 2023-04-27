import { getTotalToPayInFiat } from '../helpers';

describe('getTotalToPayInFiat', () => {
  test('returns correct value when useTokens is true - count only utility price', () => {
    const utilityFiat = { val: 10 };
    const totalToPay = getTotalToPayInFiat(true, utilityFiat, null, null, null);
    expect(totalToPay).toEqual(utilityFiat.val);
  });

  test('returns correct value when eventPrice is defined - sum of utility, event end rent prices', () => {
    const utilityFiat = { val: 10 };
    const eventPrice = { val: 20 };
    const rentalFiat = { val: 5 };
    const totalToPay = getTotalToPayInFiat(
      false,
      utilityFiat,
      eventPrice,
      rentalFiat,
      null,
    );
    expect(totalToPay).toEqual(
      utilityFiat.val + eventPrice.val + rentalFiat.val,
    );
  });

  test('returns correct value when volunteerId is defined - count only utility price', () => {
    const utilityFiat = { val: 10 };
    const volunteerId = 'abc';
    const totalToPay = getTotalToPayInFiat(
      false,
      utilityFiat,
      null,
      null,
      volunteerId,
    );
    expect(totalToPay).toEqual(utilityFiat.val);
  });

  test('returns correct value when none of the conditions are met - sum of utility and rent prices', () => {
    const utilityFiat = { val: 10 };
    const rentalFiat = { val: 5 };
    const totalToPay = getTotalToPayInFiat(
      false,
      utilityFiat,
      null,
      rentalFiat,
      null,
    );
    expect(totalToPay).toEqual(utilityFiat.val + rentalFiat.val);
  });
});
