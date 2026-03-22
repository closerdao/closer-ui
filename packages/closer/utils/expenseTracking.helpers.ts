import dayjs from 'dayjs';

import {
  ExpenseTrackingChargeRow,
  ExpenseTrackingCombinedEntry,
  ExpenseTrackingToconlineLink,
  ToconlineDocument,
} from 'closer/types/expense';

export type ToconlineRowUiState =
  | { kind: 'na' }
  | { kind: 'linked'; doc: ToconlineDocument }
  | { kind: 'pending' };

export const toconlineLinkToRowUiState = (
  link: ExpenseTrackingToconlineLink,
): ToconlineRowUiState => {
  if (link.status === 'none') {
    return { kind: 'na' };
  }
  if (link.status === 'linked') {
    return { kind: 'linked', doc: link.document };
  }
  return { kind: 'pending' };
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const normalizeToconlineLink = (
  raw: unknown,
): ExpenseTrackingToconlineLink | null => {
  if (!isRecord(raw)) return null;
  const status = raw.status;
  if (status === 'none') {
    return { status: 'none' };
  }
  if (status === 'linked' && isRecord(raw.document)) {
    return {
      status: 'linked',
      document: raw.document as unknown as ToconlineDocument,
    };
  }
  if (status === 'pending') {
    const idRaw = raw.toconlineDocumentId;
    const n = Number(idRaw);
    if (Number.isFinite(n) && n >= 1) {
      return { status: 'pending', toconlineDocumentId: n };
    }
  }
  return null;
};

const normalizeCombinedEntry = (
  raw: unknown,
): ExpenseTrackingCombinedEntry | null => {
  if (!isRecord(raw)) return null;
  const kind = raw.kind;
  if (kind === 'charge' && isRecord(raw.charge)) {
    const toconline = normalizeToconlineLink(raw.toconline);
    if (!toconline) return null;
    return {
      kind: 'charge',
      charge: raw.charge as unknown as ExpenseTrackingChargeRow,
      toconline,
    };
  }
  if (
    (kind === 'toconline_orphan' ||
      kind === 'toconlineOrphan' ||
      kind === 'toconline_only') &&
    isRecord(raw.document)
  ) {
    return {
      kind: 'toconline_orphan',
      document: raw.document as unknown as ToconlineDocument,
    };
  }
  return null;
};

const coerceUnknownToEpochMs = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === 'string') {
    const d = dayjs(value);
    if (d.isValid()) return d.valueOf();
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : t;
  }
  return null;
};

const mongoObjectIdStringToEpochMs = (id: unknown): number | null => {
  if (typeof id !== 'string' || id.length !== 24) return null;
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const seconds = parseInt(id.slice(0, 8), 16);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
};

const getChargeRowEpochMs = (
  charge: ExpenseTrackingChargeRow,
  toconline: ExpenseTrackingToconlineLink,
): number => {
  const candidates: unknown[] = [
    charge.date,
    charge.created,
    charge.meta?.toconlineData?.document_date,
  ];
  if (toconline.status === 'linked') {
    candidates.push(toconline.document.date);
  }
  for (const v of candidates) {
    const ms = coerceUnknownToEpochMs(v);
    if (ms != null) return ms;
  }
  const fromId = mongoObjectIdStringToEpochMs(charge._id);
  if (fromId != null) return fromId;
  return 0;
};

export const getCombinedEntryRowKey = (
  entry: ExpenseTrackingCombinedEntry,
): string => {
  if (entry.kind === 'charge') {
    return entry.charge._id;
  }
  const id = entry.document.id;
  if (id != null && Number.isFinite(Number(id))) {
    return `toconline-orphan-${String(id)}`;
  }
  const oid = entry.document._id;
  if (oid && typeof oid === 'object' && '$oid' in oid) {
    return `toconline-orphan-${String((oid as { $oid: string }).$oid)}`;
  }
  return `toconline-orphan-${String(oid ?? '')}`;
};

export const getCombinedEntryDateSortMs = (
  entry: ExpenseTrackingCombinedEntry,
): number => {
  if (entry.kind === 'charge') {
    return getChargeRowEpochMs(entry.charge, entry.toconline);
  }
  const doc = entry.document;
  const oidStr =
    typeof doc._id === 'string'
      ? doc._id
      : doc._id &&
          typeof doc._id === 'object' &&
          '$oid' in doc._id &&
          typeof (doc._id as { $oid: string }).$oid === 'string'
        ? (doc._id as { $oid: string }).$oid
        : undefined;
  const fromDoc =
    coerceUnknownToEpochMs(doc.date) ?? mongoObjectIdStringToEpochMs(oidStr);
  return fromDoc ?? 0;
};

export const sortCombinedExpenseEntriesByDateDesc = (
  entries: ExpenseTrackingCombinedEntry[],
): ExpenseTrackingCombinedEntry[] => {
  return [...entries].sort((a, b) => {
    const mb = getCombinedEntryDateSortMs(b);
    const ma = getCombinedEntryDateSortMs(a);
    if (mb !== ma) return mb - ma;
    return getCombinedEntryRowKey(b).localeCompare(
      getCombinedEntryRowKey(a),
    );
  });
};

export const parseExpenseTrackingCombinedEntriesPayload = (
  payload: unknown,
): { entries: ExpenseTrackingCombinedEntry[]; total: number } => {
  if (!isRecord(payload)) {
    return { entries: [], total: 0 };
  }
  const resultsBlock = isRecord(payload.results)
    ? payload.results
    : isRecord(payload.data)
      ? payload.data
      : payload;
  const entriesRaw = resultsBlock.entries;
  const totalRaw = resultsBlock.total;
  const total =
    typeof totalRaw === 'number' && !Number.isNaN(totalRaw)
      ? totalRaw
      : Number(totalRaw) || 0;
  if (!Array.isArray(entriesRaw)) {
    return { entries: [], total };
  }
  const entries: ExpenseTrackingCombinedEntry[] = [];
  for (const item of entriesRaw) {
    const normalized = normalizeCombinedEntry(item);
    if (normalized) entries.push(normalized);
  }
  return {
    entries: sortCombinedExpenseEntriesByDateDesc(entries),
    total,
  };
};
