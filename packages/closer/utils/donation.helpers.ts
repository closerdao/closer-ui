import api, { formatSearch } from './api';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

function abortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Aborted', 'AbortError');
  }
  const e = new Error('Aborted');
  e.name = 'AbortError';
  return e;
}

function isCanceledLike(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const o = err as { code?: string; name?: string };
  if (o.code === 'ERR_CANCELED' || o.name === 'CanceledError' || o.name === 'AbortError') {
    return true;
  }
  return false;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(abortError());
  }
  if (!signal) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(abortError());
    };
    signal.addEventListener('abort', onAbort);
  });
}

export async function fetchDonationSaleStatus(
  saleId: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const res = await api.get('/sale', {
    params: {
      where: formatSearch({ _id: saleId }),
      limit: 1,
    },
    signal,
  });
  const rows = res.data?.results;
  const list = Array.isArray(rows)
    ? rows
    : rows && typeof (rows as { toJS?: () => unknown[] }).toJS === 'function'
      ? (rows as { toJS: () => unknown[] }).toJS()
      : [];
  const first = list[0] as { status?: string } | undefined;
  return first?.status;
}

export async function pollDonationSaleUntilPaid(
  saleId: string,
  onPoll?: (status: string | undefined) => void,
  options?: { signal?: AbortSignal },
): Promise<boolean> {
  const { signal } = options ?? {};
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i += 1) {
    if (signal?.aborted) {
      return false;
    }
    let status: string | undefined;
    try {
      status = await fetchDonationSaleStatus(saleId, signal);
    } catch (err: unknown) {
      if (signal?.aborted || isCanceledLike(err)) {
        return false;
      }
      throw err;
    }
    if (signal?.aborted) {
      return false;
    }
    onPoll?.(status);
    if (status === 'paid') {
      return true;
    }
    try {
      await sleep(POLL_INTERVAL_MS, signal);
    } catch {
      return false;
    }
  }
  return false;
}
