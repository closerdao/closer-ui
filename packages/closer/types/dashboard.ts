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
