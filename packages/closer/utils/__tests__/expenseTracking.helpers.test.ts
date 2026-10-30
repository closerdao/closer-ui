import { ExpenseTrackingCombinedEntry } from '../../types/expense';
import {
  filterCombinedEntriesToExpenseFcToconlineDocuments,
  filterCombinedEntriesToIncomeFrToconlineDocuments,
  getExpenseDocumentDate,
  getRevenueChargeDate,
} from '../expenseTracking.helpers';

// Logged yesterday, but the linked document is dated last month.
const linkedCharge = (
  id: string,
  date: string,
  documentDate: string,
  documentType: string,
): ExpenseTrackingCombinedEntry => ({
  kind: 'charge',
  charge: { _id: id, date },
  toconline: {
    status: 'linked',
    document: { id: 1, date: documentDate, document_type: documentType },
  },
});

describe('expense vs revenue charge dates', () => {
  const entry = linkedCharge('a', '2026-10-29T10:00:00Z', '2026-09-15', 'FR');

  it('expenses show the document date, revenue keeps the charge date', () => {
    if (entry.kind !== 'charge') throw new Error('expected a charge');
    expect(getExpenseDocumentDate(entry.charge, entry.toconline)).toBe(
      '2026-09-15',
    );
    expect(getRevenueChargeDate(entry.charge, entry.toconline)).toBe(
      '2026-10-29T10:00:00Z',
    );
  });

  it('sorts expenses by document date and revenue by charge date', () => {
    const recentDocOldCharge = linkedCharge(
      'b',
      '2026-10-01T10:00:00Z',
      '2026-09-30',
      'FC',
    );
    const oldDocRecentCharge = linkedCharge(
      'c',
      '2026-10-20T10:00:00Z',
      '2026-08-01',
      'FC',
    );
    const ids = (entries: ExpenseTrackingCombinedEntry[]) =>
      entries.map((e) => (e.kind === 'charge' ? e.charge._id : ''));

    expect(
      ids(
        filterCombinedEntriesToExpenseFcToconlineDocuments([
          oldDocRecentCharge,
          recentDocOldCharge,
        ]),
      ),
    ).toEqual(['b', 'c']);
    expect(
      ids(
        filterCombinedEntriesToIncomeFrToconlineDocuments([
          linkedCharge('b', '2026-10-01T10:00:00Z', '2026-09-30', 'FR'),
          linkedCharge('c', '2026-10-20T10:00:00Z', '2026-08-01', 'FR'),
        ]),
      ),
    ).toEqual(['c', 'b']);
  });
});
