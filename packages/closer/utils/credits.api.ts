import type {
  CreditTokenPaymentConfirmResponse,
  CreditTokenPaymentQuote,
} from '../types/api';
import api from './api';

type ApiOk<T> = { results: T };

/**
 * Step 1 of paying for credits in stablecoin: ask the API what to send and
 * where. Mirrors POST /stays/:id/token-payment — same two-step shape, same
 * treasury, so a village configures one wallet and both flows use it.
 */
export const quoteCreditsTokenPayment = async (
  creditsAmount: number,
): Promise<CreditTokenPaymentQuote> => {
  const { data } = await api.post('/credits/payment/token', { creditsAmount });
  return (data as ApiOk<CreditTokenPaymentQuote>).results;
};

/**
 * Step 2: hand over the hash of the client-side transfer. Idempotent on
 * txHash. A 400 "could not be verified" usually means the explorer has not
 * indexed the transfer yet — see isCreditsTokenPaymentNotIndexedError.
 */
export const confirmCreditsTokenPayment = async (
  creditsAmount: number,
  txHash: string,
): Promise<CreditTokenPaymentConfirmResponse> => {
  const { data } = await api.post('/credits/payment/token', {
    creditsAmount,
    txHash,
  });
  const results = (
    data as ApiOk<Partial<CreditTokenPaymentConfirmResponse>> | undefined
  )?.results;

  return {
    creditsAmount: results?.creditsAmount ?? creditsAmount,
    balance:
      typeof results?.balance === 'number' ? results.balance : null,
    verified: Boolean(results?.verified),
  };
};

/**
 * True for the 400 the API answers while the block explorer has not indexed
 * the transfer yet — safe to retry after a few seconds.
 */
export const isCreditsTokenPaymentNotIndexedError = (
  message: string,
): boolean => /could not be verified/i.test(message);
