import React from 'react';

import { Loader2, Plus, Trash2 } from 'lucide-react';

import { Button, Card } from '../ui';
import Heading from '../ui/Heading';
import Input from '../ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface ReceiptData {
  supplier_business_name: string;
  document_date: string;
  tax_exemption_reason_id?: string;
  description?: string;
  category?: string;
  comment?: string;
  currency_iso_code?: string;
  items: {
    description: string;
    item_total: number;
    vat_rate_id?: number;
    vat_percentage: number;
  }[];
  vat_summary: {
    vat_percentage: number;
    description: string;
    total_with_vat: number;
    tax_code: string;
  }[];
  receipt_total: number;
}

interface ExtractedDataFormProps {
  editableData: ReceiptData | null;
  description: string;
  category: string;
  comment: string;
  currency: string;
  expenseCategories?: string[];
  fieldErrors: Record<string, string>;
  hasAttemptedSubmit: boolean;
  validationErrors: string[];
  loading: boolean;
  hasLoggedExpense: boolean;
  uploadedDocumentUrl: string | null;
  onSupplierChange: (value: string) => void;
  onDocumentDateChange: (value: string) => void;
  onReceiptTotalChange: (value: number) => void;
  onTaxExemptionReasonChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCommentChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onVatSummaryChange: (
    index: number,
    field: string,
    value: string | number,
  ) => void;
  onAddVatSummaryRow: () => void;
  onDeleteVatSummaryRow: (index: number) => void;
  onUploadToToconline: () => void;
}

const ExtractedDataForm: React.FC<ExtractedDataFormProps> = ({
  editableData,
  description,
  category,
  comment,
  currency,
  expenseCategories,
  fieldErrors,
  hasAttemptedSubmit,
  validationErrors,
  loading,
  hasLoggedExpense,
  uploadedDocumentUrl,
  onSupplierChange,
  onDocumentDateChange,
  onReceiptTotalChange,
  onTaxExemptionReasonChange,
  onDescriptionChange,
  onCategoryChange,
  onCommentChange,
  onCurrencyChange,
  onVatSummaryChange,
  onAddVatSummaryRow,
  onDeleteVatSummaryRow,
  onUploadToToconline,
}) => {
  if (!editableData) return null;

  return (
    <Card className="bg-background p-0 sm:p-4 shadow-none sm:shadow-md gap-2">
      <div className="flex justify-between items-center mb-4">
        <Heading level={3}>Extracted document data</Heading>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-1">Supplier: *</div>
        <Input
          type="text"
          value={editableData?.supplier_business_name || ''}
          onChange={(e: any) => onSupplierChange(e.target.value)}
          className={`py-2 px-2 ${
            hasAttemptedSubmit && fieldErrors.supplier_business_name
              ? 'border-red-500'
              : ''
          }`}
        />
        {hasAttemptedSubmit && fieldErrors.supplier_business_name && (
          <div className="text-sm text-red-500 mt-1">
            {fieldErrors.supplier_business_name}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-1">
          Document date (YYYY-MM-DD): *
        </div>
        <Input
          type="text"
          value={editableData?.document_date || ''}
          onChange={(e: any) => onDocumentDateChange(e.target.value)}
          className={`py-2 px-2 ${
            hasAttemptedSubmit && fieldErrors.document_date
              ? 'border-red-500'
              : ''
          }`}
        />
        {hasAttemptedSubmit && fieldErrors.document_date && (
          <div className="text-sm text-red-500 mt-1">
            {fieldErrors.document_date}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-1">Currency (ISO Code):</div>
        <Input
          type="text"
          value={currency || editableData?.currency_iso_code || ''}
          onChange={(e: any) => onCurrencyChange(e.target.value)}
          className="py-2 px-2"
          placeholder="e.g., EUR, USD, GBP"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="pr-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                VAT Group description
              </th>
              <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                VAT %
              </th>
              <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Code (NOR / INT / RED / ISE)
              </th>
              <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total with VAT
              </th>
              <th className="pl-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editableData?.vat_summary?.map((summary: any, index: number) => (
              <tr key={index}>
                <td className="pr-1 py-1 text-sm text-gray-900 font-medium">
                  <Input
                    type="text"
                    value={summary.description || ''}
                    onChange={(e) =>
                      onVatSummaryChange(index, 'description', e.target.value)
                    }
                    className="py-2 px-2"
                  />
                </td>
                <td className="px-1 py-1 text-sm text-gray-900 text-center">
                  <Input
                    type="number"
                    value={String(summary.vat_percentage || 0)}
                    onChange={(e) =>
                      onVatSummaryChange(
                        index,
                        'vat_percentage',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="py-2 px-2"
                  />
                </td>
                <td className="px-1 py-1 text-sm text-gray-900 text-center">
                  <Input
                    type="text"
                    value={summary.tax_code || ''}
                    onChange={(e) =>
                      onVatSummaryChange(index, 'tax_code', e.target.value)
                    }
                    className="py-2 px-2"
                  />
                </td>
                <td className="px-1 py-1 text-sm font-semibold text-gray-900 text-right">
                  <Input
                    type="text"
                    value={(summary.total_with_vat || 0).toFixed(2)}
                    onChange={(e) =>
                      onVatSummaryChange(
                        index,
                        'total_with_vat',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="py-2 px-2 border-none"
                  />
                </td>
                <td className="pl-1 py-1 text-center">
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onDeleteVatSummaryRow(index)}
                      disabled={editableData?.vat_summary.length === 1}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-400 p-1"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onAddVatSummaryRow()}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Add row"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t">
            <tr>
              <td
                colSpan={3}
                className="px-2 py-2 text-sm font-bold text-right"
              >
                Document Total:
              </td>
              <td className="px-2 py-2 text-lg font-bold text-gray-900 text-right">
                <Input
                  type="text"
                  value={(editableData?.receipt_total || 0).toFixed(2)}
                  onChange={(e) =>
                    onReceiptTotalChange(parseFloat(e.target.value) || 0)
                  }
                  className="w-full p-1 border-none rounded text-sm font-bold text-right"
                />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Tax Exemption Reason ID */}
      <div className="mt-4">
        <div className="text-sm text-gray-500 mb-1">
          Tax Exemption Reason ID (only required if any of VAT groups has zero
          VAT):
        </div>
        <Input
          type="text"
          value={editableData?.tax_exemption_reason_id || ''}
          onChange={(e: any) => onTaxExemptionReasonChange(e.target.value)}
          className="py-2 px-2"
          placeholder="Enter tax exemption reason ID (optional)"
        />
      </div>

      {/* Description */}
      <div className="mt-4 border-t pt-4">
        <div className="text-sm text-gray-500 mb-1">Description: *</div>
        <Input
          type="text"
          value={description}
          onChange={(e: any) => onDescriptionChange(e.target.value)}
          className={`py-2 px-2 ${
            hasAttemptedSubmit && fieldErrors.description
              ? 'border-red-500'
              : ''
          }`}
          placeholder="Enter expense description"
        />
        {hasAttemptedSubmit && fieldErrors.description && (
          <div className="text-sm text-red-500 mt-1">
            {fieldErrors.description}
          </div>
        )}
      </div>

      {/* Category */}
      <div className="mt-4">
        <div className="text-sm text-gray-500 mb-1">Category: *</div>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger
            className={`py-2 px-2 ${
              hasAttemptedSubmit && fieldErrors.category ? 'border-red-500' : ''
            }`}
          >
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            {expenseCategories?.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasAttemptedSubmit && fieldErrors.category && (
          <div className="text-sm text-red-500 mt-1">
            {fieldErrors.category}
          </div>
        )}
      </div>

      {/* Comment */}
      <div className="mt-4">
        <div className="text-sm text-gray-500 mb-1">Comment:</div>
        <Input
          type="text"
          value={comment}
          onChange={(e: any) => onCommentChange(e.target.value)}
          className="py-2 px-2"
          placeholder="Enter additional comments"
        />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Validation Errors:
          </h4>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-sm text-red-500 bg-red-100 p-2 rounded-md my-4">
        WARNING: this action is not reversible. Please carefully review the
        extracted receipt data before proceeding.
      </div>

      <Button onClick={onUploadToToconline} isEnabled={!loading}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          'Upload to Toconline'
        )}
      </Button>

      {hasLoggedExpense && (
        <div className="text-sm text-green-500 bg-green-100 p-2 rounded-md">
          Purchase logged successfully to Toconline API
        </div>
      )}

      {uploadedDocumentUrl && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Uploaded Document:
          </h4>
          <div className="flex items-center gap-2">
            <a
              href={uploadedDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              View uploaded document
            </a>
            <span className="text-xs text-gray-500">(opens in new tab)</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ExtractedDataForm;
