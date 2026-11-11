import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

// Legacy `POST /accounting/request-token-transactions?year=`: mails the year's token transaction CSVs.
export const requestTokenTransactions = async (year: string) => {
  if (!isTrpcEnabled('7.4a')) {
    const res = await api.post(
      `/accounting/request-token-transactions?year=${year}`,
    );
    return res.data;
  }
  return trpc.accounting.requestTokenTransactions
    .mutate({ year })
    .catch(throwApiError);
};
