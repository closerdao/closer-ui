import React, { useState } from 'react';

import Cookies from 'js-cookie';
import { z } from 'zod';

import api from '../../utils/api';
import { Button } from '../ui';
import Heading from '../ui/Heading';
import { ExtractedDataForm, UploadForm } from './';

const expenseFormSchema = z.object({
  supplier_business_name: z
    .string()
    .min(1, 'Supplier business name is required'),
  document_date: z.string().min(1, 'Document date is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
});

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

interface ExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expenseCategories?: string[];
}

const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  isOpen,
  onClose,
  expenseCategories,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ReceiptData | null>(null);
  const [editableData, setEditableData] = useState<ReceiptData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [hasLoggedExpense, setHasLoggedExpense] = useState(false);
  const [uploadedDocumentUrl, setUploadedDocumentUrl] = useState<string | null>(
    null,
  );
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  React.useEffect(() => {
    if (parsedData) {
      const errors = validateReceiptData(parsedData);
      setValidationErrors(errors);
      setEditableData(parsedData);
    }
  }, [parsedData]);

  React.useEffect(() => {
    if (editableData) {
      const errors = validateReceiptData(editableData);
      setValidationErrors(errors);

      const toconlineFormattedData = {
        document_type: 'FC',
        ...(editableData?.tax_exemption_reason_id && {
          tax_exemption_reason_id: editableData.tax_exemption_reason_id,
        }),
        ...(description && { description }),
        ...(category && { category }),
        ...(comment && { comment }),
        ...(currency && { currency_iso_code: currency }),
        supplier_business_name: editableData.supplier_business_name,
        document_date: editableData.document_date,
        lines: editableData.vat_summary.map((summary) => ({
          description: summary?.description || '',
          quantity: 1,
          unit_price: Number(summary?.total_with_vat),
          tax_percentage: Number(summary?.vat_percentage),
          tax_code:
            summary?.tax_code ||
            (summary?.vat_percentage === 0
              ? 'ISE'
              : summary?.vat_percentage === 6
              ? 'RED'
              : summary?.vat_percentage === 13
              ? 'INT'
              : 'NOR'),
        })),
      };

      setExpenseData(toconlineFormattedData);
    }
  }, [editableData, description, category, comment, currency]);

  React.useEffect(() => {
    if (editableData && hasAttemptedSubmit) {
      validateRequiredFields();
    }
  }, [
    description,
    category,
    editableData?.supplier_business_name,
    editableData?.document_date,
    hasAttemptedSubmit,
  ]);

  const validateRequiredFields = () => {
    const formData = {
      supplier_business_name: editableData?.supplier_business_name || '',
      document_date: editableData?.document_date || '',
      category,
      description,
    };

    const result = expenseFormSchema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          errors[error.path[0] as string] = error.message;
        }
      });
      setFieldErrors(errors);
      return false;
    } else {
      setFieldErrors({});
      return true;
    }
  };

  const validateAndShowErrors = () => {
    setHasAttemptedSubmit(true);
    return validateRequiredFields();
  };

  const handleFileSelect = async (selectedFile: File | null) => {
    if (
      selectedFile &&
      (selectedFile.type.startsWith('image/') ||
        selectedFile.type === 'application/pdf')
    ) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);

      if (selectedFile.type.startsWith('image/')) {
        try {
          const reader = new FileReader();

          reader.onload = async (e) => {
            try {
              if (!e.target?.result) {
                throw new Error('Failed to read file');
              }

              const { Jimp } = await import('jimp');
              const image = await Jimp.read(e.target.result);

              const maxDimension = 1500;
              const width = image.width;
              const height = image.height;

              if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                  image.resize({ w: maxDimension });
                } else {
                  image.resize({ h: maxDimension });
                }
              }

              const base64 = await image.getBase64('image/jpeg');
              const base64Data = base64.split(',')[1];
              const resizedBuffer = Buffer.from(base64Data, 'base64');
              const resizedFile = new File([resizedBuffer], selectedFile.name, {
                type: 'image/jpeg',
              });

              setFile(resizedFile);
            } catch (error) {
              console.error('Error resizing image:', error);
              setFile(selectedFile);
            }
          };

          reader.readAsArrayBuffer(selectedFile);
        } catch (error) {
          console.error('Error reading file:', error);
          setFile(selectedFile);
        }
      }
    } else if (selectedFile) {
      console.error('Error: Please select a valid image or PDF file');
    }
  };

  const validateReceiptData = (data: any): string[] => {
    const errors: string[] = [];

    if (!data) {
      errors.push('No receipt data found');
      return errors;
    }

    if (
      !data.supplier_business_name ||
      data.supplier_business_name.trim() === ''
    ) {
      errors.push('Supplier business name is required');
    }

    if (!data.document_date || data.document_date.trim() === '') {
      errors.push('Document date is required');
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('Receipt must have at least one item');
      return errors;
    }

    if (
      !data.vat_summary ||
      !Array.isArray(data.vat_summary) ||
      data.vat_summary.length === 0
    ) {
      errors.push('Receipt must have VAT summary');
      return errors;
    }

    if (!data.receipt_total || data.receipt_total <= 0) {
      errors.push('Receipt total must be greater than 0');
    }

    data.items.forEach((item: any, index: number) => {
      if (!item.description || item.description.trim() === '') {
        errors.push(`Item ${index + 1}: Description is required`);
      }

      if (
        item.item_total === undefined ||
        item.item_total === null ||
        item.item_total <= 0
      ) {
        errors.push(`Item ${index + 1}: Item total must be greater than 0`);
      }

      if (
        item.vat_percentage === undefined ||
        item.vat_percentage === null ||
        item.vat_percentage < 0
      ) {
        errors.push(`Item ${index + 1}: VAT percentage is required`);
      }
    });

    data.vat_summary.forEach((summary: any, index: number) => {
      if (!summary.description || summary.description.trim() === '') {
        errors.push(`VAT Group ${index + 1}: Description is required`);
      }

      if (
        summary.vat_percentage === undefined ||
        summary.vat_percentage === null ||
        summary.vat_percentage < 0
      ) {
        errors.push(`VAT Group ${index + 1}: VAT percentage is required`);
      }

      if (
        summary.total_with_vat === undefined ||
        summary.total_with_vat === null ||
        summary.total_with_vat < 0
      ) {
        errors.push(
          `VAT Group ${
            index + 1
          }: Total with VAT must be greater than or equal to 0`,
        );
      }
    });

    return errors;
  };

  const handleParseWithLLM = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = Cookies.get('access_token');
      const res = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `HTTP error! status: ${res.status}, message: ${errorText}`,
        );
      }

      const data = await res.json();

      if (data.documentUrl) {
        setUploadedDocumentUrl(data.documentUrl);
      } else {
        setUploadedDocumentUrl(null);
      }

      if (data.structuredData) {
        try {
          const parsed = data.structuredData;

          const formattedData: ReceiptData = {
            supplier_business_name: parsed.supplier_business_name || '',
            document_date: parsed.document_date || '',
            ...(parsed.tax_exemption_reason_id && {
              tax_exemption_reason_id: parsed.tax_exemption_reason_id,
            }),
            ...(parsed.currency_iso_code && {
              currency_iso_code: parsed.currency_iso_code,
            }),
            items: Array.isArray(parsed.items)
              ? parsed.items.map((item: any) => ({
                  description: item.description || '',
                  item_total:
                    typeof item.item_total === 'number' ? item.item_total : 0,
                  vat_rate_id: item.vat_rate_id,
                  vat_percentage:
                    typeof item.vat_percentage === 'number'
                      ? item.vat_percentage
                      : 0,
                }))
              : [],
            vat_summary: Array.isArray(parsed.vat_summary)
              ? parsed.vat_summary.map((summary: any) => ({
                  vat_percentage:
                    typeof summary.vat_percentage === 'number'
                      ? summary.vat_percentage
                      : 0,
                  description: summary.description || '',
                  total_with_vat:
                    typeof summary.total_with_vat === 'number'
                      ? summary.total_with_vat
                      : 0,
                  tax_code: summary.tax_code || 'NOR',
                }))
              : [],
            receipt_total:
              typeof parsed.receipt_total === 'number'
                ? parsed.receipt_total
                : 0,
          };

          setParsedData(formattedData);
          setEditableData(formattedData);
          // Set the currency state from parsed data
          if (parsed.currency_iso_code) {
            setCurrency(parsed.currency_iso_code);
          }
          const errors = validateReceiptData(formattedData);
          setValidationErrors(errors);
        } catch (e) {
          console.log('Structured data parsing error:', e);
          setParsedData(null);
          setValidationErrors([
            'Invalid structured data format received from AI',
          ]);
        }
      } else {
        setParsedData(null);
        setValidationErrors(['No data received from AI']);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierChange = (value: string) => {
    if (editableData) {
      setEditableData({
        ...editableData,
        supplier_business_name: value,
      });
    }
  };

  const handleDocumentDateChange = (value: string) => {
    if (editableData) {
      setEditableData({
        ...editableData,
        document_date: value,
      });
    }
  };

  const handleReceiptTotalChange = (value: number) => {
    if (editableData) {
      setEditableData({
        ...editableData,
        receipt_total: value,
      });
    }
  };

  const handleTaxExemptionReasonChange = (value: string) => {
    if (editableData) {
      setEditableData({
        ...editableData,
        tax_exemption_reason_id: value || undefined,
      });
    }
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
  };

  const handleVatSummaryChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    if (editableData) {
      const updatedVatSummary = [...editableData.vat_summary];
      updatedVatSummary[index] = {
        ...updatedVatSummary[index],
        [field]:
          field === 'vat_percentage' || field === 'total_with_vat'
            ? Number(value)
            : value,
      };
      setEditableData({
        ...editableData,
        vat_summary: updatedVatSummary,
      });
    }
  };

  const handleAddVatSummaryRow = () => {
    if (editableData) {
      const newRow = {
        vat_percentage: 0,
        description: '',
        total_with_vat: 0,
        tax_code: 'ISE',
      };
      setEditableData({
        ...editableData,
        vat_summary: [...editableData.vat_summary, newRow],
      });
    }
  };

  const handleDeleteVatSummaryRow = (index: number) => {
    if (editableData && editableData.vat_summary.length > 1) {
      const updatedVatSummary = editableData.vat_summary.filter(
        (_, i) => i !== index,
      );
      setEditableData({
        ...editableData,
        vat_summary: updatedVatSummary,
      });
    }
  };

  const handleUploadToToconline = async () => {
    if (!validateAndShowErrors()) {
      return;
    }

    try {
      setHasLoggedExpense(false);
      setLoading(true);

      const updatedExpenseData = {
        toconlineData: expenseData,
        description,
        category,
        comment,
      };

      console.log('updatedExpenseData=', updatedExpenseData);

      const res = await api.post('/toconline/expense', {
        expenseData: updatedExpenseData,
        uploadedDocumentUrl,
      });

      if (res.status === 200) {
        setHasLoggedExpense(true);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPhoto(null);
    setParsedData(null);
    setEditableData(null);
    setValidationErrors([]);
    setExpenseData(null);
    setHasLoggedExpense(false);
    setUploadedDocumentUrl(null);
    setDescription('');
    setCategory('');
    setComment('');
    setCurrency('');
    setFieldErrors({});
    setHasAttemptedSubmit(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Heading level={3}>Add New Expense</Heading>
            <Button
              onClick={handleClose}
              variant="secondary"
              className=" w-12 h-12"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-6">
            {!parsedData ? (
              <UploadForm
                onFileSelect={handleFileSelect}
                onParseWithLLM={handleParseWithLLM}
                file={file}
                photo={photo}
                loading={loading}
              />
            ) : (
              <ExtractedDataForm
                editableData={editableData}
                description={description}
                category={category}
                comment={comment}
                currency={currency}
                expenseCategories={expenseCategories}
                fieldErrors={fieldErrors}
                hasAttemptedSubmit={hasAttemptedSubmit}
                validationErrors={validationErrors}
                loading={loading}
                hasLoggedExpense={hasLoggedExpense}
                uploadedDocumentUrl={uploadedDocumentUrl}
                onSupplierChange={handleSupplierChange}
                onDocumentDateChange={handleDocumentDateChange}
                onReceiptTotalChange={handleReceiptTotalChange}
                onTaxExemptionReasonChange={handleTaxExemptionReasonChange}
                onDescriptionChange={setDescription}
                onCategoryChange={setCategory}
                onCommentChange={setComment}
                onCurrencyChange={handleCurrencyChange}
                onVatSummaryChange={handleVatSummaryChange}
                onAddVatSummaryRow={handleAddVatSummaryRow}
                onDeleteVatSummaryRow={handleDeleteVatSummaryRow}
                onUploadToToconline={handleUploadToToconline}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDialog;
