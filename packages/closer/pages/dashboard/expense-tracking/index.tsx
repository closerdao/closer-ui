import Head from 'next/head';

import React, { useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import {
  ExpenseChargesListing,
  ExtractedDataForm,
  UploadForm,
} from '../../../components/expense-tracking';
import Heading from '../../../components/ui/Heading';

import { GeneralConfig } from 'closer/types/api';
import { Charge } from 'closer/types/booking';
import Cookies from 'js-cookie';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';
import { z } from 'zod';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

type ReceiptData = {
  supplier_business_name: string;
  document_date: string;
  tax_exemption_reason_id?: string;
  description?: string;
  category?: string;
  comment?: string;
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
};

const expenseFormSchema = z.object({
  supplier_business_name: z
    .string()
    .min(1, 'Supplier business name is required'),
  document_date: z.string().min(1, 'Document date is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
});

const mockResult = `\`\`\`json
{
  "supplier_business_name": "O CANTINHO MAGICO",
  "document_date": "2025-01-01",
  "tax_exemption_reason_id": "1",
  "items": [
    {
      "description": "TINTEIRO HP 305 COR",
      "item_total": 17.99,
      "vat_percentage": 23.00
    },
    {
      "description": "FOTOCÓPIAS",
      "item_total": 0.60,
      "vat_percentage": 23.00
    }
  ],
  "vat_summary": [
    {
      "vat_percentage": 23.00,
      "description": "Bens e Serviços",
      "total_with_vat": 18.59
    },
    {
      "vat_percentage": 0,
      "description": "Bens e Serviços Exentos",
      "total_with_vat": 12.00
    }
  ],
  "receipt_total": 18.59
}
\`\`\``;

const ExpenseTrackingDashboardPage = ({
  charges,
  error,
  generalConfig,
}: {
  charges: Charge[] | null;
  error?: string | null;
  generalConfig: GeneralConfig | null;
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  console.log('charges=', charges);

  const expenseCategories = generalConfig?.expenseCategories?.split(',');

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState(mockResult);
  const [parsedData, setParsedData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [editableData, setEditableData] = useState<ReceiptData | null>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [hasLoggedExpense, setHasLoggedExpense] = useState(false);
  const [uploadedDocumentUrl, setUploadedDocumentUrl] = useState<string | null>(
    null,
  );
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Validate test data on mount
  React.useEffect(() => {
    if (parsedData) {
      const errors = validateReceiptData(parsedData);
      setValidationErrors(errors);
      setEditableData(parsedData);
    }
  }, [parsedData]);

  // Validate editable data when it changes
  React.useEffect(() => {
    if (editableData) {
      const errors = validateReceiptData(editableData);
      setValidationErrors(errors);

      console.log('editableData=', editableData);

      // Transform editableData to expenseData format
      const toconlineFormattedData = {
        document_type: 'FC',
        ...(editableData?.tax_exemption_reason_id && {
          tax_exemption_reason_id: editableData.tax_exemption_reason_id,
        }),
        ...(description && { description }),
        ...(category && { category }),
        ...(comment && { comment }),
        supplier_business_name: editableData.supplier_business_name,
        document_date: editableData.document_date,
        lines: editableData.vat_summary.map((summary) => ({
          description: summary?.description || '',
          quantity: 1, // always 1 for a tax group
          unit_price: Number(summary?.total_with_vat), // match total_with_vat of a tax group
          tax_percentage: Number(summary?.vat_percentage), // match vat_percentage of a tax group
          tax_code:
            summary?.tax_code ||
            (summary?.vat_percentage === 0
              ? 'ISE'
              : summary?.vat_percentage === 6
              ? 'RED'
              : summary?.vat_percentage === 13
              ? 'INT'
              : 'NOR'), // infer tax_code if missing
        })),
      };

      console.log('toconlineFormattedData=', toconlineFormattedData);

      setExpenseData(toconlineFormattedData);
    }
  }, [editableData, description, category, comment]);

  // Validate required fields when they change (only after submission attempt)
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

  // Parse initial mock data if result is set to mockResult
  React.useEffect(() => {
    if (result === mockResult) {
      try {
        // Extract JSON from markdown code blocks if present
        let jsonText = mockResult;
        if (jsonText.includes('```json')) {
          const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
        } else if (jsonText.includes('```')) {
          const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
        }

        const parsed = JSON.parse(jsonText);
        const formattedData: ReceiptData = {
          supplier_business_name: parsed.supplier_business_name || '',
          document_date: parsed.document_date || '',
          ...(parsed.tax_exemption_reason_id && {
            tax_exemption_reason_id: parsed.tax_exemption_reason_id,
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
              }))
            : [],
          receipt_total:
            typeof parsed.receipt_total === 'number' ? parsed.receipt_total : 0,
        };

        setParsedData(formattedData);
        setEditableData(formattedData);
        const errors = validateReceiptData(formattedData);
        setValidationErrors(errors);
      } catch (e) {
        console.log('Failed to parse initial mock data:', e);
      }
    }
  }, [result]);

  const handleFileSelect = async (selectedFile: File | null) => {
    if (
      selectedFile &&
      (selectedFile.type.startsWith('image/') ||
        selectedFile.type === 'application/pdf')
    ) {
      setFile(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);

      // For images, resize them on the frontend before sending to API
      if (selectedFile.type.startsWith('image/')) {
        try {
          const reader = new FileReader();

          reader.onload = async (e) => {
            try {
              if (!e.target?.result) {
                throw new Error('Failed to read file');
              }

              // Dynamic import of Jimp
              const { Jimp } = await import('jimp');
              const image = await Jimp.read(e.target.result);

              console.log('Original image dimensions:', {
                width: image.width,
                height: image.height,
              });

              // Resize to 1500px on longest side while maintaining aspect ratio
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

              console.log('Resized image dimensions:', {
                width: image.width,
                height: image.height,
              });

              // Convert back to File object
              const base64 = await image.getBase64('image/jpeg');
              const base64Data = base64.split(',')[1]; // Remove data URL prefix
              const resizedBuffer = Buffer.from(base64Data, 'base64');
              const resizedFile = new File([resizedBuffer], selectedFile.name, {
                type: 'image/jpeg',
              });

              setFile(resizedFile);
              console.log('Image resized successfully on frontend');
            } catch (error) {
              console.error('Error resizing image:', error);
              // Fallback to original file if resize fails
              setFile(selectedFile);
            }
          };

          reader.readAsArrayBuffer(selectedFile);
        } catch (error) {
          console.error('Error reading file:', error);
          // Fallback to original file if read fails
          setFile(selectedFile);
        }
      }
    } else if (selectedFile) {
      setResult('Error: Please select a valid image or PDF file');
    }
  };

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

  const areAllRequiredFieldsFilled = () => {
    return (
      editableData?.supplier_business_name?.trim() !== '' &&
      editableData?.document_date?.trim() !== '' &&
      description?.trim() !== '' &&
      category?.trim() !== ''
    );
  };

  const validateReceiptData = (data: any): string[] => {
    const errors: string[] = [];

    // Check if data exists
    if (!data) {
      errors.push('No receipt data found');
      return errors;
    }

    // Check required fields
    if (
      !data.supplier_business_name ||
      data.supplier_business_name.trim() === ''
    ) {
      errors.push('Supplier business name is required');
    }

    if (!data.document_date || data.document_date.trim() === '') {
      errors.push('Document date is required');
    }

    // Check items array (since we're focusing on vat_summary)
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('Receipt must have at least one item');
      return errors;
    }

    // Check vat_summary array
    if (
      !data.vat_summary ||
      !Array.isArray(data.vat_summary) ||
      data.vat_summary.length === 0
    ) {
      errors.push('Receipt must have VAT summary');
      return errors;
    }

    // Check receipt_total
    if (!data.receipt_total || data.receipt_total <= 0) {
      errors.push('Receipt total must be greater than 0');
    }

    // Validate each item
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

    // Validate vat_summary entries
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

  const handleUploadToToconline = async () => {
    if (!validateAndShowErrors()) {
      return;
    }

    try {
      setHasLoggedExpense(false);
      setLoading(true);

      // Add the manual fields to expenseData
      const updatedExpenseData = {
        ...expenseData,
        description,
        category,
        comment,
      };

      console.log('expenseData=', updatedExpenseData);
      console.log('uploadedDocumentUrl=', uploadedDocumentUrl);

      const res = await api.post('/toconline/expense', {
        expenseData: updatedExpenseData,
        uploadedDocumentUrl,
      });
      if (res.status === 200) {
        console.log('res=', res);
        setHasLoggedExpense(true);
      } else {
        console.error('Upload error:', res);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
    console.log('Uploading to Toconline API');
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

  const handleParseWithLLM = async () => {
    if (!file) return;
    setLoading(true);

    try {
      console.log('Uploading file:', file.name, file.type, file.size);

      const formData = new FormData();
      formData.append('file', file);

      console.log('Making request to /api/parse-receipt');
      const token = Cookies.get('access_token');
      const res = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      console.log('Response status:', res.status);
      console.log(
        'Response headers:',
        Object.fromEntries(res.headers.entries()),
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(
          `HTTP error! status: ${res.status}, message: ${errorText}`,
        );
      }

      const data = await res.json();
      console.log('Response data text:', data.text);

      // Set the extracted text for display
      setResult(data.text || data.error || 'No output');

      // Store the uploaded document URL if available
      if (data.documentUrl) {
        setUploadedDocumentUrl(data.documentUrl);
        console.log('Document uploaded to CDN:', data.documentUrl);
      } else {
        setUploadedDocumentUrl(null);
        console.log('No document URL returned (may be PDF or upload failed)');
      }

      // Handle structured data from the API
      if (data.structuredData) {
        try {
          const parsed = data.structuredData;

          console.log('parsed=', parsed);

          // Ensure the parsed data matches the exact format of ReceiptData
          const formattedData: ReceiptData = {
            supplier_business_name: parsed.supplier_business_name || '',
            document_date: parsed.document_date || '',
            ...(parsed.tax_exemption_reason_id && {
              tax_exemption_reason_id: parsed.tax_exemption_reason_id,
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

          console.log('formattedData=', formattedData);

          setParsedData(formattedData);

          // Validate the formatted data
          const errors = validateReceiptData(formattedData);
          setValidationErrors(errors);
        } catch (e) {
          console.log('Structured data parsing error:', e);
          setParsedData(null);
          setValidationErrors([
            'Invalid structured data format received from AI',
          ]);
        }
      } else if (data.text) {
        // Fallback: try to parse the text as JSON (for backward compatibility)
        try {
          // Extract JSON from markdown code blocks if present
          let jsonText = data.text;
          if (jsonText.includes('```json')) {
            const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonText = jsonMatch[1];
            }
          }

          const parsed = JSON.parse(jsonText);

          // Ensure the parsed data matches the exact format of ReceiptData
          const formattedData: ReceiptData = {
            supplier_business_name: parsed.supplier_business_name || '',
            document_date: parsed.document_date || '',
            ...(parsed.tax_exemption_reason_id && {
              tax_exemption_reason_id: parsed.tax_exemption_reason_id,
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

          // Validate the formatted data
          const errors = validateReceiptData(formattedData);
          setValidationErrors(errors);
        } catch (e) {
          console.log('Result is not valid JSON');
          setParsedData(null);
          setValidationErrors(['Invalid JSON format received from AI']);
        }
      } else {
        setParsedData(null);
        setValidationErrors(['No data received from AI']);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user?.roles.includes('admin')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('expense_tracking_dashboard_title')}</title>
      </Head>
      <AdminLayout isBookingEnabled={true}>
        <div className="max-w-screen-lg flex flex-col gap-6">
          <Heading level={1}>{t('expense_tracking_dashboard_title')}</Heading>

          <section className="flex flex-col gap-4">
            <UploadForm
              onFileSelect={handleFileSelect}
              onParseWithLLM={handleParseWithLLM}
              file={file}
              photo={photo}
              loading={loading}
            />

            <div>
              {parsedData && (
                <div className="space-y-4">
                  {parsedData.vat_summary &&
                    parsedData.vat_summary.length > 0 && (
                      <ExtractedDataForm
                        editableData={editableData}
                        description={description}
                        category={category}
                        comment={comment}
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
                        onTaxExemptionReasonChange={
                          handleTaxExemptionReasonChange
                        }
                        onDescriptionChange={setDescription}
                        onCategoryChange={setCategory}
                        onCommentChange={setComment}
                        onVatSummaryChange={handleVatSummaryChange}
                        onAddVatSummaryRow={handleAddVatSummaryRow}
                        onDeleteVatSummaryRow={handleDeleteVatSummaryRow}
                        onUploadToToconline={handleUploadToToconline}
                      />
                    )}
                </div>
              )}
            </div>
          </section>

          <ExpenseChargesListing charges={(charges as any) || []} />
        </div>
      </AdminLayout>
    </>
  );
};

ExpenseTrackingDashboardPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const [chargesRes, generalConfigRes, messages] = await Promise.all([
      api
        .get('/charge', {
          params: {
            where: {
              type: 'expense',
            },
            sort_by: '-created',
            limit: 3000,
          },
        })
        .catch(() => {
          return null;
        }),
      api.get('/config/general').catch(() => {
        return null;
      }),

      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalConfigRes?.data?.results?.value;
    const charges = chargesRes?.data?.results;

    return {
      charges,
      generalConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      charges: null,
      generalConfig: null,
      messages: null,
    };
  }
};

export default ExpenseTrackingDashboardPage;
