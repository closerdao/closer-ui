export interface TokenTransaction {
  fromAddressHash: string;
  toAddressHash: string;
  amount: string;
  timeStamp: string;
  topics: string[];
}

export interface SalesResult {
  salesCount: number;
  totalSalesAmount: string;
}

export type RevenueCategorySums = {
  tokenSales: number | null;
  cryptoTokenSales: number | null;
  events: number | null;
  rental: number | null;
  food: number | null;
  utilities: number | null;
  subscriptions: number | null;
  refunds: number | null;
  connectFee: number | null;
  stripeProcessingFee: number | null;
  other: number | null;
};

export type RevenueHeadlineTotals = {
  netRevenue: number;
  tax: number;
  transactions: number;
};
