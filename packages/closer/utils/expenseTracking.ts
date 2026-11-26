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

type DocumentsZipInput = Parameters<
  typeof trpc.expenseTracking.documentsZipToken.mutate
>[0];

// Legacy `POST /expense-tracking/documents-zip/token`, with the download route of the API that issued the token.
export const requestDocumentsZip = async (
  input: DocumentsZipInput,
): Promise<{ token: string; action: string }> => {
  const path = '/expense-tracking/documents-zip';
  if (!isTrpcEnabled('13.0a')) {
    const res = await api.post(`${path}/token`, {
      from: input.from,
      to: input.to,
      date_by: input.dateBy,
      toconline_document_type: input.toconlineDocumentType,
    });
    return { token: res.data.token, action: api.getUri({ url: path }) };
  }
  const { token } = await trpc.expenseTracking.documentsZipToken
    .mutate(input)
    .catch(throwApiError);
  // The tRPC server answers the download as plain HTTP on the origin that serves `/trpc`.
  const origin = (process.env.NEXT_PUBLIC_TRPC_URL ?? '').replace(
    /\/trpc\/?$/,
    '',
  );
  return { token, action: `${origin}${path}` };
};
