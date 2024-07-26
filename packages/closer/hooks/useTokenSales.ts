import { useEffect, useState } from 'react';

import { SalesResult, TokenTransaction } from '../types/dashboard';
import {
  getAllTokenTransactions,
  getTokenSales,
  getTokenSalesByDateRange,
} from '../utils/dashboard.helpers';

export const useTokenSales = () => {
  const [isBlcokchainLoading, setIsBlockchainLoading] = useState(false);
  const [allTokenSales, setAllTokenSales] = useState<SalesResult | null>();
  const [allTransactions, setAllTransactions] = useState<TokenTransaction[]>(
    [],
  );

  const getTokenSalesForDateRange = (startDate: string | Date, endDate: string | Date) => {
    
    return Number(getTokenSalesByDateRange(allTransactions, startDate, endDate)
      .totalSalesAmount) || 0;
  };

  useEffect(() => {
    (async () => {
      try {
        setIsBlockchainLoading(true)
        setAllTransactions(await getAllTokenTransactions());
        setAllTokenSales(getTokenSales(allTransactions));
      } catch (error) {
        console.log('Fetching from blockchain error:', error);
      } finally {
        setIsBlockchainLoading(false);
      }
    })();
  }, []);

  return { allTokenSales, getTokenSalesForDateRange, isBlcokchainLoading };
};
