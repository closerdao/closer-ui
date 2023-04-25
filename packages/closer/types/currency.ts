export enum CloserCurrencies {
  EUR = 'EUR',
  ETH = 'ETH',
  TDF = 'TDF',
}

export type Price<T extends CloserCurrencies> = {
  val: number;
  cur: T;
};
