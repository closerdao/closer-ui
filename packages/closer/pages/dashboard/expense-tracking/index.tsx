import Head from 'next/head';

import React, { useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import { Button, Card } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import Input from '../../../components/ui/Input';

import { Charge } from 'closer/types/booking';
import Cookies from 'js-cookie';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

type ReceiptData = {
  supplier_business_name: string;
  document_date: string;
  tax_exemption_reason_id?: string;
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

const mockResult = `\`\`\`json
{
  "supplier_business_name": "O CANTINHO MAGICO",
  "document_date": "2025-01-01",
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
    }
  ],
  "receipt_total": 18.59
}
\`\`\``;

const ExpenseTrackingDashboardPage = ({
  charges,
  error,
}: {
  charges: Charge[] | null;
  error?: string | null;
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [parsedData, setParsedData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [editableData, setEditableData] = useState<ReceiptData | null>(null);
  const [toconlineData, setToconlineData] = useState<any>(null);
  const [hasLoggedExpense, setHasLoggedExpense] = useState(false);
  const [uploadedDocumentUrl, setUploadedDocumentUrl] = useState<string | null>(
    null,
  );

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

      // Transform editableData to toconlineData format
      const toconlineFormattedData = {
        document_type: 'FC',
        ...(editableData?.tax_exemption_reason_id && {
          tax_exemption_reason_id: editableData.tax_exemption_reason_id,
        }),
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

      setToconlineData(toconlineFormattedData);
    }
  }, [editableData]);

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

  const handleFileSelect = (selectedFile: File | null) => {
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
    } else if (selectedFile) {
      setResult('Error: Please select a valid image or PDF file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleUploadToToconline = async () => {
    try {
      setHasLoggedExpense(false);
      setLoading(true);
      const res = await api.post('/toconline/expense', {
        toconlineData,
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
            <Card className="bg-background w-full sm:w-[400px]">
              <Heading level={3}>Upload purchase document</Heading>

              <p className="text-sm text-gray-500">
                The photo/scan must include all the items purchased and be fully
                legible. JPG, PNG, GIF, PDF formats are supported.
              </p>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
                className={`block w-full cursor-pointer border-2 border-dashed p-6 rounded-xl text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 text-blue-500'
                    : file
                    ? 'border-green-500 text-green-500'
                    : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                }`}
              >
                {file ? (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">
                      {file.name.length > 33
                        ? (() => {
                            const lastDotIndex = file.name.lastIndexOf('.');
                            if (lastDotIndex === -1) {
                              return `${file.name.substring(0, 30)}...`;
                            }
                            const extension = file.name.substring(lastDotIndex);
                            const nameWithoutExt = file.name.substring(
                              0,
                              lastDotIndex,
                            );
                            const maxNameLength = 33 - extension.length - 3; // 3 for "..."
                            return `${nameWithoutExt.substring(
                              0,
                              maxNameLength,
                            )}...${extension}`;
                          })()
                        : file.name}
                    </span>
                    {photo &&
                      (file?.type === 'application/pdf' ? (
                        <div className="max-w-full h-32 flex items-center justify-center mx-auto rounded border border-gray-300 bg-gray-50">
                          <div className="text-center">
                            <div className="text-2xl mb-1">📄</div>
                            <div className="text-xs text-gray-600">
                              {file.name.length > 33
                                ? (() => {
                                    const lastDotIndex =
                                      file.name.lastIndexOf('.');
                                    if (lastDotIndex === -1) {
                                      return `${file.name.substring(0, 30)}...`;
                                    }
                                    const extension =
                                      file.name.substring(lastDotIndex);
                                    const nameWithoutExt = file.name.substring(
                                      0,
                                      lastDotIndex,
                                    );
                                    const maxNameLength =
                                      33 - extension.length - 3; // 3 for "..."
                                    return `${nameWithoutExt.substring(
                                      0,
                                      maxNameLength,
                                    )}...${extension}`;
                                  })()
                                : file.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              PDF Document
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={photo}
                          alt="Receipt preview"
                          className="max-w-full h-32 object-contain mx-auto rounded"
                        />
                      ))}
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-2" />
                    <span className="text-sm block">
                      Click to upload or drag and drop a receipt image
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Supports JPG, PNG, GIF, PDF
                    </span>
                  </>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    handleFileSelect(e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
              </div>

              <Button
                onClick={handleParseWithLLM}
                isEnabled={Boolean(file && !loading)}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Parse purchase document'
                )}
              </Button>
            </Card>

            <div>
              {parsedData && (
                <div className="space-y-4">
                  {/* VAT Summary Table */}
                  {parsedData.vat_summary &&
                    parsedData.vat_summary.length > 0 && (
                      <Card className="bg-background p-0 sm:p-4 shadow-none sm:shadow-md">
                        <div className="flex justify-between items-center mb-4">
                          <Heading level={3}>Extracted document data</Heading>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm text-gray-500 mb-1">
                            Supplier:
                          </div>
                          <Input
                            type="text"
                            value={editableData?.supplier_business_name || ''}
                            onChange={(e: any) =>
                              handleSupplierChange(e.target.value)
                            }
                          />
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Document date:
                        </div>
                        <Input
                          type="text"
                          value={editableData?.document_date || ''}
                          onChange={(e: any) =>
                            handleDocumentDateChange(e.target.value)
                          }
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
                                  Tax Code
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
                              {editableData?.vat_summary?.map(
                                (summary: any, index: number) => (
                                  <tr key={index}>
                                    <td className="pr-1 py-1 text-sm text-gray-900 font-medium">
                                      <Input
                                        type="text"
                                        value={summary.description || ''}
                                        onChange={(e) =>
                                          handleVatSummaryChange(
                                            index,
                                            'description',
                                            e.target.value,
                                          )
                                        }
                                        className="py-2 px-1"
                                      />
                                    </td>
                                    <td className="px-1 py-1 text-sm text-gray-900 text-center">
                                      <Input
                                        type="number"
                                        value={String(
                                          summary.vat_percentage || 0,
                                        )}
                                        onChange={(e) =>
                                          handleVatSummaryChange(
                                            index,
                                            'vat_percentage',
                                            parseFloat(e.target.value) || 0,
                                          )
                                        }
                                        className="py-2 px-1 bo"
                                      />
                                    </td>
                                    <td className="px-1 py-1 text-sm text-gray-900 text-center">
                                      <Input
                                        type="text"
                                        value={summary.tax_code || ''}
                                        onChange={(e) =>
                                          handleVatSummaryChange(
                                            index,
                                            'tax_code',
                                            e.target.value,
                                          )
                                        }
                                        className="py-2 px-1"
                                      />
                                    </td>
                                    <td className="px-1 py-1 text-sm font-semibold text-gray-900 text-right">
                                      <Input
                                        type="number"
                                        value={String(
                                          summary.total_with_vat || 0,
                                        )}
                                        onChange={(e) =>
                                          handleVatSummaryChange(
                                            index,
                                            'total_with_vat',
                                            parseFloat(e.target.value) || 0,
                                          )
                                        }
                                        className="py-2 px-1 border-none"

                                      />
                                    </td>
                                    <td
                                      className="pl-1 py-1 text-center                                     Бев сдфыыТфьу=Эзд-1 зн-1 еуче-сутеук ищквукЭЮ
"
                                    >
                                      <div className="flex justify-center gap-1">
                                        <button
                                          onClick={() =>
                                            handleDeleteVatSummaryRow(index)
                                          }
                                          disabled={
                                            editableData?.vat_summary.length ===
                                            1
                                          }
                                          className="text-red-600 hover:text-red-800 disabled:text-gray-400 p-1"
                                          title="Delete row"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleAddVatSummaryRow()
                                          }
                                          className="text-blue-600 hover:text-blue-800 p-1"
                                          title="Add row"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                            <tfoot className="border-t">
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-2 py-2 text-sm font-bold  text-right"
                                >
                                  Document Total:
                                </td>
                                <td className="px-2 py-2 text-lg font-bold text-gray-900 text-right">
                                  <Input
                                    type="number"
                                    value={String(
                                      editableData?.receipt_total || 0,
                                    )}
                                    onChange={(e) =>
                                      handleReceiptTotalChange(
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-full p-1  border-none  rounded text-sm font-bold text-right"
                                  />
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Tax Exemption Reason ID */}
                        {editableData?.tax_exemption_reason_id && (
                          <div className="mt-4">
                            <div className="text-sm text-gray-500 mb-1">
                              Tax Exemption Reason ID:
                            </div>
                            <Input
                              type="text"
                              value={editableData.tax_exemption_reason_id}
                              onChange={(e: any) =>
                                handleTaxExemptionReasonChange(e.target.value)
                              }
                              className="py-2 px-1"
                            />
                          </div>
                        )}

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

                        <div className="text-sm text-red-500">
                          WARNING: this action is not reversible. Please
                          carefully review the extracted receipt data before
                          proceeding.
                        </div>
                        <Button
                          onClick={handleUploadToToconline}
                          isEnabled={Boolean(
                            !loading && validationErrors.length === 0,
                          )}
                        >
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
                              <span className="text-xs text-gray-500">
                                (opens in new tab)
                              </span>
                            </div>
                          </div>
                        )}
                      </Card>
                    )}
                </div>
              )}
            </div>
          </section>
        </div>
      </AdminLayout>
    </>
  );
};

ExpenseTrackingDashboardPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const [chargesRes, messages] = await Promise.all([
      api
        .get('/charge', {
          params: {
            where: {
              type: 'expense',
            },
            sort_by: '-created',
            limit: 1000,
          },
        })
        .catch(() => {
          return null;
        }),

      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const charges = chargesRes?.data?.results;

    return {
      charges,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      charges: null,
      messages: null,
    };
  }
};

export default ExpenseTrackingDashboardPage;
