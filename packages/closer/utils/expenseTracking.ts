import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type CombinedEntriesInput = Parameters<
  typeof trpc.expenseTracking.entries.query
>[0];

// Legacy `GET /expense-tracking/combined-entries`; `forceRefresh` busts the axios GET cache, which tRPC does not have.
export const fetchCombinedEntries = async (
  input: CombinedEntriesInput,
  forceRefresh = false,
): Promise<unknown> => {
  if (!isTrpcEnabled('8.4a')) {
    const res = await api.get('/expense-tracking/combined-entries', {
      params: {
        from: input.from,
        to: input.to,
        page: input.page,
        limit: input.limit,
        sort_by: '-date',
        date_by: input.dateBy,
        toconline_document_type: input.toconlineDocumentType,
        ...(forceRefresh && { _refresh: Date.now() }),
      },
    });
    return res.data;
  }
  return trpc.expenseTracking.entries.query(input).catch(throwApiError);
};
