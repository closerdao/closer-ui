import { Charge } from 'closer/types/booking';
import { ToconlineDocument } from 'closer/types/expense';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const asDocumentArray = (raw: unknown): ToconlineDocument[] => {
  if (!Array.isArray(raw)) return [];
  return raw as ToconlineDocument[];
};

export const parseRevenueToconlineDocumentsPayload = (
  payload: unknown,
): ToconlineDocument[] => {
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.results)) {
    return asDocumentArray(payload.results);
  }
  const results = payload.results;
  if (isRecord(results) && Array.isArray(results.documents)) {
    return asDocumentArray(results.documents);
  }
  const data = payload.data;
  if (isRecord(data)) {
    if (Array.isArray(data.documents)) {
      return asDocumentArray(data.documents);
    }
    if (Array.isArray(data.entries)) {
      return asDocumentArray(data.entries);
    }
    if (Array.isArray(data)) {
      return asDocumentArray(data);
    }
  }
  if (Array.isArray(payload.documents)) {
    return asDocumentArray(payload.documents);
  }
  return [];
};

export const normalizeStripePaymentIntentLookupKey = (
  value: string | number | undefined | null,
): string | null => {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  return s === '' ? null : s;
};

export const buildToconlineDocumentsByExternalReference = (
  documents: ToconlineDocument[],
): Map<string, ToconlineDocument> => {
  const map = new Map<string, ToconlineDocument>();
  for (const doc of documents) {
    const rawRef = doc.external_reference;
    if (rawRef == null || typeof rawRef === 'object') continue;
    const key = normalizeStripePaymentIntentLookupKey(String(rawRef));
    if (key != null && !map.has(key)) {
      map.set(key, doc);
    }
  }
  return map;
};

export const getToconlineDocumentForChargeByStripePaymentIntent = (
  charge: Pick<Charge, 'meta'>,
  byExternalReference: ReadonlyMap<string, ToconlineDocument>,
): ToconlineDocument | undefined => {
  const pi = normalizeStripePaymentIntentLookupKey(
    charge.meta?.stripePaymentIntentId,
  );
  if (pi == null) return undefined;
  return byExternalReference.get(pi);
};
