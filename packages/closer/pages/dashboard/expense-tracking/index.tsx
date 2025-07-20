import Head from 'next/head';

import React, { useState } from 'react';

import { Charge } from '@/types/booking';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import { Button, Card } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import { Upload } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

type ReceiptData = {
  document_type: string;
  supplier_business_name: string;
  lines: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
};

const mockResult = {
  document_type: 'FC',
  supplier_business_name: 'REAL PORTUGUESE CUISINE',
  lines: [
    {
      description: 'PAO',
      quantity: 2,
      unit_price: 0.8,
    },
    {
      description: 'COUVERT COMPLETO',
      quantity: 1,
      unit_price: 6.2,
    },
    {
      description: 'COGUMELOS RECHEADOS',
      quantity: 1,
      unit_price: 8.2,
    },
    {
      description: 'VIEIRAS GRELHADAS',
      quantity: 1,
      unit_price: 9.2,
    },
    {
      description: 'CORNEDO C/MOLHO PIME',
      quantity: 1,
      unit_price: 19.5,
    },
    {
      description: 'BUCHECHAS PORCO IBER',
      quantity: 1,
      unit_price: 16.9,
    },
    {
      description: 'AGUA S/GAS 1LT',
      quantity: 1,
      unit_price: 2.0,
    },
    {
      description: 'ALVOR REGIONAL',
      quantity: 1,
      unit_price: 16.0,
    },
    {
      description: 'MUSSE LIMA',
      quantity: 1,
      unit_price: 3.9,
    },
    {
      description: 'CREME BRULEE',
      quantity: 1,
      unit_price: 3.9,
    },
  ],
};
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

  // Validate test data on mount
  React.useEffect(() => {
    if (parsedData) {
      const errors = validateReceiptData(parsedData);
      setValidationErrors(errors);
    }
  }, [parsedData]);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile) {
      setResult('Error: Please select a valid image file');
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
    if (!data.document_type || data.document_type !== 'FC') {
      errors.push('Invalid document type. Must be "FC"');
    }

    if (
      !data.supplier_business_name ||
      data.supplier_business_name.trim() === ''
    ) {
      errors.push('Supplier business name is required');
    }

    // Check lines array
    if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
      errors.push('Receipt must have at least one line item');
      return errors;
    }

    // Validate each line
    data.lines.forEach((line: any, index: number) => {
      if (!line.description || line.description.trim() === '') {
        errors.push(`Line ${index + 1}: Description is required`);
      }

      if (
        line.quantity === undefined ||
        line.quantity === null ||
        line.quantity <= 0
      ) {
        errors.push(`Line ${index + 1}: Quantity must be greater than 0`);
      }

      if (
        line.unit_price === undefined ||
        line.unit_price === null ||
        line.unit_price <= 0
      ) {
        errors.push(`Line ${index + 1}: Unit price must be greater than 0`);
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
      setLoading(true);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
    console.log('Uploading to Toconline API');
  };

  const handleParseWithLLM = async () => {
    if (!file) return;
    setLoading(true);

    try {
      console.log('Uploading file:', file.name, file.type, file.size);

      const formData = new FormData();
      formData.append('file', file);

      console.log('Making request to /api/parse-receipt');
      const res = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: formData,
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
      console.log('Response data:', data);
      setResult(data.text || data.error || 'No output');

      // Try to parse the result as JSON for display
      if (data.text) {
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

          // Ensure the parsed data matches the exact format of mockResult
          const formattedData: ReceiptData = {
            document_type: parsed.document_type || 'FC',
            supplier_business_name: parsed.supplier_business_name || '',
            lines: Array.isArray(parsed.lines)
              ? parsed.lines.map((line: any) => ({
                  description: line.description || '',
                  quantity:
                    typeof line.quantity === 'number' ? line.quantity : 1,
                  unit_price:
                    typeof line.unit_price === 'number' ? line.unit_price : 0,
                }))
              : [],
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
              <Heading level={3}>Upload Receipt</Heading>

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
                      {file.name}
                    </span>
                    {photo && (
                      <img
                        src={photo}
                        alt="Receipt preview"
                        className="max-w-full h-32 object-contain mx-auto rounded"
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-2" />
                    <span className="text-sm block">
                      Click to upload or drag and drop a receipt image
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Supports JPG, PNG, GIF
                    </span>
                  </>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
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
                {loading ? 'Processing...' : 'Parse receipt'}
              </Button>
            </Card>

            <div>
              {parsedData && (
                <div className="space-y-4">
                  {/* Items Table */}
                  {parsedData.lines && parsedData.lines.length > 0 && (
                    <Card className="bg-background">
                      <Heading level={3}>Extracted Receipt Details</Heading>

                      <div>
                        <div className="text-sm text-gray-500">Supplier:</div>
                        <p className="text-md font-semibold text-gray-900">
                          {parsedData.supplier_business_name || 'N/A'}
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b">
                            <tr>
                              <th className="px-2  py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Qty
                              </th>
                              <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unit Price
                              </th>
                              <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {parsedData.lines.map(
                              (line: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-2 py-1 text-sm text-gray-900 font-medium">
                                    {line.description || 'N/A'}
                                  </td>
                                  <td className="px-2 py-1 text-sm text-gray-900 text-center">
                                    {line.quantity || 1}
                                  </td>
                                  <td className="px-2 py-1 text-sm text-gray-900 text-right">
                                    {line.unit_price
                                      ? `€${parseFloat(line.unit_price).toFixed(
                                          2,
                                        )}`
                                      : 'N/A'}
                                  </td>
                                  <td className="px-2 py-1 text-sm font-semibold text-gray-900 text-right">
                                    {line.quantity && line.unit_price
                                      ? `€${(
                                          parseFloat(line.quantity) *
                                          parseFloat(line.unit_price)
                                        ).toFixed(2)}`
                                      : 'N/A'}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                          <tfoot className="bg-gray-100">
                            <tr>
                              <td
                                colSpan={3}
                                className="px-2 py-2 text-sm font-bold text-gray-700 text-right"
                              >
                                Total:
                              </td>
                              <td className="px-2 py-2 text-lg font-bold text-gray-900 text-right">
                                €
                                {parsedData.lines
                                  .reduce((sum: number, line: any) => {
                                    const quantity =
                                      parseFloat(line.quantity) || 1;
                                    const unitPrice =
                                      parseFloat(line.unit_price) || 0;
                                    return sum + quantity * unitPrice;
                                  }, 0)
                                  .toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
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

                      <div className="text-sm text-red-500">
                        WARNING: this action is not reversible. Please carefully
                        review the extracted receipt data before proceeding.
                      </div>
                      <Button
                        onClick={handleUploadToToconline}
                        isEnabled={Boolean(
                          !loading && validationErrors.length === 0,
                        )}
                      >
                        {loading
                          ? 'Processing...'
                          : 'Upload receipt to Toconline API'}
                      </Button>
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
