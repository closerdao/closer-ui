import React, { useState } from 'react';

import { Button, Card } from '../ui';
import Heading from '../ui/Heading';

// Extended Charge type for expense tracking
interface ExpenseCharge {
  _id: string;
  date: string;
  created: string;
  amount: {
    total: {
      val: number;
      cur: string;
    };
  };
  meta: {
    uploadedDocumentUrl?: string | null;
    expenseData?: {
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
  const [selectedCharge, setSelectedCharge] = useState<ExpenseCharge | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!charges || charges.length === 0) return null;

  return (
    <>
      <section className="flex flex-col gap-4">
        <Card className="bg-background p-0 sm:p-4 shadow-none sm:shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Heading level={3}>Historic expenses</Heading>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {charges.map((charge) => {
                  const expenseData = charge.meta?.expenseData;
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
                        €
                        {amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900">
                        {expenseData?.description || 'N/A'}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900">
                        {expenseData?.category || 'N/A'}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900 text-center">
                        <Button
                          onClick={() => {
                            setSelectedCharge(charge);
                            setIsDialogOpen(true);
                          }}
                          variant="secondary"
                          size="small"
                          className="text-xs py-1"
                        >
                          View Details
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
                <Heading level={3}>Expense Details</Heading>
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
                {selectedCharge.meta?.expenseData && (
                  <div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Document Date:</strong>{' '}
                        {selectedCharge.meta.expenseData.document_date || 'N/A'}
                      </div>
                      <div>
                        <strong>Description:</strong>{' '}
                        {selectedCharge.meta.expenseData.description || 'N/A'}
                      </div>
                      {selectedCharge.meta?.expenseData?.comment && (
                        <div>
                          <strong>Comment:</strong>{' '}
                          {selectedCharge.meta.expenseData.comment}
                        </div>
                      )}
                      <div>
                        <strong>Supplier:</strong>{' '}
                        {selectedCharge.meta.expenseData
                          .supplier_business_name || 'N/A'}
                      </div>
                      <div>
                        <strong>Category:</strong>{' '}
                        {selectedCharge.meta.expenseData.category || 'N/A'}
                      </div>
                      {selectedCharge.meta.expenseData
                        .tax_exemption_reason_id && (
                        <div>
                          <strong>Tax Exemption Reason ID:</strong>{' '}
                          {
                            selectedCharge.meta.expenseData
                              .tax_exemption_reason_id
                          }
                        </div>
                      )}
                      <div>
                        <strong>Receipt Total:</strong> €
                        {selectedCharge.amount?.total?.val?.toLocaleString(
                          'en-US',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        ) || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* VAT Summary */}
                {selectedCharge.meta?.expenseData?.lines &&
                  selectedCharge.meta.expenseData.lines.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        VAT Summary:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b">
                            <tr>
                              <th className="px-2 py-1 text-left">
                                Description
                              </th>
                              <th className="px-2 py-1 text-center">VAT %</th>
                              <th className="px-2 py-1 text-center">
                                Tax Code
                              </th>
                              <th className="px-2 py-1 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCharge.meta.expenseData.lines.map(
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
                                    €
                                    {line.unit_price?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
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
