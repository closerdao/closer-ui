import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const MONGO_ID_REGEX = /^[a-f\d]{24}$/i;

/**
 * Below this length a term is too noisy to resolve guests for — an "a" would
 * match most of the user base.
 */
export const BOOKING_SEARCH_MIN_LENGTH = 2;

// Day formats are tried before month formats so `03/2026` is read as a month
// rather than failing as a malformed day.
const DAY_FORMATS = [
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'D/M/YYYY',
  'DD-MM-YYYY',
  'DD.MM.YYYY',
  'DD/MM',
  'D/M',
];

const MONTH_FORMATS = ['YYYY-MM', 'MM/YYYY', 'MMMM YYYY', 'MMM YYYY', 'MMMM'];

export interface BookingSearchDateRange {
  from: Date;
  to: Date;
}

export interface BookingSearchRow {
  _id?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  listingName?: string | null;
  status?: string | null;
  start?: string | number | Date | null;
  end?: string | number | Date | null;
}

export function isBookingIdSearch(term: string): boolean {
  return MONGO_ID_REGEX.test(term.trim());
}

/**
 * Reads a search term as a date, returning the range it covers: a single day
 * for `2026-03-12` or `12/03/2026`, the whole month for `2026-03` or `March`.
 * Formats without a year fall back to the current year.
 */
export function parseBookingSearchDate(
  term: string,
): BookingSearchDateRange | null {
  const trimmed = term.trim();
  if (!trimmed) {
    return null;
  }

  for (const format of DAY_FORMATS) {
    const parsed = dayjs(trimmed, format, true);
    if (parsed.isValid()) {
      return {
        from: parsed.startOf('day').toDate(),
        to: parsed.endOf('day').toDate(),
      };
    }
  }

  for (const format of MONTH_FORMATS) {
    const parsed = dayjs(trimmed, format, true);
    if (parsed.isValid()) {
      return {
        from: parsed.startOf('month').toDate(),
        to: parsed.endOf('month').toDate(),
      };
    }
  }

  return null;
}

/**
 * Builds the `where` fragment for a search term. Guest names live on the user
 * collection, so `userIds` must already be resolved by the caller; a term that
 * resolves to nothing at all yields a clause that matches no bookings, so an
 * unmatched search shows an empty list rather than silently showing everything.
 */
export function buildBookingSearchWhere({
  term,
  userIds,
}: {
  term: string;
  userIds?: string[] | null;
}): Record<string, any> | null {
  const trimmed = term.trim();
  if (!trimmed) {
    return null;
  }

  const clauses: Record<string, any>[] = [];

  if (isBookingIdSearch(trimmed)) {
    clauses.push({ _id: trimmed });
  }

  if (userIds && userIds.length > 0) {
    clauses.push({ createdBy: { $in: userIds } });
    clauses.push({ paidBy: { $in: userIds } });
  }

  const dateRange = parseBookingSearchDate(trimmed);
  if (dateRange) {
    clauses.push({
      $and: [
        { start: { $lte: dateRange.to } },
        { end: { $gte: dateRange.from } },
      ],
    });
  }

  if (clauses.length === 0) {
    return { _id: { $in: [] } };
  }

  return { $or: clauses };
}

/**
 * Combines a page's base `where` with a search clause. Both sides may use the
 * same top-level operator (the requests page already filters on `$or`), so
 * colliding keys are moved into `$and` instead of overwriting each other.
 */
export function mergeBookingSearchWhere(
  base?: Record<string, any> | null,
  searchWhere?: Record<string, any> | null,
): Record<string, any> {
  const merged: Record<string, any> = { ...(base ?? {}) };

  if (!searchWhere || Object.keys(searchWhere).length === 0) {
    return merged;
  }

  const and: Record<string, any>[] = Array.isArray(merged.$and)
    ? [...merged.$and]
    : [];
  delete merged.$and;

  for (const [key, value] of Object.entries(searchWhere)) {
    if (key in merged) {
      and.push({ [key]: merged[key] });
      and.push({ [key]: value });
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }

  if (and.length > 0) {
    merged.$and = and;
  }

  return merged;
}

/**
 * Client-side equivalent of {@link buildBookingSearchWhere}, for lists that
 * already hold every row in memory (the current-bookings tables).
 */
export function matchesBookingSearchTerm(
  row: BookingSearchRow,
  term: string,
): boolean {
  const trimmed = term.trim();
  if (!trimmed) {
    return true;
  }

  const needle = trimmed.toLowerCase();
  const fields = [
    row.guestName,
    row.guestEmail,
    row.listingName,
    row.status,
    row._id,
  ];

  if (
    fields.some(
      (field) => typeof field === 'string' && field.toLowerCase().includes(needle),
    )
  ) {
    return true;
  }

  const dateRange = parseBookingSearchDate(trimmed);
  if (dateRange && row.start != null && row.end != null) {
    const start = new Date(row.start).getTime();
    const end = new Date(row.end).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      return start <= dateRange.to.getTime() && end >= dateRange.from.getTime();
    }
  }

  return false;
}
