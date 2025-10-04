import React, { useMemo, useState } from 'react';

import { Charge } from '../../types/booking';
import { Heading } from '../ui';
import MultiSelect from '../ui/Select/MultiSelect';

interface ChargesTableProps {
  charges: Charge[];
  loading?: boolean;
}

const ChargesTable: React.FC<ChargesTableProps> = ({
  charges,
  loading = false,
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Get unique charge types from the charges array
  const availableTypes = useMemo(() => {
    const types = [
      ...new Set(charges.map((charge) => charge.type).filter(Boolean)),
    ];
    console.log('Available types:', types);
    console.log(
      'All charges types:',
      charges.map((c) => ({ type: c.type, method: c.method })),
    );
    return types.sort();
  }, [charges]);

  // Filter charges based on selected types
  const filteredCharges = useMemo(() => {
    if (selectedTypes.length === 0) {
      return charges;
    }
    const filtered = charges.filter((charge) => {
      const chargeType = charge.type;
      const isIncluded = selectedTypes.includes(chargeType);
      console.log(
        `Charge type: ${chargeType}, Selected: ${selectedTypes}, Included: ${isIncluded}`,
      );
      return isIncluded;
    });
    console.log(
      `Filtered ${filtered.length} charges from ${charges.length} total`,
    );
    return filtered;
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
      <div className="px-4 py-5 sm:p-6 space-y-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <Heading level={3}>Charges</Heading>
          </div>
        </div>

        {availableTypes.length > 0 && (
          <div className="mb-4">
            <MultiSelect
              // label="Filter by Type"
              values={selectedTypes}
              options={availableTypes}
              onChange={setSelectedTypes}
              placeholder="Select charge types to filter"
              className="max-w-md"
            />
          </div>
        )}

        {filteredCharges.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {selectedTypes.length === 0
                ? 'No charges found'
                : 'No charges match the selected types'}
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
                        Date
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        ID
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Type
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Method
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Total
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Rental
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Food
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Utilities
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Event
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Connect Fee
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Stripe Fee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCharges.map((charge, index) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChargesTable;
