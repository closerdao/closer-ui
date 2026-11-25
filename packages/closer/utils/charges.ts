import type { Charge } from '../types/booking';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

const GROUP = '12.1a';

type Platform = Record<string, any>;
type DateValue = string | Date;
type OneOf = string | { $in: readonly string[] };

// The `where` shapes closer-ui sends to /charge, /count/charge and /sum/charge/:field.
export type ChargeWhere = {
  date?: { $gte?: DateValue; $lte?: DateValue };
  method?: OneOf;
  status?: OneOf | { $ne: string };
  type?: OneOf | { $nin: readonly string[] } | { $ne: string };
  createdBy?: string;
  saleId?: string;
  linkedObjectType?: string;
  linkedObjectId?: string;
  referredBy?: string;
  productId?: { $in: readonly string[] };
  'meta.productType'?: string;
};

export type ChargeListOptions = {
  limit?: number;
  page?: number;
  sortBy?: string;
  cache?: false;
};

type FilterInput = NonNullable<Parameters<typeof trpc.charge.count.query>[0]>;

const iso = (value: DateValue) =>
  value instanceof Date ? value.toISOString() : value;

const toList = (value: OneOf) =>
  typeof value === 'string' ? [value] : [...value.$in];

const toChargeFilter = (where: ChargeWhere): FilterInput => {
  const filter: FilterInput = {};
  if (where.date) {
    if (where.date.$gte) filter.dateFrom = iso(where.date.$gte);
    if (where.date.$lte) filter.dateTo = iso(where.date.$lte);
  }
  if (where.method) filter.methods = toList(where.method);
  if (where.status) {
    if (typeof where.status === 'object' && '$ne' in where.status) {
      filter.excludeStatuses = [where.status.$ne];
    } else filter.statuses = toList(where.status);
  }
  if (where.type) {
    if (typeof where.type === 'object' && '$nin' in where.type) {
      filter.excludeTypes = [...where.type.$nin];
    } else if (typeof where.type === 'object' && '$ne' in where.type) {
      filter.excludeTypes = [where.type.$ne];
    } else filter.types = toList(where.type);
  }
  if (where.createdBy) filter.createdBy = where.createdBy;
  if (where.saleId) filter.saleId = where.saleId;
  if (where.linkedObjectType) filter.linkedObjectType = where.linkedObjectType;
  if (where.linkedObjectId) filter.linkedObjectId = where.linkedObjectId;
  if (where.referredBy !== undefined) filter.referredBy = where.referredBy;
  if (where.productId) filter.productIds = [...where.productId.$in];
  if (where['meta.productType'] !== undefined) {
    filter.productType = where['meta.productType'];
  }
  return filter;
};

// Legacy `GET /charge`, as the axios response the call sites read `data.results` from.
export const listCharges = async <T = Charge>(
  where: ChargeWhere,
  { limit, page, sortBy, cache }: ChargeListOptions = {},
): Promise<{ data: { results: T[] } }> => {
  if (!isTrpcEnabled(GROUP)) {
    return api.get('/charge', {
      params: { where, limit, page, sort_by: sortBy },
      ...(cache === false && { cache }),
    } as Parameters<typeof api.get>[1]);
  }
  const results = await trpc.charge.list
    .query({ ...toChargeFilter(where), limit, page, sortBy })
    .catch(throwApiError);
  return { data: { results: results as unknown as T[] } };
};

// Legacy `GET /sum/charge/:field`. `meta.*` fields are refused by both APIs.
export const sumCharges = async (
  field: string,
  where: ChargeWhere,
): Promise<{ data: { results: number } }> => {
  if (!isTrpcEnabled(GROUP)) {
    return api.get(`/sum/charge/${field}`, { params: { where } });
  }
  const results = await trpc.charge.sum
    .query({ ...toChargeFilter(where), field })
    .catch(throwApiError);
  return { data: { results } };
};

// Legacy `GET /count/charge`.
export const countCharges = async (
  where: ChargeWhere,
): Promise<{ data: { results: number } }> => {
  if (!isTrpcEnabled(GROUP)) {
    return api.get('/count/charge', { params: { where } });
  }
  const results = await trpc.charge.count
    .query(toChargeFilter(where))
    .catch(throwApiError);
  return { data: { results } };
};

// Legacy `DELETE /charge/:id`.
export const removeCharge = async (id: string): Promise<void> => {
  if (!isTrpcEnabled(GROUP)) {
    await api.delete(`/charge/${id}`);
    return;
  }
  await trpc.charge.remove.mutate({ id }).catch(throwApiError);
};

// The platform store's `charge.get`: a failed read resolves with nothing, which the callers' empty-list guards expect.
export const fetchStoreCharges = async (
  platform: Platform,
  filter: { where: ChargeWhere; limit?: number },
): Promise<Charge[] | undefined> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await platform.charge.get(filter);
    return res?.results?.toJS();
  }
  const res = await listCharges(filter.where, { limit: filter.limit }).catch(
    () => undefined,
  );
  return res?.data.results;
};

// Legacy `GET /charges/affiliate`: the unwrapped `results`.
export const fetchAffiliateCharges = async () => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.get('/charges/affiliate');
    return res.data.results;
  }
  return trpc.charge.affiliate.query().catch(throwApiError);
};

// Legacy `POST /charges/record-payout`.
export const recordAffiliatePayout = async (userId: string, amount: number) => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.post('/charges/record-payout', { amount, userId });
    return res.data;
  }
  return trpc.charge.recordPayout
    .mutate({ amount, userId })
    .catch(throwApiError);
};
