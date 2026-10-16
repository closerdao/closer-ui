import { computeTokensOwed, stakeStayTokens } from './stays.api';

const RETRY_BUDGET_MS = 120_000;
const RETRY_DELAY_MS = 2000;
export const STAKE_VERIFICATION_REQUEST_TIMEOUT_MS = 15_000;

export const stakeVerificationDelayedError = () =>
  Object.assign(new Error('Booking verification is delayed.'), {
    code: 'TOKEN_STAKE_VERIFICATION_DELAYED',
  });

export const isStakeVerificationAborted = (error: any): boolean =>
  error?.name === 'AbortError' || error?.code === 'ERR_CANCELED';

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted)
    throw new DOMException('Verification stopped.', 'AbortError');
};

const waitForRetry = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    throwIfAborted(signal);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(new DOMException('Verification stopped.', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });

// Retry only an explicit pending response, which the backend returns before
// recording a charge. A lost response has an unknown outcome: leave it for
// manual recovery instead of automatically submitting another request.
export const verifyStayTokenStake = async (
  stayId: string,
  transactionId: string,
  signal?: AbortSignal,
  options?: { transactionIds?: string[]; recovery?: boolean },
) => {
  const deadline = Date.now() + RETRY_BUDGET_MS;
  for (;;) {
    throwIfAborted(signal);
    try {
      const result = await stakeStayTokens(stayId, transactionId, {
        ...(transactionId && !options?.recovery
          ? {}
          : { syncBookingAlreadyOnChain: true }),
        ...(options?.transactionIds?.length && {
          transactionIds: options.transactionIds,
        }),
        signal,
        timeout: STAKE_VERIFICATION_REQUEST_TIMEOUT_MS,
      });
      throwIfAborted(signal);
      if (
        !result.verified &&
        !(
          (!transactionId || options?.recovery) &&
          result.stakingStatus?.status !== 'needs-review' &&
          computeTokensOwed(result.booking) === 0
        )
      )
        throw stakeVerificationDelayedError();
      return result;
    } catch (error: any) {
      throwIfAborted(signal);
      if (isStakeVerificationAborted(error)) throw error;
      if (
        error?.response?.status !== 409 ||
        error?.response?.data?.details?.code !==
          'TOKEN_STAKE_VERIFICATION_PENDING'
      ) {
        if (error?.isAxiosError && !error.response)
          throw stakeVerificationDelayedError();
        throw error;
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw stakeVerificationDelayedError();
      await waitForRetry(Math.min(RETRY_DELAY_MS, remaining), signal);
      if (Date.now() >= deadline) throw stakeVerificationDelayedError();
    }
  }
};
