import { getAccommodationCost } from '../helpers';

describe('getAccommodationCost', () => {
  test('returns rental token value when useTokens is true', () => {
    const rentalToken = { val: 5 };
    const cost = getAccommodationCost(true, rentalToken, null, null);
    expect(cost).toEqual(rentalToken.val);
  });

  test('returns 0 if volunteerId is defined', () => {
    const cost = getAccommodationCost(false, null, null, 123);
    expect(cost).toEqual(0);
  });

  test('returns rental fiat value when neither useTokens nor volunteerId are present', () => {
    const rentalFiat = { val: 20 };
    const cost = getAccommodationCost(false, null, rentalFiat, null);
    expect(cost).toEqual(rentalFiat.val);
  });
});
