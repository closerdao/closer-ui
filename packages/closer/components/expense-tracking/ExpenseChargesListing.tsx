import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button, Card, LinkButton } from '../ui';
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

          <div className="hidden md:block overflow-x-auto">
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
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    {t('expense_tracking_document')}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expense_tracking_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {charges.map((charge) => {
                  const description = charge?.description || t('expense_tracking_not_available');
                  const category = charge?.category || t('expense_tracking_not_available');
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
                        {description || t('expense_tracking_not_available')}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900">
                        {category || t('expense_tracking_not_available')}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900 text-center w-16">
                        {charge.meta?.uploadedDocumentUrl ? (
                          <LinkButton
                            variant="secondary"
                            size="small"
                            className="text-xs py-0 min-h-[24px]"
                            href={charge.meta.uploadedDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('expense_tracking_view')}
                          </LinkButton>
                        ) : (
                          <span className="text-gray-400 text-xs">{t('expense_tracking_no_document')}</span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900">
                        <Button
                          onClick={() => {
                            setSelectedCharge(charge);
                            setIsDialogOpen(true);
                          }}
                          variant="secondary"
                          size="small"
                          className="text-xs py-0 min-h-[24px] w-fit"
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

          <div className="md:hidden flex flex-col gap-3">
            {charges.map((charge) => {
              const description = charge?.description || t('expense_tracking_not_available');
              const category = charge?.category || t('expense_tracking_not_available');
              const amount = charge.amount?.total?.val || 0;
              const date = new Date(
                charge.date || charge.created,
              ).toLocaleDateString();

              return (
                <div
                  key={charge._id}
                  className="border border-gray-200 rounded-lg p-3 bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">{date}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      €{amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{category}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {charge.meta?.uploadedDocumentUrl && (
                      <LinkButton
                        variant="secondary"
                        size="small"
                        className="text-xs py-1"
                        href={charge.meta.uploadedDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('expense_tracking_view_document')}
                      </LinkButton>
                    )}
                    <Button
                      onClick={() => {
                        setSelectedCharge(charge);
                        setIsDialogOpen(true);
                      }}
                      variant="secondary"
                      size="small"
                      className="text-xs py-1"
                    >
                      {t('expense_tracking_view_details')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {isDialogOpen && selectedCharge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="pb-4 sm:pb-8 bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start gap-2 mb-4">
                <Heading level={3} className="text-lg sm:text-xl">
                  {t('expense_tracking_expense_details')}
                </Heading>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedCharge(null);
                  }}
                  variant="secondary"
                  className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                  aria-label={t('expense_tracking_close')}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {selectedCharge.meta?.uploadedDocumentUrl && (
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                    <div className="text-sm font-bold">{t('expense_tracking_document')}:</div>
                    <a
                      href={selectedCharge.meta.uploadedDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline break-all"
                    >
                      {t('expense_tracking_view_uploaded_document')}
                    </a>
                  </div>
                )}

                {selectedCharge?.meta?.toconlineData && (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-semibold block text-gray-600">{t('expense_tracking_entity')}</span>
                        <span className="break-words">{selectedCharge.entity || t('expense_tracking_not_available')}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-semibold block text-gray-600">{t('expense_tracking_document_date')}</span>
                        <span>{selectedCharge.meta.toconlineData.document_date || t('expense_tracking_not_available')}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded sm:col-span-2">
                        <span className="font-semibold block text-gray-600">{t('expense_tracking_description')}</span>
                        <span className="break-words">{selectedCharge.description || t('expense_tracking_not_available')}</span>
                      </div>
                      {selectedCharge.meta?.comment && (
                        <div className="bg-gray-50 p-2 rounded sm:col-span-2">
                          <span className="font-semibold block text-gray-600">{t('expense_tracking_comment')}</span>
                          <span className="break-words">{selectedCharge.meta.comment}</span>
                        </div>
                      )}
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-semibold block text-gray-600">{t('expense_tracking_supplier')}</span>
                        <span className="break-words">{selectedCharge.meta.toconlineData.supplier_business_name || t('expense_tracking_not_available')}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-semibold block text-gray-600">{t('expense_tracking_category')}</span>
                        <span>{selectedCharge.category || t('expense_tracking_not_available')}</span>
                      </div>
                      {selectedCharge.meta.toconlineData.tax_exemption_reason_id && (
                        <div className="bg-gray-50 p-2 rounded sm:col-span-2">
                          <span className="font-semibold block text-gray-600">{t('expense_tracking_tax_exemption_reason_id')}</span>
                          <span>{selectedCharge.meta.toconlineData.tax_exemption_reason_id}</span>
                        </div>
                      )}
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-semibold block text-gray-600">{t('expense_tracking_receipt_total')}</span>
                        <span className="font-semibold text-base">€{selectedCharge.amount?.total?.val?.toFixed(2) || t('expense_tracking_not_available')}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-semibold block text-gray-600">{t('expense_tracking_currency')}</span>
                        <span>{selectedCharge.amount?.total?.cur?.toUpperCase() || t('expense_tracking_not_available')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedCharge.meta?.toconlineData?.lines &&
                  selectedCharge.meta.toconlineData.lines.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-gray-600 mb-2">
                        {t('expense_tracking_vat_summary')}
                      </div>
                      
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left">
                                {t('expense_tracking_description')}
                              </th>
                              <th className="px-2 py-2 text-center">
                                {t('expense_tracking_vat_percentage')}
                              </th>
                              <th className="px-2 py-2 text-center">
                                {t('expense_tracking_tax_code')}
                              </th>
                              <th className="px-2 py-2 text-right">
                                {t('expense_tracking_total')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCharge.meta.toconlineData?.lines.map(
                              (line: any, index: number) => (
                                <tr key={index} className="border-b">
                                  <td className="px-2 py-2">{line.description}</td>
                                  <td className="px-2 py-2 text-center">{line.tax_percentage}%</td>
                                  <td className="px-2 py-2 text-center">{line.tax_code}</td>
                                  <td className="px-2 py-2 text-right">€{line.unit_price?.toFixed(2)}</td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="sm:hidden flex flex-col gap-2">
                        {selectedCharge.meta.toconlineData?.lines.map(
                          (line: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                              <p className="text-sm font-medium mb-1 break-words">{line.description}</p>
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>{t('expense_tracking_vat_percentage')}: {line.tax_percentage}%</span>
                                <span>{line.tax_code}</span>
                              </div>
                              <div className="text-right font-semibold text-sm mt-1">
                                €{line.unit_price?.toFixed(2)}
                              </div>
                            </div>
                          ),
                        )}
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
