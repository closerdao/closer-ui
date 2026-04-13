import React, { useCallback, useMemo, useState } from 'react';

import {
  ExpenseTrackingCombinedEntry,
  ToconlineDocument,
} from 'closer/types/expense';
import {
  ToconlineRowUiState,
  getCombinedEntryRowKey,
  toconlineLinkToRowUiState,
} from 'closer/utils/expenseTracking.helpers';
import { useTranslations } from 'next-intl';

import ToconlineDocumentDialog from '../expense-tracking/ToconlineDocumentDialog';
import { Button, Heading, LinkButton } from '../ui';
import {
  formatIsoFiatAmount,
  isIso4217Currency,
} from '../../utils/currencyFormat';

import MultiSelect from '../ui/Select/MultiSelect';

const renderIncomeToconlineCell = (
  state: ToconlineRowUiState,
  t: ReturnType<typeof useTranslations>,
  onOpenToconline: (doc: ToconlineDocument) => void,
): React.ReactNode => {
  if (state.kind === 'na') {
    return (
      <span className="text-gray-400 text-xs">
        {t('expense_tracking_toconline_na')}
      </span>
    );
  }
  if (state.kind === 'linked') {
    return (
      <div className="flex gap-1 items-center">
        <Button
          type="button"
          onClick={() => onOpenToconline(state.doc)}
          variant="secondary"
          size="small"
          className="text-xs py-0 min-h-[24px] w-fit px-2"
        >
          {t('expense_tracking_view_doc')}
        </Button>
        {state.doc.public_link && (
          <LinkButton
            href={state.doc.public_link}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="small"
            className="text-xs py-0 min-h-[24px] w-fit px-2"
          >
            PDF
          </LinkButton>
        )}
      </div>
    );
  }
  return (
    <span className="text-amber-700 text-xs bg-yellow-100 rounded-full px-2 py-1">
      {t('expense_tracking_toconline_sync_pending')}
    </span>
  );
};

interface ChargesTableProps {
  entries: ExpenseTrackingCombinedEntry[];
  loading?: boolean;
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}

const ChargesTable: React.FC<ChargesTableProps> = ({
  entries,
  loading = false,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 50,
}) => {
  const t = useTranslations();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [toconlineDialogOpen, setToconlineDialogOpen] = useState(false);
  const [toconlineDocument, setToconlineDocument] =
    useState<ToconlineDocument | null>(null);

  const openToconlineDocument = useCallback((doc: ToconlineDocument) => {
    setToconlineDocument(doc);
    setToconlineDialogOpen(true);
  }, []);

  const availableTypes = useMemo(() => {
    const types = [
      ...new Set(
        entries
          .map((entry) =>
            entry.kind === 'charge' ? (entry.charge as any).type : undefined,
          )
          .filter(Boolean),
      ),
    ];
    return types.sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (selectedTypes.length === 0) {
      return entries;
    }
    return entries.filter((entry) => {
      if (entry.kind === 'charge') {
        return selectedTypes.includes((entry.charge as any).type);
      }
      return true; // keep orphans
    });
  }, [entries, selectedTypes]);

  const formatCurrency = (
    amount: { val: number; cur: string } | null | undefined,
  ) => {
    if (!amount || !amount.cur || amount.val == null) {
      return 'N/A';
    }

    let currencyCode = amount.cur.toUpperCase();
    if (currencyCode === 'EUR STABLECOIN') {
      currencyCode = 'EUR';
    }

    if (isIso4217Currency(currencyCode)) {
      return formatIsoFiatAmount(amount.val, currencyCode);
    }
    return `${amount.val.toFixed(2)} ${amount.cur}`;
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      case 'pending-payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending-refund':
        return 'bg-orange-100 text-orange-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    switch (type) {
      case 'booking':
        return 'bg-emerald-100 text-emerald-800';
      case 'subscription':
        return 'bg-fuchsia-100 text-fuchsia-800';
      case 'product':
        return 'bg-indigo-100 text-indigo-800';
      case 'tokenSale':
        return 'bg-red-100 text-red-800';
      case 'fiatTokenSale':
        return 'bg-blue-100 text-blue-800';
      case 'citizenship':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg relative">
      {loading && entries.length > 0 && (
        <div
          className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] sm:rounded-lg flex items-center justify-center pointer-events-none"
          aria-busy="true"
        />
      )}
      <div className="p-3 sm:p-4 space-y-4">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <Heading level={3}>{t('dashboard_charges_title')}</Heading>
          </div>
        </div>

        {availableTypes.length > 0 && (
          <div className="mb-4">
            <MultiSelect
              values={selectedTypes}
              options={availableTypes as string[]}
              onChange={setSelectedTypes}
              placeholder={t('dashboard_charges_select_types')}
              className="max-w-md"
            />
          </div>
        )}

        {totalCount > 0 && (
          <div className="text-sm text-gray-500">
            {t('dashboard_revenue_showing')}{' '}
            {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, totalCount)}{' '}
            {t('dashboard_revenue_of')} {totalCount}{' '}
            {t('dashboard_revenue_items')}
          </div>
        )}

        {filteredEntries.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {selectedTypes.length === 0
                ? t('dashboard_charges_no_charges')
                : t('dashboard_charges_no_match')}
            </div>
          </div>
        ) : (
          <div className="mt-8 flow-root">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full py-2 align-middle">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_date')}
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_id')}
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_type')}
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_status')}
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_method')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_total')}
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-24">
                        {t('expense_tracking_toconline')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_rental')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_food')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_utilities')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_event')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_connect_fee')}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('dashboard_charges_stripe_fee')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEntries.map((entry, index) => {
                      const rowKey =
                        getCombinedEntryRowKey(entry) || `entry-${index}`;

                      if (entry.kind === 'charge') {
                        const charge: any = entry.charge;
                        return (
                          <tr key={rowKey} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-900">
                              {formatDate(charge.date)}
                            </td>
                            <td className=" px-2 py-2 text-xs text-gray-900">
                              {charge._id ? charge._id : 'N/A'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                                  charge.type,
                                )}`}
                              >
                                {charge.type}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  charge.status,
                                )}`}
                              >
                                {charge.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-900">
                              {charge.method || 'N/A'}
                            </td>
                            <td className="whitespace-nowrap font-semibold px-2 py-2 text-xs text-gray-900 text-right">
                              {charge.amount?.total
                                ? formatCurrency(charge.amount.total)
                                : 'N/A'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-900 text-left align-middle">
                              {renderIncomeToconlineCell(
                                toconlineLinkToRowUiState(entry.toconline),
                                t,
                                openToconlineDocument,
                              )}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600 text-right">
                              {charge.amount?.rental
                                ? formatCurrency(charge.amount.rental)
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600 text-right">
                              {charge.amount?.food
                                ? formatCurrency(charge.amount.food)
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600 text-right">
                              {charge.amount?.utilities
                                ? formatCurrency(charge.amount.utilities)
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600 text-right">
                              {charge.amount?.event
                                ? formatCurrency(charge.amount.event)
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500 text-right">
                              {charge.meta?.stripeConnectFee &&
                              charge.amount?.total?.cur
                                ? formatCurrency({
                                    val: charge.meta.stripeConnectFee,
                                    cur: charge.amount.total.cur,
                                  })
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500 text-right">
                              {charge.meta?.stripeProcessingFee &&
                              charge.amount?.total?.cur
                                ? formatCurrency({
                                    val:
                                      charge.meta.stripeProcessingFee -
                                      (charge.meta?.stripeConnectFee || 0),
                                    cur: charge.amount.total.cur,
                                  })
                                : '-'}
                            </td>
                          </tr>
                        );
                      }

                      // Orphan Toconline Document
                      const doc = entry.document;
                      const docDate = doc.date;
                      const gross = doc.gross_total ?? doc.pending_total ?? 0;
                      const cur = doc.currency_iso_code ?? 'EUR';
                      const desc =
                        doc.supplier_business_name ||
                        doc.document_no ||
                        doc.notes ||
                        'N/A';

                      return (
                        <tr
                          key={rowKey}
                          className="hover:bg-gray-50 bg-amber-50/40"
                        >
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-900">
                            {formatDate(docDate)}
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-900">
                            {desc}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {t('expense_tracking_row_toconline_only')}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs">
                            —
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-900">
                            —
                          </td>
                          <td className="whitespace-nowrap font-semibold px-2 py-2 text-xs text-gray-900 text-right">
                            {typeof gross === 'number'
                              ? formatCurrency({ val: gross, cur })
                              : 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-900 text-left align-middle">
                            {renderIncomeToconlineCell(
                              { kind: 'linked', doc },
                              t,
                              openToconlineDocument,
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600 text-right">
                            —
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600 text-right">
                            —
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600 text-right">
                            —
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600 text-right">
                            —
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500 text-right">
                            —
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500 text-right">
                            —
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {toconlineDialogOpen ? (
          <ToconlineDocumentDialog
            document={toconlineDocument}
            onClose={() => {
              setToconlineDialogOpen(false);
              setToconlineDocument(null);
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

export default ChargesTable;
