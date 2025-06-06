import { BONDING_CURVE } from '../constants';



export const getCurrentUnitPrice = (currentSupply: number) => {

  console.log('currentSupply=',currentSupply);
  const { a, b, c } = BONDING_CURVE.COEFFICIENTS;
  const currentPrice = c + a / currentSupply ** 2 + b / currentSupply ** 3;
  return parseFloat(currentPrice.toFixed(2));
};

export const getTotalPrice = (currentSupply: number, amount: number) => {
  const { a, b, c } = BONDING_CURVE.COEFFICIENTS;

  const totalPrice =
    c * amount -
    a * (1 / (currentSupply + amount) - 1 / currentSupply) -
    (b / 2) * (1 / (currentSupply + amount) ** 2 - 1 / currentSupply ** 2);

  return parseInt(totalPrice.toFixed());
};
