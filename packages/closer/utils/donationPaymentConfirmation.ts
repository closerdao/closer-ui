import api from './api';
import { parseMessageFromError } from './common';

function unwrapDonationResults(data: unknown): {
  status?: string;
  saleId?: string;
  alreadyPaid?: boolean;
} | null {
  const d = data as { results?: unknown } | null;
  const raw = d?.results;
  if (!raw || typeof raw !== 'object') return null;
  if ('value' in raw && (raw as { value: unknown }).value !== undefined) {
    const inner = (raw as {
      value: { status?: string; saleId?: string; alreadyPaid?: boolean };
    }).value;
    return inner && typeof inner === 'object' ? inner : null;
  }
  return raw as { status?: string; saleId?: string; alreadyPaid?: boolean };
}

function isPaymentNotCompleteMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('not completed') ||
    m.includes('has not completed') ||
    m.includes('payment has not completed')
  );
}

export async function postDonationPaymentConfirmation(
  paymentId: string,
  saleId: string,
): Promise<{ alreadyPaid: boolean }> {
  const backoffMs = [0, 700, 700];
  let lastError: unknown;

  for (let attempt = 0; attempt < backoffMs.length; attempt += 1) {
    if (backoffMs[attempt] > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt]));
    }
    try {
      const { data } = await api.post(`/sale/${saleId}/confirm-card`, {
        paymentId,
      });
      const results = unwrapDonationResults(data);
      if (results?.status === 'success') {
        return { alreadyPaid: Boolean(results.alreadyPaid) };
      }
      lastError = new Error('Unexpected confirmation response');
    } catch (err: unknown) {
      lastError = err;
      const msg = parseMessageFromError(err);
      const canRetry =
        attempt < backoffMs.length - 1 && isPaymentNotCompleteMessage(msg);
      if (!canRetry) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(parseMessageFromError(lastError));
}
