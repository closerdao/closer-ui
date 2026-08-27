import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

import { FileText, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FinanceApplication } from '../../types/subscriptions';
import { parseMessageFromError } from '../../utils/common';
import {
  applyFinancePayment,
  getNextFinancePaymentRemainingDue,
  isAllowedFinancePaymentProofFile,
  uploadFinancePaymentProof,
} from '../../utils/financeApplyPayment';
import { getFinancedMonthlyAmountDue } from '../../utils/financeApplicationMonthlyDue';
import { Button, Heading, Input } from '../ui';
import Dropdown from '../ui/Select/Dropdown';

const PAYMENT_METHODS = ['cash', 'crypto', 'bank-transfer', 'other'] as const;

interface FinancedApplyPaymentFormProps {
  applicationId: string;
  application: FinanceApplication;
  onApplied: (updated: FinanceApplication | null) => Promise<void> | void;
}

const FinancedApplyPaymentForm = ({
  applicationId,
  application,
  onApplied,
}: FinancedApplyPaymentFormProps) => {
  const t = useTranslations();
  const scheduleCount = Object.keys(application.paymentsScheduled || {}).length;
  const fallbackMonthlyDue = getFinancedMonthlyAmountDue(
    application,
    scheduleCount,
  );
  const suggestedAmount = useMemo(
    () => getNextFinancePaymentRemainingDue(application, fallbackMonthlyDue),
    [application, fallbackMonthlyDue],
  );

  const [amount, setAmount] = useState(
    suggestedAmount > 0 ? String(suggestedAmount) : '',
  );
  const [paymentDate, setPaymentDate] = useState('');
  const [method, setMethod] = useState('bank-transfer');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (suggestedAmount > 0) {
      setAmount(String(suggestedAmount));
    }
  }, [suggestedAmount, application._id]);

  useEffect(() => {
    return () => {
      if (proofPreviewUrl) {
        URL.revokeObjectURL(proofPreviewUrl);
      }
    };
  }, [proofPreviewUrl]);

  const clearProof = () => {
    if (proofPreviewUrl) {
      URL.revokeObjectURL(proofPreviewUrl);
    }
    setProofFile(null);
    setProofPreviewUrl(null);
  };

  const handleProofSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    setError('');
    setSuccess('');
    if (!file) {
      return;
    }
    if (!isAllowedFinancePaymentProofFile(file)) {
      setError(t('token_sales_dashboard_financed_apply_payment_proof_invalid'));
      return;
    }
    if (proofPreviewUrl) {
      URL.revokeObjectURL(proofPreviewUrl);
    }
    setProofFile(file);
    setProofPreviewUrl(
      file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!proofFile || !(Number(amount) > 0)) {
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      setIsUploading(true);
      const proofUrl = await uploadFinancePaymentProof(proofFile);
      setIsUploading(false);

      const body: {
        amount: number;
        proofUrl: string;
        method: string;
        date?: string;
        note?: string;
      } = {
        amount: Number(amount),
        proofUrl,
        method,
      };
      if (paymentDate.trim()) {
        body.date = paymentDate.trim();
      }
      if (note.trim()) {
        body.note = note.trim();
      }

      const updated = await applyFinancePayment(applicationId, body);
      await onApplied(updated);
      clearProof();
      setNote('');
      setPaymentDate('');
      setSuccess(t('token_sales_dashboard_financed_apply_payment_success'));
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !isSubmitting &&
    !isUploading &&
    Number(amount) > 0 &&
    Boolean(proofFile);

  return (
    <div className="flex flex-col gap-3">
      <Heading level={4}>
        {t('token_sales_dashboard_financed_apply_payment_title')}
      </Heading>
      <p className="text-sm text-gray-600">
        {t('token_sales_dashboard_financed_apply_payment_intro')}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label={t('token_sales_dashboard_financed_apply_payment_amount')}
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          label={t('token_sales_dashboard_financed_apply_payment_date')}
          type="date"
          value={paymentDate}
          onChange={(event) => setPaymentDate(event.target.value)}
        />
        <Dropdown
          label={t('token_sales_dashboard_financed_apply_payment_method')}
          value={method}
          options={PAYMENT_METHODS.map((value) => ({
            value,
            label: t(
              `token_sales_dashboard_financed_apply_payment_method_${value.replace(
                '-',
                '_',
              )}`,
            ),
          }))}
          onChange={(value: string) => setMethod(value)}
        />
        <Input
          label={t('token_sales_dashboard_financed_apply_payment_note')}
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t(
            'token_sales_dashboard_financed_apply_payment_note_placeholder',
          )}
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            {t('token_sales_dashboard_financed_apply_payment_proof')}
          </p>
          <label
            htmlFor="finance-payment-proof"
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors ${
              proofFile
                ? 'border-accent bg-accent-light'
                : 'border-gray-300 hover:border-accent'
            }`}
          >
            {proofFile ? (
              <>
                {proofPreviewUrl ? (
                  <img
                    src={proofPreviewUrl}
                    alt={proofFile.name}
                    className="max-h-32 object-contain"
                  />
                ) : (
                  <FileText className="h-10 w-10 text-gray-500" />
                )}
                <span className="text-sm text-gray-700 break-all">
                  {proofFile.name}
                </span>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {t('token_sales_dashboard_financed_apply_payment_proof_hint')}
                </span>
              </>
            )}
            <input
              id="finance-payment-proof"
              type="file"
              accept="image/*,.pdf,application/pdf"
              className="hidden"
              onChange={handleProofSelected}
            />
          </label>
          {proofFile && (
            <Button
              type="button"
              variant="secondary"
              isFullWidth={false}
              onClick={clearProof}
              className="self-start"
            >
              <span className="inline-flex items-center gap-1">
                <X className="h-3.5 w-3.5" />
                {t('token_sales_dashboard_financed_apply_payment_proof_clear')}
              </span>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" isLoading={isSubmitting || isUploading} isEnabled={canSubmit}>
            {isUploading
              ? t('token_sales_dashboard_financed_apply_payment_uploading')
              : t('token_sales_dashboard_financed_apply_payment_submit')}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </div>
      </form>
    </div>
  );
};

export default FinancedApplyPaymentForm;
