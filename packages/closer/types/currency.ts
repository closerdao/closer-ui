export enum CloserCurrencies {
  EUR = 'EUR',
  ETH = 'ETH',
  Token = 'TDF',
  USD = 'USD',
}

export type Price<T extends CloserCurrencies> = {
  val: number;
  cur: T;
};
