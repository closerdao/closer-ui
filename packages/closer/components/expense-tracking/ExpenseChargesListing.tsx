import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button, Card } from '../ui';
import Heading from '../ui/Heading';

// Extended Charge type for expense tracking
interface ExpenseCharge {
  _id: string;
  entity: string;
  date: string;
  created: string;
  amount: {
    total: {
      val: number;
      cur: string;
    };
  };
  description?: string;
  category?: string;
  documentDate?: string;
  meta: {
    comment?: string;
    uploadedDocumentUrl?: string | null;
    toconlineData?: {
      description?: string;
      category?: string;
      comment?: string;
      supplier_business_name?: string;
      document_date?: string;
      tax_exemption_reason_id?: string;
      lines?: Array<{
        description: string;
        tax_percentage: number;
        tax_code: string;
        unit_price: number;
      }>;
    };
  };
}

interface ExpenseChargesListingProps {
  charges: ExpenseCharge[];
}

const ExpenseChargesListing: React.FC<ExpenseChargesListingProps> = ({
  charges,
}) => {
  const t = useTranslations();
  const [selectedCharge, setSelectedCharge] = useState<ExpenseCharge | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!charges || charges.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <Card className="bg-background p-0 sm:p-4 shadow-none sm:shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Heading level={3}>
              {t('expense_tracking_historic_expenses')}
            </Heading>
          </div>
          <div className="p-8 text-center">
            <div className="text-gray-500 text-lg mb-2">
              {t('expense_tracking_no_expenses_found')}
            </div>
            <div className="text-gray-400 text-sm">
              {t('expense_tracking_no_expenses_filter_criteria')}
            </div>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <Card className="bg-background p-0 sm:p-4 shadow-none sm:shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Heading level={3}>
              {t('expense_tracking_historic_expenses')}
            </Heading>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expense_tracking_date')}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expense_tracking_amount')}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expense_tracking_description')}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expense_tracking_category')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expense_tracking_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {charges.map((charge) => {
                  const expenseData = charge.meta?.toconlineData;
                  const description = charge?.description || 'N/A';
                  const category = charge?.category || 'N/A';
                  const amount = charge.amount?.total?.val || 0;
                  const date = new Date(
                    charge.date || charge.created,
                  ).toLocaleDateString();

                  return (
                    <tr key={charge._id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-sm text-gray-900">
                        {date}
                      </td>
                      <td className="px-2 py-1 text-sm font-medium text-gray-900">
                        €{amount.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900">
                        {description || 'N/A'}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900">
                        {category || 'N/A'}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900 text-center">
                        <Button
                          onClick={() => {
                            setSelectedCharge(charge);
                            setIsDialogOpen(true);
                          }}
                          variant="secondary"
                          size="small"
                          className="text-xs py-0 min-h-[24px]"
                        >
                          {t('expense_tracking_view_details')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Detail Modal */}
      {isDialogOpen && selectedCharge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="pb-8 bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Heading level={3}>
                  {t('expense_tracking_expense_details')}
                </Heading>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedCharge(null);
                  }}
                  variant="secondary"
                  className=" w-12 h-12"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Document URL */}
                {selectedCharge.meta?.uploadedDocumentUrl && (
                  <div className="flex  gap-2">
                    <div className="text-sm font-bold">Document:</div>
                    <a
                      href={selectedCharge.meta.uploadedDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      View uploaded document
                    </a>
                  </div>
                )}

                {/* Extracted Data */}
                {selectedCharge?.meta?.toconlineData && (
                  <div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Entity:</strong>{' '}
                        {selectedCharge.entity ||
                          'N/A'}
                      </div>
                      <div>
                        <strong>{t('expense_tracking_document_date')}:</strong>{' '}
                        {selectedCharge.meta.toconlineData.document_date ||
                          'N/A'}
                      </div>
                      <div>
                        <strong>{t('expense_tracking_description')}:</strong>{' '}
                        {selectedCharge.description || 'N/A'}
                      </div>
                      {selectedCharge.meta?.comment && (
                        <div>
                          <strong>{t('expense_tracking_comment')}:</strong>{' '}
                          {selectedCharge.meta.comment}
                        </div>
                      )}
                      <div>
                        <strong>{t('expense_tracking_supplier')}:</strong>{' '}
                        {selectedCharge.meta.toconlineData
                          .supplier_business_name || 'N/A'}
                      </div>
                      <div>
                        <strong>{t('expense_tracking_category')}:</strong>{' '}
                        {selectedCharge.category || 'N/A'}
                      </div>
                      {selectedCharge.meta.toconlineData
                        .tax_exemption_reason_id && (
                        <div>
                          <strong>
                            {t('expense_tracking_tax_exemption_reason_id')}:
                          </strong>{' '}
                          {
                            selectedCharge.meta.toconlineData
                              .tax_exemption_reason_id
                          }
                        </div>
                      )}
                      <div>
                        <strong>{t('expense_tracking_receipt_total')}:</strong>{' '}
                        {selectedCharge.amount?.total?.val?.toFixed(2) || 'N/A'}
                      </div>
                      <div>
                        <strong>Currency:</strong>{' '}
                        {selectedCharge.amount?.total?.cur.toUpperCase() ||
                          'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* VAT Summary */}
                {selectedCharge.meta?.toconlineData?.lines &&
                  selectedCharge.meta.toconlineData.lines.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        {t('expense_tracking_vat_summary')}:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b">
                            <tr>
                              <th className="px-2 py-1 text-left">
                                {t('expense_tracking_description')}
                              </th>
                              <th className="px-2 py-1 text-center">
                                {t('expense_tracking_vat_percentage')}
                              </th>
                              <th className="px-2 py-1 text-center">
                                {t('expense_tracking_tax_code')}
                              </th>
                              <th className="px-2 py-1 text-right">
                                {t('expense_tracking_total')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCharge.meta.toconlineData &&
                              selectedCharge.meta.toconlineData?.lines.map(
                                (line: any, index: number) => (
                                  <tr key={index} className="border-b">
                                    <td className="px-2 py-1">
                                      {line.description}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      {line.tax_percentage}%
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      {line.tax_code}
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                      €{line.unit_price?.toFixed(2)}
                                    </td>
                                  </tr>
                                ),
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseChargesListing;
