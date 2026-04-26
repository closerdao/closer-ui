import api, { formatSearch } from './api';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

export async function fetchDonationSaleStatus(saleId: string): Promise<string | undefined> {
  const res = await api.get('/sale', {
    params: {
      where: formatSearch({ _id: saleId }),
      limit: 1,
    },
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
): Promise<boolean> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i += 1) {
    const status = await fetchDonationSaleStatus(saleId);
    onPoll?.(status);
    if (status === 'paid') {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return false;
}
