import api, { formatSearch } from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type Platform = Record<string, any>;

const salesOn = () => isTrpcEnabled('12.8a');

type FilterInput = NonNullable<Parameters<typeof trpc.sale.count.query>[0]>;
type ManualSaleInput = Parameters<typeof trpc.sale.createManual.mutate>[0];
export type SaleInitInput = Parameters<typeof trpc.sale.init.mutate>[0];

type Values = string | { $in?: readonly string[]; $nin?: readonly string[] };

// The `where`s the UI sends, at the top level or one `$and` deep.
type SaleWhere = {
  _id?: string;
  createdBy?: string;
  product_type?: Values;
  status?: Values;
  created?: { $gte?: string | number };
  $and?: SaleWhere[];
};

const inList = (value: Values | undefined) =>
  typeof value === 'string' ? [value] : value?.$in && [...value.$in];

const ninList = (value: Values | undefined) =>
  typeof value === 'object' && value.$nin ? [...value.$nin] : undefined;

export const toSaleFilterInput = (
  where: Record<string, unknown> = {},
): FilterInput => {
  const input: FilterInput = {};
  const root = where as SaleWhere;
  for (const clause of [root, ...(root.$and ?? [])]) {
    if (clause._id !== undefined) input.id = clause._id;
    if (clause.createdBy !== undefined) input.createdBy = clause.createdBy;
    const productTypes = inList(clause.product_type);
    if (productTypes) input.productTypes = productTypes;
    const excluded = ninList(clause.product_type);
    if (excluded) input.excludeProductTypes = excluded;
    const statuses = inList(clause.status);
    if (statuses) input.statuses = statuses;
    if (clause.created?.$gte !== undefined)
      input.createdFrom = clause.created.$gte;
  }
  return input;
};

export type SaleListParams = {
  where?: Record<string, unknown>;
  limit?: number;
  page?: number;
  sort_by?: string;
  sort?: string;
};

const toListInput = ({ where, limit, page, sort_by }: SaleListParams) => ({
  ...toSaleFilterInput(where),
  ...(limit !== undefined && { limit }),
  ...(page !== undefined && { page }),
  ...(sort_by !== undefined && { sortBy: sort_by }),
});

// Legacy `GET /sale`; resolves to its `results`. Legacy ignores `sort`, so tRPC gets no sort for it either.
export const fetchSales = async (
  params: SaleListParams,
  config: { cache?: false; signal?: AbortSignal } = {},
): Promise<unknown> => {
  if (!salesOn()) {
    const res = await api.get('/sale', {
      params: { ...params, where: params.where && formatSearch(params.where) },
      ...config,
    } as Parameters<typeof api.get>[1]);
    return res?.data?.results;
  }
  return trpc.sale.list
    .query(toListInput(params), { signal: config.signal })
    .catch(throwApiError);
};

// The store's `get(filter)`; resolves the store's action, never rejects.
export const loadSales = (
  platform: Platform,
  filter: SaleListParams,
  opts: { force?: boolean } = {},
) =>
  salesOn()
    ? platform.sale.get(filter, {
        ...opts,
        load: () =>
          trpc.sale.list
            .query(toListInput({ sort_by: '-created', ...filter }))
            .catch(throwApiError),
      })
    : platform.sale.get(filter, opts);

// The store's `getCount(filter)`, where `findCount(filter)` reads it; legacy drops the raw-object `where` (no qs parser), so tRPC counts every visible sale too.
export const loadSaleCount = (platform: Platform, filter: SaleListParams) =>
  salesOn()
    ? platform.sale.getCount(filter, {
        load: () => trpc.sale.count.query().catch(throwApiError),
      })
    : platform.sale.getCount(filter);

// Legacy `GET /count/sale`, which drops this `where` as the store's count does; resolves to the legacy body `{ results }`.
export const countSales = async (where: Record<string, unknown>) => {
  if (!salesOn()) {
    const res = await api.get('/count/sale', { params: { where } });
    return res.data;
  }
  const results = await trpc.sale.count.query().catch(throwApiError);
  return { results };
};

// Legacy `GET /sum/sale/:field`, which drops this `where` too; resolves to the legacy body `{ results }`.
export const sumSales = async (
  field: string,
  where: Record<string, unknown>,
) => {
  if (!salesOn()) {
    const res = await api.get(`/sum/sale/${field}`, { params: { where } });
    return res.data;
  }
  const results = await trpc.sale.sum.query({ field }).catch(throwApiError);
  return { results };
};

// Legacy `POST /sale/manual`; resolves to its `results`.
export const createManualSale = async (body: ManualSaleInput) => {
  if (!salesOn()) {
    const { data } = await api.post('/sale/manual', body);
    return data?.results;
  }
  return trpc.sale.createManual.mutate(body).catch(throwApiError);
};

// Legacy `POST /sale/buyer-match`.
export const matchSaleBuyer = async (body: {
  saleId: string;
  matchedSaleId: string;
}): Promise<void> => {
  if (!salesOn()) {
    await api.post('/sale/buyer-match', body);
    return;
  }
  await trpc.sale.matchBuyer.mutate(body).catch(throwApiError);
};

// Legacy `POST /sale/init`; resolves to its `results`.
export const initSale = async (body: SaleInitInput): Promise<unknown> => {
  if (!salesOn()) {
    const { data } = await api.post('/sale/init', body);
    return data?.results;
  }
  return trpc.sale.init.mutate(body).catch(throwApiError);
};

// Legacy `POST /sale/:id/confirm-card`; resolves to its `results`.
export const confirmSaleCard = async (
  saleId: string,
  paymentId: string,
): Promise<unknown> => {
  if (!salesOn()) {
    const { data } = await api.post(`/sale/${saleId}/confirm-card`, {
      paymentId,
    });
    return data?.results;
  }
  return trpc.sale.confirmCard
    .mutate({ id: saleId, paymentId })
    .catch(throwApiError);
};

// Legacy `POST /sale/:id/confirm-crypto`.
export const confirmSaleCrypto = async (
  saleId: string,
  txHash: string,
): Promise<void> => {
  if (!salesOn()) {
    await api.post(`/sale/${saleId}/confirm-crypto`, { txHash });
    return;
  }
  await trpc.sale.confirmCrypto
    .mutate({ id: saleId, txHash })
    .catch(throwApiError);
};

// Legacy `POST /sale/:id/confirm-token-sale`.
export const confirmTokenSale = async (
  saleId: string,
  txHash: unknown,
): Promise<void> => {
  if (!salesOn()) {
    await api.post(`/sale/${encodeURIComponent(saleId)}/confirm-token-sale`, {
      txHash,
    });
    return;
  }
  await trpc.sale.confirmTokenSale
    .mutate({ id: saleId, txHash })
    .catch(throwApiError);
};
