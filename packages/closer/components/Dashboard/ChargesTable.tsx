import React, { useCallback, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { ToconlineDocument } from 'closer/types/expense';
import { getToconlineDocumentForChargeByStripePaymentIntent } from 'closer/utils/revenueToconline.helpers';

import { Charge } from '../../types/booking';
import ToconlineDocumentDialog from '../expense-tracking/ToconlineDocumentDialog';
import { Button, Heading } from '../ui';
import MultiSelect from '../ui/Select/MultiSelect';

interface ChargesTableProps {
  charges: Charge[];
  loading?: boolean;
  toconlineByStripePaymentIntent?: ReadonlyMap<string, ToconlineDocument>;
  toconlineDocumentsLoading?: boolean;
}

const ChargesTable: React.FC<ChargesTableProps> = ({
  charges,
  loading = false,
  toconlineByStripePaymentIntent,
  toconlineDocumentsLoading = false,
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
      ...new Set(charges.map((charge) => charge.type).filter(Boolean)),
    ];
    return types.sort();
  }, [charges]);

  const filteredCharges = useMemo(() => {
    if (selectedTypes.length === 0) {
      return charges;
    }
    return charges.filter((charge) =>
      selectedTypes.includes(charge.type),
    );
  }, [charges, selectedTypes]);
  const formatCurrency = (amount: { val: number; cur: string }) => {
    if (!amount || !amount.cur || !amount.val) {
      return 'N/A';
    }

    // Handle special currency cases
    let currencyCode = amount.cur.toUpperCase();
    if (currencyCode === 'EUR STABLECOIN') {
      currencyCode = 'EUR';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount.val);
    } catch (error) {
      // Fallback for invalid currency codes
      return `${amount.val.toFixed(2)} ${amount.cur}`;
    }
  };

  const formatDate = (date: string | Date) => {
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

  if (loading) {
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
    <div className="bg-white shadow rounded-lg">
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
              options={availableTypes}
              onChange={setSelectedTypes}
              placeholder={t('dashboard_charges_select_types')}
              className="max-w-md"
            />
          </div>
        )}

        {filteredCharges.length === 0 ? (
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
                    {filteredCharges.map((charge, index) => {
                      const matchedToconlineDoc =
                        toconlineByStripePaymentIntent &&
                        toconlineByStripePaymentIntent.size > 0
                          ? getToconlineDocumentForChargeByStripePaymentIntent(
                              charge,
                              toconlineByStripePaymentIntent,
                            )
                          : undefined;
                      return (
                      <tr
                        key={charge._id || charge.id || `charge-${index}`}
                        className="hover:bg-gray-50"
                      >
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
                        <td className="whitespace-nowrap font-semibold px-2 py-2 text-xs text-gray-900  text-right">
                          {charge.amount?.total
                            ? formatCurrency(charge.amount.total)
                            : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-900 text-left align-middle">
                          {toconlineDocumentsLoading ? (
                            <span className="inline-block h-4 w-12 animate-pulse rounded bg-gray-200" />
                          ) : matchedToconlineDoc ? (
                            <Button
                              type="button"
                              onClick={() =>
                                openToconlineDocument(matchedToconlineDoc)
                              }
                              variant="secondary"
                              size="small"
                              className="text-xs py-0 min-h-[24px] w-fit"
                            >
                              {t('expense_tracking_view_doc')}
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              {t('expense_tracking_toconline_na')}
                            </span>
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
