import { UPLOAD_FILE_PATH } from '../constants';
import { FileUploadResult } from '../types/api';
import { FinanceApplication } from '../types/subscriptions';
import api from './api';

export type FinanceApplyPaymentRequest = {
  amount: number;
  proofUrl: string;
  method?: string;
  date?: string;
  note?: string;
};

export type FinanceApplyPaymentResponse = {
  results?: FinanceApplication;
  status?: string;
};

export const uploadFinancePaymentProof = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ results: FileUploadResult }>(
    UPLOAD_FILE_PATH,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  const url = data?.results?.url;
  if (!url) {
    throw new Error('Upload did not return a file URL');
  }
  return url;
};

export const applyFinancePayment = async (
  applicationId: string,
  body: FinanceApplyPaymentRequest,
): Promise<FinanceApplication | null> => {
  const response = await api.post<FinanceApplyPaymentResponse>(
    `/token/financeapplication/${applicationId}/apply-payment`,
    body,
  );
  return response?.data?.results || null;
};

export const isAllowedFinancePaymentProofFile = (file: File): boolean =>
  file.type.startsWith('image/') || file.type === 'application/pdf';

export const getNextFinancePaymentRemainingDue = (
  application: FinanceApplication | null | undefined,
  fallbackMonthlyDue: number,
): number => {
  if (!application) {
    return 0;
  }
  const rows = Object.entries(application.paymentsScheduled || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);

  for (const row of rows) {
    if (row.status === 'paid') {
      continue;
    }
    const due =
      typeof row.amountDue === 'number' && Number.isFinite(row.amountDue)
        ? row.amountDue
        : fallbackMonthlyDue;
    const paid = Number(row.amountPaid || 0);
    const remaining = Math.round((due - paid + Number.EPSILON) * 100) / 100;
    if (remaining > 0) {
      return remaining;
    }
  }

  return 0;
};
