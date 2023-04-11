export enum CloserCurrencies {
  EUR = 'EUR',
  ETH = 'ETH',
  TDF = 'TDF',
}

export type Currency<T extends CloserCurrencies> = {
  val: number;
  cur: T;
};
